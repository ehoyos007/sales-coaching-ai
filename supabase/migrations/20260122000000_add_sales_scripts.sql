-- Migration: Add Sales Scripts Management Tables
-- Description: Tables for uploading sales scripts, tracking versions, and syncing with coaching rubric

-- ============================================================================
-- Table: sales_scripts
-- Stores uploaded scripts with versioning per product type
-- ============================================================================
CREATE TABLE sales_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  product_type TEXT NOT NULL CHECK (product_type IN ('aca', 'limited_medical', 'life_insurance')),
  version INT NOT NULL DEFAULT 1,
  content TEXT NOT NULL,
  file_url TEXT,
  file_name TEXT,
  file_size_bytes INT,
  file_type TEXT CHECK (file_type IN ('text/plain', 'application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/markdown')),
  version_notes TEXT,
  is_active BOOLEAN DEFAULT false,
  uploaded_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  linked_rubric_id UUID REFERENCES coaching_rubric_config(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Ensure only one active script per product type
CREATE UNIQUE INDEX idx_sales_scripts_active_product
  ON sales_scripts(product_type)
  WHERE is_active = true;

-- Index for version history queries
CREATE INDEX idx_sales_scripts_product_version ON sales_scripts(product_type, version DESC);
CREATE INDEX idx_sales_scripts_created ON sales_scripts(created_at DESC);

-- ============================================================================
-- Table: rubric_sync_log
-- Tracks sync operations between scripts and rubric configurations
-- ============================================================================
CREATE TABLE rubric_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID NOT NULL REFERENCES sales_scripts(id) ON DELETE CASCADE,
  rubric_config_id UUID NOT NULL REFERENCES coaching_rubric_config(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'analyzing', 'pending_approval', 'applied', 'rejected')),
  changes_proposed JSONB,
  changes_approved JSONB,
  changes_rejected JSONB,
  error_message TEXT,
  approved_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  approved_at TIMESTAMPTZ,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Index for sync status queries
CREATE INDEX idx_sync_log_script ON rubric_sync_log(script_id);
CREATE INDEX idx_sync_log_status ON rubric_sync_log(status) WHERE status IN ('pending', 'analyzing', 'pending_approval');
CREATE INDEX idx_sync_log_rubric ON rubric_sync_log(rubric_config_id);

-- ============================================================================
-- Add source tracking to existing rubric tables
-- Tracks whether items came from manual entry or script sync
-- ============================================================================
ALTER TABLE rubric_categories ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'custom' CHECK (source_type IN ('custom', 'script_sync'));
ALTER TABLE rubric_categories ADD COLUMN IF NOT EXISTS source_script_id UUID REFERENCES sales_scripts(id) ON DELETE SET NULL;

ALTER TABLE rubric_scoring_criteria ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'custom' CHECK (source_type IN ('custom', 'script_sync'));
ALTER TABLE rubric_scoring_criteria ADD COLUMN IF NOT EXISTS source_script_id UUID REFERENCES sales_scripts(id) ON DELETE SET NULL;

ALTER TABLE rubric_red_flags ADD COLUMN IF NOT EXISTS source_type TEXT DEFAULT 'custom' CHECK (source_type IN ('custom', 'script_sync'));
ALTER TABLE rubric_red_flags ADD COLUMN IF NOT EXISTS source_script_id UUID REFERENCES sales_scripts(id) ON DELETE SET NULL;

-- ============================================================================
-- Trigger for updated_at on sales_scripts
-- ============================================================================
CREATE OR REPLACE FUNCTION update_sales_scripts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_sales_scripts_updated_at
  BEFORE UPDATE ON sales_scripts
  FOR EACH ROW
  EXECUTE FUNCTION update_sales_scripts_updated_at();

-- ============================================================================
-- Enable RLS (Row Level Security)
-- ============================================================================
ALTER TABLE sales_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubric_sync_log ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- RLS Policies
-- ============================================================================

-- Sales Scripts: service role has full access
CREATE POLICY "Service role full access to sales_scripts"
  ON sales_scripts
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Sync Log: service role has full access
CREATE POLICY "Service role full access to rubric_sync_log"
  ON rubric_sync_log
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ============================================================================
-- Supabase Storage Bucket for scripts
-- Note: Run this separately in Supabase Dashboard or via API
-- ============================================================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('sales-scripts', 'sales-scripts', false)
-- ON CONFLICT DO NOTHING;

-- Storage Policies (run in Supabase Dashboard):
-- CREATE POLICY "Allow authenticated uploads to sales-scripts"
--   ON storage.objects
--   FOR INSERT
--   WITH CHECK (bucket_id = 'sales-scripts' AND auth.role() = 'authenticated');

-- CREATE POLICY "Allow authenticated reads from sales-scripts"
--   ON storage.objects
--   FOR SELECT
--   USING (bucket_id = 'sales-scripts' AND auth.role() = 'authenticated');
