-- Migration: Create Rubric Configuration Tables
-- Description: Tables for configurable coaching rubric (categories, weights, red flags, scoring criteria)

-- Table: coaching_rubric_config
-- Stores rubric versions with name, description, and status
CREATE TABLE coaching_rubric_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL DEFAULT 'Default Rubric',
  description TEXT,
  version INT NOT NULL DEFAULT 1,
  is_active BOOLEAN DEFAULT false,
  is_draft BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Table: rubric_categories
-- Stores scoring categories with weights (must sum to 100%)
CREATE TABLE rubric_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rubric_config_id UUID NOT NULL REFERENCES coaching_rubric_config(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  description TEXT,
  weight DECIMAL(5,2) NOT NULL CHECK (weight >= 0 AND weight <= 100),
  sort_order INT NOT NULL,
  is_enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (rubric_config_id, slug)
);

-- Table: rubric_scoring_criteria
-- Stores scoring criteria text for each score level (1-5) per category
CREATE TABLE rubric_scoring_criteria (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  category_id UUID NOT NULL REFERENCES rubric_categories(id) ON DELETE CASCADE,
  score INT NOT NULL CHECK (score BETWEEN 1 AND 5),
  criteria_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (category_id, score)
);

-- Table: rubric_red_flags
-- Stores red flag definitions with severity levels
CREATE TABLE rubric_red_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  rubric_config_id UUID NOT NULL REFERENCES coaching_rubric_config(id) ON DELETE CASCADE,
  flag_key TEXT NOT NULL,
  display_name TEXT NOT NULL,
  description TEXT NOT NULL,
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'high', 'medium')),
  threshold_type TEXT CHECK (threshold_type IN ('boolean', 'percentage')),
  threshold_value DECIMAL,
  is_enabled BOOLEAN DEFAULT true,
  sort_order INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (rubric_config_id, flag_key)
);

-- Indexes for performance
CREATE INDEX idx_rubric_config_active ON coaching_rubric_config(is_active) WHERE is_active = true;
CREATE INDEX idx_rubric_categories_config ON rubric_categories(rubric_config_id);
CREATE INDEX idx_rubric_scoring_category ON rubric_scoring_criteria(category_id);
CREATE INDEX idx_rubric_red_flags_config ON rubric_red_flags(rubric_config_id);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_rubric_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_rubric_config_updated_at
  BEFORE UPDATE ON coaching_rubric_config
  FOR EACH ROW
  EXECUTE FUNCTION update_rubric_config_updated_at();

-- Enable RLS (Row Level Security)
ALTER TABLE coaching_rubric_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubric_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubric_scoring_criteria ENABLE ROW LEVEL SECURITY;
ALTER TABLE rubric_red_flags ENABLE ROW LEVEL SECURITY;

-- Policies for service role access (full access)
CREATE POLICY "Service role full access to rubric_config"
  ON coaching_rubric_config
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access to rubric_categories"
  ON rubric_categories
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access to rubric_scoring_criteria"
  ON rubric_scoring_criteria
  FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access to rubric_red_flags"
  ON rubric_red_flags
  FOR ALL
  USING (true)
  WITH CHECK (true);
