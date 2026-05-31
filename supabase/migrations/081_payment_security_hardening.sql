-- =========================================================================
-- Migration 081: Durcissement sécurité paiements & contrats
-- -------------------------------------------------------------------------
-- Corrige les failles d'autorisation identifiées lors des audits sécurité
-- et code review du chantier "modes de paiement" :
--   P0.3  Empêcher l'entrepreneur d'auto-approuver un jalon (chaîne self-approve
--         -> auto-paiement). Seul le client peut passer un jalon à 'approved'.
--   P1.4  Le trigger de règlement pose désormais invoices.paid_at.
--   P1.5  contracts.payment_handling devient immuable après une signature.
--   P1.6  Le client ne peut modifier que le statut d'une proposition de contrat.
--   P1.7  accept_contract_proposal : SET search_path + GRANT EXECUTE.
--
-- Migration forward-only : applique-la après 078/079/080 (ordre numérique).
-- =========================================================================

-- -------------------------------------------------------------------------
-- P1.4 — Le règlement marque la facture payée AVEC paid_at + search_path
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION on_payment_released_mark_invoice_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status IN ('released', 'succeeded')
     AND COALESCE(OLD.status, '') NOT IN ('released', 'succeeded') THEN

    IF NEW.released_at IS NULL THEN
      NEW.released_at := NOW();
    END IF;

    UPDATE invoices
      SET status = 'paid',
          payment_method = NEW.payment_method,
          paid_at = COALESCE(paid_at, NOW())
      WHERE (NEW.milestone_id IS NOT NULL AND milestone_id = NEW.milestone_id)
         OR id = NULLIF(NEW.metadata->>'invoice_id', '')::uuid;
  END IF;

  RETURN NEW;
END;
$$;

-- -------------------------------------------------------------------------
-- P0.3 — Seul le client peut approuver un jalon
-- -------------------------------------------------------------------------
-- La RLS "Parties can update milestones" laisse les deux parties écrire le
-- statut. On ajoute un garde-fou : la transition vers 'approved' n'est permise
-- qu'au client du contrat (ou à un contexte service sans JWT, ex. triggers).
CREATE OR REPLACE FUNCTION guard_milestone_approval()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_client UUID;
BEGIN
  IF NEW.status = 'approved' AND COALESCE(OLD.status, '') <> 'approved' THEN
    SELECT client_id INTO v_client FROM contracts WHERE id = NEW.contract_id;
    -- v_uid IS NULL = contexte service/définisseur (autorisé) ;
    -- sinon seul le client peut approuver (bloque l'entrepreneur).
    IF v_uid IS NOT NULL AND v_uid <> v_client THEN
      RAISE EXCEPTION 'Seul le client peut approuver un jalon';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_guard_milestone_approval ON contract_milestones;
CREATE TRIGGER trigger_guard_milestone_approval
  BEFORE UPDATE OF status ON contract_milestones
  FOR EACH ROW
  EXECUTE FUNCTION guard_milestone_approval();

-- -------------------------------------------------------------------------
-- P1.5 — payment_handling immuable après signature
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION guard_contract_payment_handling()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.payment_handling IS DISTINCT FROM OLD.payment_handling
     AND (OLD.client_signed_at IS NOT NULL OR OLD.professional_signed_at IS NOT NULL) THEN
    RAISE EXCEPTION 'La modalité de règlement ne peut plus changer après une signature';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_guard_payment_handling ON contracts;
CREATE TRIGGER trigger_guard_payment_handling
  BEFORE UPDATE OF payment_handling ON contracts
  FOR EACH ROW
  EXECUTE FUNCTION guard_contract_payment_handling();

-- -------------------------------------------------------------------------
-- P1.6 — Le client ne peut modifier que le statut d'une proposition
-- -------------------------------------------------------------------------
-- La RLS "Client can update status" autorise techniquement la modification de
-- toutes les colonnes. On verrouille les termes négociés côté client.
CREATE OR REPLACE FUNCTION guard_proposal_client_update()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
BEGIN
  -- Quand c'est le client (et pas l'entrepreneur propriétaire) qui modifie,
  -- seuls les changements de statut sont permis.
  IF v_uid = OLD.client_id AND v_uid <> OLD.professional_id THEN
    IF NEW.total_amount        IS DISTINCT FROM OLD.total_amount
       OR NEW.payment_handling IS DISTINCT FROM OLD.payment_handling
       OR NEW.deposit_percentage IS DISTINCT FROM OLD.deposit_percentage
       OR NEW.contract_content_draft IS DISTINCT FROM OLD.contract_content_draft THEN
      RAISE EXCEPTION 'Le client ne peut modifier que le statut de la proposition';
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_guard_proposal_client_update ON contract_proposals;
CREATE TRIGGER trigger_guard_proposal_client_update
  BEFORE UPDATE ON contract_proposals
  FOR EACH ROW
  EXECUTE FUNCTION guard_proposal_client_update();

-- -------------------------------------------------------------------------
-- P1.7 — accept_contract_proposal : search_path + GRANT
-- -------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION accept_contract_proposal(proposal_uuid UUID)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  p RECORD;
  new_contract_id UUID;
BEGIN
  SELECT * INTO p FROM contract_proposals WHERE id = proposal_uuid;
  IF p IS NULL THEN RAISE EXCEPTION 'Proposal not found'; END IF;
  IF auth.uid() <> p.client_id THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF p.status <> 'pending' THEN RAISE EXCEPTION 'Proposal not pending'; END IF;

  INSERT INTO contracts (
    project_id, template_id, client_id, professional_id,
    title, description, contract_content, variables,
    total_amount, currency, deposit_percentage,
    start_date, end_date, status, payment_handling
  ) VALUES (
    p.project_id, p.template_id, p.client_id, p.professional_id,
    p.title, p.description, p.contract_content_draft, p.variables,
    p.total_amount, COALESCE(p.currency,'CAD'), COALESCE(p.deposit_percentage,0),
    p.start_date, p.end_date, 'draft', COALESCE(p.payment_handling, 'platform')
  ) RETURNING id INTO new_contract_id;

  UPDATE contract_proposals SET status = 'accepted', updated_at = NOW() WHERE id = proposal_uuid;

  RETURN new_contract_id;
END;
$$;

GRANT EXECUTE ON FUNCTION accept_contract_proposal(UUID) TO authenticated;
