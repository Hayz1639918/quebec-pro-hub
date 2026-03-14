-- Migration 052: KPI functions for professional dashboard
-- Date: 2025-02-XX
-- Description: Adds SQL functions for calculating KPIs used by ProKpis.tsx (US-052).
--   - Revenue summary function
--   - Proposal conversion rate
--   - Average response time

-- ============================================================
-- PART 1: Revenue summary function (US-052)
-- ============================================================

CREATE OR REPLACE FUNCTION get_professional_revenue_summary(p_professional_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_total_revenue NUMERIC(12,2) := 0;
  v_pending_revenue NUMERIC(12,2) := 0;
  v_released_revenue NUMERIC(12,2) := 0;
  v_invoices_count INTEGER := 0;
  v_paid_invoices INTEGER := 0;
BEGIN
  -- Calculate from contractor_payments if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'contractor_payments') THEN
    SELECT
      COALESCE(SUM(CASE WHEN status = 'released' THEN net_amount ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN status IN ('pending', 'in_escrow') THEN net_amount ELSE 0 END), 0),
      COALESCE(SUM(CASE WHEN status = 'released' THEN net_amount ELSE 0 END), 0)
    INTO v_released_revenue, v_pending_revenue, v_total_revenue
    FROM contractor_payments
    WHERE contractor_id = p_professional_id;
  END IF;

  -- Calculate from invoices if table exists
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'invoices') THEN
    SELECT
      COUNT(*),
      COUNT(*) FILTER (WHERE status = 'paid')
    INTO v_invoices_count, v_paid_invoices
    FROM invoices
    WHERE contractor_id = p_professional_id;
  END IF;

  RETURN jsonb_build_object(
    'total_revenue', v_total_revenue,
    'pending_revenue', v_pending_revenue,
    'released_revenue', v_released_revenue,
    'invoices_count', v_invoices_count,
    'paid_invoices', v_paid_invoices,
    'payment_rate', CASE
      WHEN v_invoices_count > 0
      THEN ROUND((v_paid_invoices::NUMERIC / v_invoices_count) * 100, 1)
      ELSE 0
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION get_professional_revenue_summary(UUID) TO authenticated;

-- ============================================================
-- PART 2: Proposal conversion rate function
-- ============================================================

CREATE OR REPLACE FUNCTION get_proposal_conversion_rate(p_professional_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_total INTEGER := 0;
  v_accepted INTEGER := 0;
  v_pending INTEGER := 0;
  v_rejected INTEGER := 0;
BEGIN
  SELECT
    COUNT(*),
    COUNT(*) FILTER (WHERE status = 'accepted'),
    COUNT(*) FILTER (WHERE status = 'pending'),
    COUNT(*) FILTER (WHERE status = 'rejected')
  INTO v_total, v_accepted, v_pending, v_rejected
  FROM proposals
  WHERE professional_id = p_professional_id;

  RETURN jsonb_build_object(
    'total', v_total,
    'accepted', v_accepted,
    'pending', v_pending,
    'rejected', v_rejected,
    'conversion_rate', CASE
      WHEN v_total > 0
      THEN ROUND((v_accepted::NUMERIC / v_total) * 100, 1)
      ELSE 0
    END
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION get_proposal_conversion_rate(UUID) TO authenticated;

-- ============================================================
-- PART 3: Review statistics function
-- ============================================================

CREATE OR REPLACE FUNCTION get_review_statistics(p_professional_id UUID)
RETURNS JSONB AS $$
DECLARE
  v_total INTEGER := 0;
  v_avg_rating NUMERIC(3,2) := 0;
  v_avg_quality NUMERIC(3,2) := 0;
  v_avg_punctuality NUMERIC(3,2) := 0;
  v_avg_communication NUMERIC(3,2) := 0;
  v_avg_value NUMERIC(3,2) := 0;
BEGIN
  SELECT
    COUNT(*),
    ROUND(AVG(rating)::NUMERIC, 2),
    ROUND(AVG(quality_rating)::NUMERIC, 2),
    ROUND(AVG(punctuality_rating)::NUMERIC, 2),
    ROUND(AVG(communication_rating)::NUMERIC, 2),
    ROUND(AVG(value_rating)::NUMERIC, 2)
  INTO v_total, v_avg_rating, v_avg_quality, v_avg_punctuality, v_avg_communication, v_avg_value
  FROM reviews
  WHERE professional_id = p_professional_id;

  RETURN jsonb_build_object(
    'total_reviews', v_total,
    'average_rating', COALESCE(v_avg_rating, 0),
    'quality_rating', COALESCE(v_avg_quality, 0),
    'punctuality_rating', COALESCE(v_avg_punctuality, 0),
    'communication_rating', COALESCE(v_avg_communication, 0),
    'value_rating', COALESCE(v_avg_value, 0)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

GRANT EXECUTE ON FUNCTION get_review_statistics(UUID) TO authenticated;
