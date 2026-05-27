-- =========================================================================
-- Migration 073: Wire missing notifications across the E2E workflow
-- -------------------------------------------------------------------------
-- Fixes discovered while running the full E2E test:
--   1. New proposals did not notify the client (only the in-app message was
--      sent from ProjectDetails.tsx; the server-side RPC flow had no
--      equivalent). Add a trigger to guarantee a notification regardless of
--      the entry point used to insert a row in `proposals`.
--   2. `request_milestone_validation` updates the milestone status but never
--      told the client. Add a notification so the client sees the validation
--      request immediately in the notification bell.
--   3. Remove the leftover emoji from the `proposal_accepted` notification
--      created by 036, to stay consistent with the new UI guidelines.
-- Idempotent.
-- =========================================================================

-- -------------------------------------------------------------------------
-- 1. New-proposal notification trigger
-- -------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION on_proposal_created()
RETURNS TRIGGER AS $fn$
DECLARE
  v_project RECORD;
  v_pro_name TEXT;
BEGIN
  SELECT id, title, client_id INTO v_project
  FROM projects WHERE id = NEW.project_id;

  IF v_project.client_id IS NULL OR v_project.client_id = NEW.professional_id THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE(company_name, full_name, 'Un professionnel') INTO v_pro_name
  FROM profiles WHERE id = NEW.professional_id;

  INSERT INTO notifications (
    user_id, type, title, message,
    related_user_id, related_project_id, action_url, metadata
  ) VALUES (
    v_project.client_id,
    'new_proposal',
    'Nouvelle proposition reçue',
    COALESCE(v_pro_name, 'Un professionnel') || ' a soumis une proposition pour "' || COALESCE(v_project.title, 'votre projet') || '".',
    NEW.professional_id,
    v_project.id,
    '/dashboard?tab=proposals',
    jsonb_build_object(
      'proposal_id', NEW.id,
      'project_id', v_project.id,
      'professional_id', NEW.professional_id
    )
  );

  RETURN NEW;
END;
$fn$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_proposal_created ON proposals;
CREATE TRIGGER trigger_proposal_created
  AFTER INSERT ON proposals
  FOR EACH ROW
  EXECUTE FUNCTION on_proposal_created();

COMMENT ON FUNCTION on_proposal_created IS 'Notifies the client whenever a professional submits a proposal on their project.';

-- -------------------------------------------------------------------------
-- 2. Notify the client when the pro requests milestone validation
-- -------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION request_milestone_validation(p_milestone UUID)
RETURNS VOID AS $fn$
DECLARE
  v_contract RECORD;
  v_pro_name TEXT;
  v_milestone RECORD;
  v_project_title TEXT;
BEGIN
  SELECT m.id, m.title, m.amount, m.contract_id
  INTO v_milestone
  FROM contract_milestones m
  WHERE m.id = p_milestone;

  IF v_milestone.id IS NULL THEN
    RAISE EXCEPTION 'Milestone not found';
  END IF;

  SELECT c.id, c.client_id, c.professional_id, c.project_id, c.title
  INTO v_contract
  FROM contracts c
  WHERE c.id = v_milestone.contract_id;

  IF v_contract.client_id IS NULL THEN
    RAISE EXCEPTION 'Contract not found';
  END IF;

  IF auth.uid() <> v_contract.client_id AND auth.uid() <> v_contract.professional_id THEN
    RAISE EXCEPTION 'Not authorized';
  END IF;

  UPDATE contract_milestones
  SET status = 'requested',
      requested_by = auth.uid(),
      requested_at = NOW(),
      updated_at = NOW()
  WHERE id = p_milestone;

  SELECT COALESCE(company_name, full_name, 'L''entrepreneur') INTO v_pro_name
  FROM profiles WHERE id = v_contract.professional_id;

  SELECT title INTO v_project_title
  FROM projects WHERE id = v_contract.project_id;

  INSERT INTO notifications (
    user_id, type, title, message,
    related_user_id, related_project_id, action_url, metadata
  ) VALUES (
    v_contract.client_id,
    'milestone_requested',
    'Validation de jalon demandée',
    COALESCE(v_pro_name, 'L''entrepreneur') || ' demande la validation du jalon "' || v_milestone.title || '" (' || v_milestone.amount::TEXT || ' $) pour "' || COALESCE(v_project_title, v_contract.title, 'votre projet') || '".',
    v_contract.professional_id,
    v_contract.project_id,
    '/contracts?contract=' || v_contract.id::TEXT,
    jsonb_build_object(
      'milestone_id', v_milestone.id,
      'contract_id', v_contract.id,
      'amount', v_milestone.amount
    )
  );
END;
$fn$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION request_milestone_validation(UUID) TO authenticated;

COMMENT ON FUNCTION request_milestone_validation IS 'Marks a milestone as ''requested'' and notifies the client. Callable by either contract party.';

-- -------------------------------------------------------------------------
-- 3. Remove the trailing emoji from the proposal_accepted notification
-- -------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION accept_proposal(proposal_uuid UUID)
RETURNS BOOLEAN AS $fn$
DECLARE
  v_proposal RECORD;
  v_project RECORD;
  v_other_proposal RECORD;
BEGIN
  SELECT * INTO v_proposal FROM proposals WHERE id = proposal_uuid;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Proposition non trouvée';
  END IF;
  IF v_proposal.status != 'pending' THEN
    RAISE EXCEPTION 'Proposition déjà traitée';
  END IF;

  SELECT * INTO v_project FROM projects WHERE id = v_proposal.project_id;
  IF v_project.client_id != auth.uid() THEN
    RAISE EXCEPTION 'Non autorisé';
  END IF;

  UPDATE proposals
  SET status = 'accepted', updated_at = NOW()
  WHERE id = proposal_uuid;

  FOR v_other_proposal IN
    SELECT id, professional_id FROM proposals
    WHERE project_id = v_proposal.project_id
      AND id != proposal_uuid
      AND status = 'pending'
  LOOP
    UPDATE proposals
    SET status = 'rejected', updated_at = NOW()
    WHERE id = v_other_proposal.id;

    INSERT INTO notifications (user_id, type, title, message, related_project_id, action_url)
    VALUES (
      v_other_proposal.professional_id,
      'proposal_rejected',
      'Projet attribué à un autre professionnel',
      'Le projet "' || v_project.title || '" a été attribué à un autre professionnel.',
      v_proposal.project_id,
      '/projects'
    );
  END LOOP;

  UPDATE projects
  SET assigned_professional_id = v_proposal.professional_id,
      status = 'in_progress',
      updated_at = NOW()
  WHERE id = v_proposal.project_id;

  INSERT INTO notifications (user_id, type, title, message, related_project_id, action_url)
  VALUES (
    v_proposal.professional_id,
    'proposal_accepted',
    'Proposition acceptée',
    'Votre proposition pour "' || v_project.title || '" a été acceptée.',
    v_proposal.project_id,
    '/pro/my-projects'
  );

  RETURN TRUE;
EXCEPTION WHEN OTHERS THEN
  RAISE EXCEPTION 'Erreur: %', SQLERRM;
END;
$fn$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION accept_proposal(UUID) TO authenticated;
