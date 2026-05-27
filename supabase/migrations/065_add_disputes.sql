-- Migration: Contract Disputes / Litigation system
-- Date: 2026-05-27

-- Create dispute status enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dispute_status') THEN
        CREATE TYPE dispute_status AS ENUM ('open', 'investigating', 'resolved', 'closed');
    END IF;
END $$;

-- Create dispute category enum
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'dispute_category') THEN
        CREATE TYPE dispute_category AS ENUM ('quality', 'delay', 'payment', 'communication', 'other');
    END IF;
END $$;

-- Create disputes table
CREATE TABLE IF NOT EXISTS disputes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    opened_by UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    category dispute_category NOT NULL,
    description TEXT NOT NULL,
    attachments JSONB DEFAULT '[]'::jsonb,
    status dispute_status DEFAULT 'open',
    resolution TEXT,
    resolved_by UUID REFERENCES profiles(id),
    resolved_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_disputes_contract_id ON disputes(contract_id);
CREATE INDEX IF NOT EXISTS idx_disputes_status ON disputes(status);
CREATE INDEX IF NOT EXISTS idx_disputes_opened_by ON disputes(opened_by);

-- Enable RLS
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;

-- RLS Policies

-- Contract parties (client or professional) can view disputes on their contracts
DROP POLICY IF EXISTS "Contract parties can view disputes" ON disputes;
CREATE POLICY "Contract parties can view disputes"
    ON disputes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM contracts c
            WHERE c.id = disputes.contract_id
            AND (c.client_id = auth.uid() OR c.professional_id = auth.uid())
        )
    );

-- Contract parties can create disputes on their contracts
DROP POLICY IF EXISTS "Contract parties can create disputes" ON disputes;
CREATE POLICY "Contract parties can create disputes"
    ON disputes FOR INSERT
    WITH CHECK (
        opened_by = auth.uid()
        AND EXISTS (
            SELECT 1 FROM contracts c
            WHERE c.id = contract_id
            AND (c.client_id = auth.uid() OR c.professional_id = auth.uid())
        )
    );

-- Admins can view all disputes
DROP POLICY IF EXISTS "Admins can view all disputes" ON disputes;
CREATE POLICY "Admins can view all disputes"
    ON disputes FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.is_admin = TRUE
        )
    );

-- Admins can update all disputes (status, resolution)
DROP POLICY IF EXISTS "Admins can update all disputes" ON disputes;
CREATE POLICY "Admins can update all disputes"
    ON disputes FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM profiles p
            WHERE p.id = auth.uid() AND p.is_admin = TRUE
        )
    );

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_disputes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_disputes_updated_at ON disputes;
CREATE TRIGGER trigger_disputes_updated_at
    BEFORE UPDATE ON disputes
    FOR EACH ROW
    EXECUTE FUNCTION update_disputes_updated_at();
