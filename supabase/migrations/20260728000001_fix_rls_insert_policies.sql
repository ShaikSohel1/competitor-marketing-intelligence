-- ==========================================================
-- Fix RLS policies: add WITH CHECK clause to allow INSERTs
-- The original policies only had USING (for SELECT/UPDATE/DELETE)
-- but not WITH CHECK (for INSERT), causing all inserts to fail.
-- ==========================================================

-- Drop and recreate competitor-scoped policies with proper WITH CHECK

-- scans
DROP POLICY IF EXISTS scans_owner ON public.scans;
CREATE POLICY scans_owner ON public.scans
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.competitors c WHERE c.id = scans.competitor_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.competitors c WHERE c.id = scans.competitor_id AND c.user_id = auth.uid()));

-- website_snapshots
DROP POLICY IF EXISTS website_snapshots_owner ON public.website_snapshots;
CREATE POLICY website_snapshots_owner ON public.website_snapshots
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.competitors c WHERE c.id = website_snapshots.competitor_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.competitors c WHERE c.id = website_snapshots.competitor_id AND c.user_id = auth.uid()));

-- seo_keywords
DROP POLICY IF EXISTS seo_keywords_owner ON public.seo_keywords;
CREATE POLICY seo_keywords_owner ON public.seo_keywords
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.competitors c WHERE c.id = seo_keywords.competitor_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.competitors c WHERE c.id = seo_keywords.competitor_id AND c.user_id = auth.uid()));

-- social_posts
DROP POLICY IF EXISTS social_posts_owner ON public.social_posts;
CREATE POLICY social_posts_owner ON public.social_posts
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.competitors c WHERE c.id = social_posts.competitor_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.competitors c WHERE c.id = social_posts.competitor_id AND c.user_id = auth.uid()));

-- social_profiles
DROP POLICY IF EXISTS social_profiles_owner ON public.social_profiles;
CREATE POLICY social_profiles_owner ON public.social_profiles
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.competitors c WHERE c.id = social_profiles.competitor_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.competitors c WHERE c.id = social_profiles.competitor_id AND c.user_id = auth.uid()));

-- pricing_items
DROP POLICY IF EXISTS pricing_items_owner ON public.pricing_items;
CREATE POLICY pricing_items_owner ON public.pricing_items
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.competitors c WHERE c.id = pricing_items.competitor_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.competitors c WHERE c.id = pricing_items.competitor_id AND c.user_id = auth.uid()));

-- pricing_snapshots
DROP POLICY IF EXISTS pricing_snapshots_owner ON public.pricing_snapshots;
CREATE POLICY pricing_snapshots_owner ON public.pricing_snapshots
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.competitors c WHERE c.id = pricing_snapshots.competitor_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.competitors c WHERE c.id = pricing_snapshots.competitor_id AND c.user_id = auth.uid()));

-- ad_creatives
DROP POLICY IF EXISTS ad_creatives_owner ON public.ad_creatives;
CREATE POLICY ad_creatives_owner ON public.ad_creatives
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.competitors c WHERE c.id = ad_creatives.competitor_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.competitors c WHERE c.id = ad_creatives.competitor_id AND c.user_id = auth.uid()));

-- tech_stack_snapshots
DROP POLICY IF EXISTS tech_stack_snapshots_owner ON public.tech_stack_snapshots;
CREATE POLICY tech_stack_snapshots_owner ON public.tech_stack_snapshots
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.competitors c WHERE c.id = tech_stack_snapshots.competitor_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.competitors c WHERE c.id = tech_stack_snapshots.competitor_id AND c.user_id = auth.uid()));

-- alerts
DROP POLICY IF EXISTS alerts_owner ON public.alerts;
CREATE POLICY alerts_owner ON public.alerts
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.competitors c WHERE c.id = alerts.competitor_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.competitors c WHERE c.id = alerts.competitor_id AND c.user_id = auth.uid()));

-- monitored_urls
DROP POLICY IF EXISTS monitored_urls_owner ON public.monitored_urls;
CREATE POLICY monitored_urls_owner ON public.monitored_urls
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.competitors c WHERE c.id = monitored_urls.competitor_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.competitors c WHERE c.id = monitored_urls.competitor_id AND c.user_id = auth.uid()));

-- change_events
DROP POLICY IF EXISTS change_events_owner ON public.change_events;
CREATE POLICY change_events_owner ON public.change_events
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.competitors c WHERE c.id = change_events.competitor_id AND c.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.competitors c WHERE c.id = change_events.competitor_id AND c.user_id = auth.uid()));

-- rank_snapshots (keyword-scoped)
DROP POLICY IF EXISTS rank_snapshots_owner ON public.rank_snapshots;
CREATE POLICY rank_snapshots_owner ON public.rank_snapshots
  FOR ALL
  USING (EXISTS (SELECT 1 FROM public.tracked_keywords k WHERE k.id = rank_snapshots.keyword_id AND k.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.tracked_keywords k WHERE k.id = rank_snapshots.keyword_id AND k.user_id = auth.uid()));
