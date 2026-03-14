-- Migration 061: Ensure professional_type column exists (idempotent)
-- If migration 060 was not applied to the production Supabase project,
-- this migration safely adds the column and backfills existing professionals.

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name   = 'profiles'
      AND column_name  = 'professional_type'
  ) THEN
    ALTER TABLE public.profiles
      ADD COLUMN professional_type TEXT
      CHECK (professional_type IN ('entrepreneur', 'trade_professional'))
      DEFAULT NULL;
  END IF;
END;
$$;

-- Backfill: existing professionals with no type → entrepreneur (backward-compat default)
UPDATE public.profiles
SET professional_type = 'entrepreneur'
WHERE user_type = 'professional'
  AND professional_type IS NULL;
