-- Migration 068: Auto-generate invoice + payment when a milestone is approved
-- Date: 2026-05-27
-- When contract_milestones.status transitions to 'approved', this trigger:
--   1. Inserts a row in invoices (status='pending', auto-numbered, TPS+TVQ ~14.975%)
--   2. Inserts a row in contractor_payments (status='pending')
--   3. Notifies the entrepreneur ("Paiement à venir")
--   4. Notifies the client ("Facture émise")
-- Idempotent: skips if a payment already exists for the milestone.

CREATE OR REPLACE FUNCTION on_milestone_approved()
RETURNS TRIGGER AS $$
DECLARE
  v_contract RECORD;
  v_client_name TEXT;
  v_pro_name TEXT;
  v_project_title TEXT;
  v_invoice_number TEXT;
  v_invoice_id UUID;
  v_payment_id UUID;
  v_tax_rate NUMERIC := 14.975;
  v_amount_ht NUMERIC;
  v_tax_amount NUMERIC;
  v_amount_ttc NUMERIC;
BEGIN
  -- Skip if no real transition or status is not 'approved'
  IF NEW.status <> 'approved' OR OLD.status = 'approved' THEN
    RETURN NEW;
  END IF;

  -- Skip if a payment already exists for this milestone (idempotency)
  IF EXISTS (SELECT 1 FROM contractor_payments WHERE milestone_id = NEW.id) THEN
    RETURN NEW;
  END IF;

  -- Load the parent contract
  SELECT c.id, c.client_id, c.professional_id, c.project_id, c.currency, c.title
  INTO v_contract
  FROM contracts c
  WHERE c.id = NEW.contract_id;

  IF v_contract.id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Resolve display names
  SELECT COALESCE(company_name, full_name, 'Client') INTO v_client_name
  FROM profiles WHERE id = v_contract.client_id;

  SELECT COALESCE(company_name, full_name, 'Entrepreneur') INTO v_pro_name
  FROM profiles WHERE id = v_contract.professional_id;

  SELECT title INTO v_project_title
  FROM projects WHERE id = v_contract.project_id;

  -- Compute tax-inclusive amounts (Quebec combined GST/QST 14.975%)
  v_amount_ht := NEW.amount;
  v_tax_amount := ROUND(v_amount_ht * v_tax_rate / 100, 2);
  v_amount_ttc := v_amount_ht + v_tax_amount;

  -- Generate invoice number
  v_invoice_number := generate_invoice_number();

  -- Insert invoice
  INSERT INTO invoices (
    contractor_id, contract_id, milestone_id, client_id,
    invoice_number, client_name, client_address,
    project_title, milestone,
    amount, tax, total, currency,
    status, payment_method,
    issued_at, due_at, metadata
  ) VALUES (
    v_contract.professional_id, v_contract.id, NEW.id, v_contract.client_id,
    v_invoice_number, COALESCE(v_client_name, 'Client'), NULL,
    COALESCE(v_project_title, v_contract.title), NEW.title,
    v_amount_ht, v_tax_amount, v_amount_ttc, COALESCE(v_contract.currency, 'CAD'),
    'pending', 'transfer',
    NOW(), NOW() + INTERVAL '30 days',
    jsonb_build_object('auto_generated', true, 'source', 'milestone_approved')
  ) RETURNING id INTO v_invoice_id;

  -- Insert payment (status pending = awaiting Stripe or manual transfer)
  INSERT INTO contractor_payments (
    contractor_id, contract_id, milestone_id, client_id,
    project_id, project_title, client_name, milestone,
    amount, fee, net_amount, currency,
    status, payment_method, metadata
  ) VALUES (
    v_contract.professional_id, v_contract.id, NEW.id, v_contract.client_id,
    v_contract.project_id, COALESCE(v_project_title, v_contract.title),
    COALESCE(v_client_name, 'Client'), NEW.title,
    v_amount_ttc, 0, v_amount_ttc, COALESCE(v_contract.currency, 'CAD'),
    'pending', 'transfer',
    jsonb_build_object('auto_generated', true, 'invoice_id', v_invoice_id, 'invoice_number', v_invoice_number)
  ) RETURNING id INTO v_payment_id;

  -- Notify the entrepreneur (payment incoming)
  INSERT INTO notifications (
    user_id, type, title, message,
    related_user_id, related_project_id, action_url, metadata
  ) VALUES (
    v_contract.professional_id,
    'payment_pending',
    'Paiement à venir',
    'Le jalon "' || NEW.title || '" a été approuvé. Facture ' || v_invoice_number || ' émise.',
    v_contract.client_id,
    v_contract.project_id,
    '/pro/payments',
    jsonb_build_object(
      'milestone_id', NEW.id,
      'contract_id', v_contract.id,
      'invoice_id', v_invoice_id,
      'payment_id', v_payment_id,
      'amount', v_amount_ttc,
      'invoice_number', v_invoice_number
    )
  );

  -- Notify the client (invoice issued)
  INSERT INTO notifications (
    user_id, type, title, message,
    related_user_id, related_project_id, action_url, metadata
  ) VALUES (
    v_contract.client_id,
    'invoice_issued',
    'Facture émise',
    'Facture ' || v_invoice_number || ' émise par ' || COALESCE(v_pro_name, 'l''entrepreneur') || ' pour le jalon "' || NEW.title || '".',
    v_contract.professional_id,
    v_contract.project_id,
    '/contracts',
    jsonb_build_object(
      'milestone_id', NEW.id,
      'contract_id', v_contract.id,
      'invoice_id', v_invoice_id,
      'amount', v_amount_ttc,
      'invoice_number', v_invoice_number
    )
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_milestone_approved ON contract_milestones;
CREATE TRIGGER trigger_milestone_approved
  AFTER UPDATE OF status ON contract_milestones
  FOR EACH ROW
  EXECUTE FUNCTION on_milestone_approved();

COMMENT ON FUNCTION on_milestone_approved IS 'Fires when milestone status becomes approved. Generates invoice + payment + notifies both parties. Idempotent.';
