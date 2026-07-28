-- ============================================================================
-- Add missing scraped_data column to company_profiles
-- This column stores the results of website scans (Lighthouse, SEO, social, etc)
-- as a JSONB blob on the company profile row.
-- ============================================================================

ALTER TABLE public.company_profiles
  ADD COLUMN IF NOT EXISTS scraped_data jsonb DEFAULT NULL;

-- Also ensure the RLS policy for company_profiles allows the authenticated user
-- to update their own row (this covers the scraped_data write-back).
-- The existing policy already covers all operations via:
--   create policy company_profiles_owner ... for all using (user_id = auth.uid())
-- so no additional policy change is needed.
