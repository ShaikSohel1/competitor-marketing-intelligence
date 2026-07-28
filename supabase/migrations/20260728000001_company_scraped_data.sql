-- Add scraped_data column to company_profiles for storing our company's intelligence
ALTER TABLE public.company_profiles
  ADD COLUMN IF NOT EXISTS scraped_data jsonb DEFAULT '{}'::jsonb;
