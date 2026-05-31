-- =========================================================================
-- Migration 078: Règlement hors plateforme (chèque / virement / comptant)
-- -------------------------------------------------------------------------
-- Stripe n'est PAS obligatoire. Un client et un entrepreneur peuvent régler
-- une transaction directement (chèque, virement bancaire, comptant). BâtirNet
-- enregistre alors le règlement comme un simple registre comptable, sans
-- mouvement d'argent via Stripe.
--
-- Cette migration :
--   1. Autorise 'cheque' et 'cash' comme méthodes de paiement.
--   2. Ajoute un trigger : quand un paiement passe à 'released'/'succeeded',
--      la facture liée est automatiquement marquée 'paid' (et released_at est
--      horodaté si absent). Fonctionne pour le règlement hors plateforme ET
--      pour le futur flux Stripe.
-- =========================================================================

-- 1. Étendre les méthodes de paiement autorisées
ALTER TABLE contractor_payments DROP CONSTRAINT IF EXISTS contractor_payments_payment_method_check;
ALTER TABLE contractor_payments
  ADD CONSTRAINT contractor_payments_payment_method_check
  CHECK (payment_method IN ('transfer', 'card', 'crypto', 'cheque', 'cash'));

-- 2. Marquer la facture liée comme payée lorsqu'un paiement est libéré
CREATE OR REPLACE FUNCTION on_payment_released_mark_invoice_paid()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.status IN ('released', 'succeeded')
     AND COALESCE(OLD.status, '') NOT IN ('released', 'succeeded') THEN

    -- Horodater la libération si ce n'est pas déjà fait
    IF NEW.released_at IS NULL THEN
      NEW.released_at := NOW();
    END IF;

    -- Marquer la facture correspondante comme payée
    UPDATE invoices
      SET status = 'paid',
          payment_method = NEW.payment_method
      WHERE (NEW.milestone_id IS NOT NULL AND milestone_id = NEW.milestone_id)
         OR id = NULLIF(NEW.metadata->>'invoice_id', '')::uuid;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trigger_payment_released_invoice ON contractor_payments;
CREATE TRIGGER trigger_payment_released_invoice
  BEFORE UPDATE OF status ON contractor_payments
  FOR EACH ROW
  EXECUTE FUNCTION on_payment_released_mark_invoice_paid();

COMMENT ON FUNCTION on_payment_released_mark_invoice_paid IS
  'Quand un contractor_payment passe à released/succeeded, marque la facture liée comme payée. Couvre le règlement hors plateforme et Stripe.';
