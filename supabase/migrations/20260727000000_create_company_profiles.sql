-- Migration to ensure company_profiles table exists with UUID workspace_id reference
CREATE TABLE IF NOT EXISTS company_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id UUID UNIQUE NOT NULL REFERENCES workspaces(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  company_name TEXT NOT NULL,
  website TEXT NOT NULL,
  industry TEXT,
  description TEXT,
  logo_url TEXT,
  headquarters TEXT,
  employee_count INTEGER,
  founded_year INTEGER,
  company_size TEXT,
  annual_revenue TEXT,
  primary_products TEXT[],
  target_market TEXT,
  social_links JSONB DEFAULT '{}'::jsonb,
  brand_keywords TEXT[],
  brand_color TEXT DEFAULT '#0F52BA',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE company_profiles ENABLE ROW LEVEL SECURITY;

-- Idempotent RLS Policies
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'company_profiles' AND policyname = 'Users can view workspace company profile'
  ) THEN
    CREATE POLICY "Users can view workspace company profile"
      ON company_profiles FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'company_profiles' AND policyname = 'Users can insert workspace company profile'
  ) THEN
    CREATE POLICY "Users can insert workspace company profile"
      ON company_profiles FOR INSERT
      WITH CHECK (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'company_profiles' AND policyname = 'Users can update workspace company profile'
  ) THEN
    CREATE POLICY "Users can update workspace company profile"
      ON company_profiles FOR UPDATE
      USING (true);
  END IF;
END $$;
