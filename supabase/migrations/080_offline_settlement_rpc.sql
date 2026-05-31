-- =========================================================================
-- Migration 080: Secure offline payment settlement via RPC
-- -------------------------------------------------------------------------
-- Closes RLS gap: contractors could mark payments "released" via direct UPDATE.
-- All offline settlements must go through settle_offline_payment(), which
-- validates contractor ownership, pending status, and contract.payment_handling.
-- =========================================================================

-- 1. Restrict direct UPDATE to dispute-only (in_escrow -> disputed)
DROP POLICY IF EXISTS "Contractors can update their own payments (dispute)" ON contractor_payments;

CREATE POLICY "Contractors can dispute escrow payments"
  ON contractor_payments
  FOR UPDATE
  USING (
    contractor_id = auth.uid()
    AND status = 'in_escrow'
  )
  WITH CHECK (
    contractor_id = auth.uid()
    AND status = 'disputed'
    AND dispute_reason IS NOT NULL
  );

-- 2. SECURITY DEFINER RPC for offline settlement
CREATE OR REPLACE FUNCTION settle_offline_payment(
  payment_id UUID,
  method TEXT DEFAULT 'transfer',
  note TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_payment contractor_payments%ROWTYPE;
  v_contract contracts%ROWTYPE;
  v_pro_name TEXT;
  v_method TEXT;
  v_note TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  v_method := COALESCE(NULLIF(TRIM(method), ''), 'transfer');
  IF v_method NOT IN ('transfer', 'cheque', 'cash') THEN
    RAISE EXCEPTION 'Invalid payment method';
  END IF;

  v_note := NULLIF(TRIM(note), '');
  IF v_note IS NOT NULL AND length(v_note) > 500 THEN
    RAISE EXCEPTION 'Note too long (max 500 characters)';
  END IF;

  SELECT * INTO v_payment
  FROM contractor_payments
  WHERE id = payment_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment not found';
  END IF;

  IF auth.uid() <> v_payment.contractor_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  IF v_payment.status <> 'pending' THEN
    RAISE EXCEPTION 'Payment is not pending';
  END IF;

  IF v_payment.contract_id IS NULL THEN
    RAISE EXCEPTION 'Payment has no linked contract';
  END IF;

  SELECT * INTO v_contract
  FROM contracts
  WHERE id = v_payment.contract_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contract not found';
  END IF;

  IF COALESCE(v_contract.payment_handling, 'platform') <> 'offline' THEN
    RAISE EXCEPTION 'Offline settlement not allowed for this contract';
  END IF;

  UPDATE contractor_payments
  SET
    status = 'released',
    payment_method = v_method,
    released_at = COALESCE(released_at, NOW()),
    metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object(
      'settled_offline', true,
      'settlement_note', v_note,
      'settled_at', NOW()
    ),
    updated_at = NOW()
  WHERE id = payment_id;

  -- Notify client (trigger 078 marks linked invoice as paid)
  IF v_payment.client_id IS NOT NULL THEN
    SELECT COALESCE(company_name, full_name, 'L''entrepreneur')
    INTO v_pro_name
    FROM profiles
    WHERE id = v_payment.contractor_id;

    INSERT INTO notifications (
      user_id, type, title, message,
      related_user_id, related_project_id, action_url, metadata
    ) VALUES (
      v_payment.client_id,
      'payment_received',
      'Paiement confirmé',
      COALESCE(v_pro_name, 'L''entrepreneur')
        || ' a confirmé la réception du paiement pour « '
        || COALESCE(v_payment.milestone, 'le jalon')
        || ' » (' || v_payment.amount::TEXT || ' $).',
      v_payment.contractor_id,
      v_payment.project_id,
      '/dashboard/payments',
      jsonb_build_object(
        'payment_id', payment_id,
        'contract_id', v_payment.contract_id,
        'milestone', v_payment.milestone,
        'method', v_method,
        'settled_offline', true
      )
    );
  END IF;

  RETURN payment_id;
END;
$$;

COMMENT ON FUNCTION settle_offline_payment IS
  'Contractor marks an offline payment as received. Validates ownership, pending status, and contract.payment_handling = offline.';

GRANT EXECUTE ON FUNCTION settle_offline_payment(UUID, TEXT, TEXT) TO authenticated;
