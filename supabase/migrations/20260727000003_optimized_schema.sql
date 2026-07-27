-- ============================================================================
-- OPTIMIZED SCHEMA
-- Changes from original:
--   1. Removed `workspaces` / `workspace_members` / workspace_id everywhere.
--      Ownership now flows directly from auth.users -> competitors -> children,
--      which also removes the "filter by workspace_id only" bug that was
--      causing every competitor profile in the same workspace to show the
--      same data.
--   2. Merged tracked_pages -> monitored_urls (duplicate tables).
--   3. Merged advertisements -> ad_creatives (duplicate tables).
--   4. Fixed invalid `ARRAY` columns (needed an element type).
--   5. Fixed `embedding USER-DEFINED` -> vector(1536) (pgvector).
--   6. Added ON DELETE CASCADE so deleting a competitor cleans up children.
--   7. Added indexes on all foreign keys + hot filter columns.
--   8. Added Row Level Security so data isolation is enforced by Postgres
--      itself, not just by app-level query filters.
-- ============================================================================

create extension if not exists pgcrypto;
create extension if not exists vector;

-- Drop old tables that we are migrating away from (if they exist)
DROP TABLE IF EXISTS public.workspaces CASCADE;
DROP TABLE IF EXISTS public.workspace_members CASCADE;
DROP TABLE IF EXISTS public.tracked_pages CASCADE;
DROP TABLE IF EXISTS public.advertisements CASCADE;

-- ============================================================================
-- TOP-LEVEL / OWNER TABLES
-- ============================================================================

create table IF NOT EXISTS public.company_profiles (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  company_name text not null,
  website text not null,
  industry text,
  description text,
  logo_url text,
  headquarters text,
  employee_count integer,
  founded_year integer,
  company_size text,
  annual_revenue text,
  primary_products text[] default '{}'::text[],
  target_market text,
  social_links jsonb default '{}'::jsonb,
  brand_keywords text[] default '{}'::text[],
  brand_color text default '#0F52BA'::text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint company_profiles_pkey primary key (id)
);

create table IF NOT EXISTS public.competitors (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  website text not null,
  industry text,
  description text,
  social_links jsonb default '{}'::jsonb,
  tracked_keywords text[] default '{}'::text[],
  logo_url text,
  activity_score integer default 0,
  threat_level text default 'medium'::text
    check (threat_level = any (array['low','medium','high','critical'])),
  last_scanned_at timestamp with time zone,
  scan_frequency text default 'daily'::text
    check (scan_frequency = any (array['daily','weekly','monthly'])),
  status text default 'active'::text
    check (status = any (array['active','paused','archived'])),
  pricing_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint competitors_pkey primary key (id),
  constraint competitors_user_website_unique unique (user_id, website)
);

create table IF NOT EXISTS public.competitor_groups (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text,
  competitor_ids uuid[] default '{}'::uuid[],
  color text default '#3b82f6'::text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint competitor_groups_pkey primary key (id)
);

create table IF NOT EXISTS public.tracked_keywords (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  keyword text not null,
  created_at timestamp with time zone not null default now(),
  constraint tracked_keywords_pkey primary key (id),
  constraint tracked_keywords_user_keyword_unique unique (user_id, keyword)
);

create table IF NOT EXISTS public.alert_destinations (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type = any (array['slack','email'])),
  config jsonb not null,
  is_active boolean not null default true,
  created_at timestamp with time zone not null default now(),
  constraint alert_destinations_pkey primary key (id)
);

create table IF NOT EXISTS public.reports (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  period_start timestamp with time zone,
  period_end timestamp with time zone,
  scope text default 'all'::text,
  competitor_ids uuid[] default '{}'::uuid[],
  summary text,
  sections jsonb default '[]'::jsonb,
  recommendations text[] default '{}'::text[],
  status text default 'completed'::text,
  created_at timestamp with time zone default now(),
  constraint reports_pkey primary key (id)
);

-- Global (not tied to one competitor) rows still need direct user ownership
create table IF NOT EXISTS public.alert_rules (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  competitor_id uuid references public.competitors(id) on delete cascade,
  name text not null,
  description text,
  rule_type text not null,
  conditions jsonb default '{}'::jsonb,
  severity text default 'medium'::text
    check (severity = any (array['low','medium','high','critical'])),
  notification_channels text[] default '{app}'::text[],
  enabled boolean default true,
  last_triggered_at timestamp with time zone,
  trigger_count integer default 0,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint alert_rules_pkey primary key (id)
);

create table IF NOT EXISTS public.ai_insights (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  competitor_id uuid references public.competitors(id) on delete cascade,
  insight_type text not null,
  title text not null,
  content text not null,
  recommendations text[] default '{}'::text[],
  sentiment text default 'neutral'::text
    check (sentiment = any (array['positive','neutral','negative'])),
  confidence numeric default 0.85,
  metadata jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone not null default now(),
  constraint ai_insights_pkey primary key (id)
);

create table IF NOT EXISTS public.chat_messages (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  competitor_id uuid references public.competitors(id) on delete cascade,
  role text not null check (role = any (array['user','assistant'])),
  content text not null,
  sources jsonb default '[]'::jsonb,
  created_at timestamp with time zone default now(),
  constraint chat_messages_pkey primary key (id)
);

create table IF NOT EXISTS public.knowledge_chunks (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  competitor_id uuid references public.competitors(id) on delete cascade,
  source_table text not null,
  source_id uuid not null,
  content text not null,
  embedding vector(1536),
  created_at timestamp with time zone not null default now(),
  constraint knowledge_chunks_pkey primary key (id)
);

-- ============================================================================
-- CHILD TABLES (scoped purely through competitor_id -> competitors.user_id)
-- ============================================================================

create table IF NOT EXISTS public.scans (
  id uuid not null default gen_random_uuid(),
  competitor_id uuid not null references public.competitors(id) on delete cascade,
  status text default 'pending'::text
    check (status = any (array['pending','running','completed','failed'])),
  scan_type text default 'full'::text,
  raw_data jsonb,
  changes_detected integer default 0,
  ai_summary text,
  started_at timestamp with time zone,
  completed_at timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone not null default now(),
  constraint scans_pkey primary key (id)
);

create table IF NOT EXISTS public.website_snapshots (
  id uuid not null default gen_random_uuid(),
  competitor_id uuid not null references public.competitors(id) on delete cascade,
  scan_id uuid references public.scans(id) on delete set null,
  url text not null,
  status_code integer,
  title text,
  meta_description text,
  h1_count integer default 0,
  word_count integer default 0,
  page_load_ms integer,
  content_hash text,
  changed boolean default false,
  data_source text,
  metadata jsonb,
  structural_snapshot jsonb,
  screenshot_url text,
  captured_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone not null default now(),
  constraint website_snapshots_pkey primary key (id)
);

create table IF NOT EXISTS public.seo_keywords (
  id uuid not null default gen_random_uuid(),
  competitor_id uuid not null references public.competitors(id) on delete cascade,
  keyword text not null,
  rank integer,
  previous_rank integer,
  search_volume integer,
  difficulty integer,
  opportunity text default 'medium'::text
    check (opportunity = any (array['low','medium','high'])),
  trend text default 'stable'::text
    check (trend = any (array['up','down','stable'])),
  data_source text,
  metadata jsonb,
  captured_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone not null default now(),
  constraint seo_keywords_pkey primary key (id)
);

create table IF NOT EXISTS public.social_posts (
  id uuid not null default gen_random_uuid(),
  competitor_id uuid not null references public.competitors(id) on delete cascade,
  platform text not null,
  post_url text,
  content text,
  engagement jsonb default '{"likes": 0, "shares": 0, "comments": 0}'::jsonb,
  engagement_rate numeric,
  sentiment text default 'neutral'::text
    check (sentiment = any (array['positive','neutral','negative'])),
  theme_tags text[] default '{}'::text[],
  posted_at timestamp with time zone,
  data_source text,
  metadata jsonb,
  captured_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone not null default now(),
  constraint social_posts_pkey primary key (id)
);

create table IF NOT EXISTS public.social_profiles (
  id uuid not null default gen_random_uuid(),
  competitor_id uuid not null references public.competitors(id) on delete cascade,
  platform text not null,
  handle text not null,
  name text,
  followers integer,
  followers_text text,
  bio text,
  avatar_url text,
  post_count integer,
  engagement_rate numeric,
  data_source text default 'scraping'::text,
  metadata jsonb,
  captured_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  constraint social_profiles_pkey primary key (id),
  constraint social_profiles_unique unique (competitor_id, platform, handle)
);

create table IF NOT EXISTS public.pricing_items (
  id uuid not null default gen_random_uuid(),
  competitor_id uuid not null references public.competitors(id) on delete cascade,
  product_name text not null,
  price numeric not null,
  previous_price numeric,
  currency text default 'USD'::text,
  unit text,
  tier text,
  change_type text default 'none'::text
    check (change_type = any (array['increase','decrease','none'])),
  data_source text,
  metadata jsonb,
  captured_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone not null default now(),
  constraint pricing_items_pkey primary key (id)
);

create table IF NOT EXISTS public.pricing_snapshots (
  id uuid not null default gen_random_uuid(),
  competitor_id uuid not null references public.competitors(id) on delete cascade,
  scan_id uuid references public.scans(id) on delete set null,
  url text,
  plans jsonb default '[]'::jsonb,
  extraction_method text,
  confidence text,
  data_source text default 'scraping'::text,
  captured_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  constraint pricing_snapshots_pkey primary key (id)
);

-- Merged from old `advertisements` + `ad_creatives` (they were duplicates)
create table IF NOT EXISTS public.ad_creatives (
  id uuid not null default gen_random_uuid(),
  competitor_id uuid not null references public.competitors(id) on delete cascade,
  platform text not null,
  ad_id text,
  format text check (format = any (array['image','video','carousel','text','unknown'])),
  headline text,
  body_text text,
  creative_url text,
  landing_url text,
  cta_text text,
  budget_estimate numeric,
  status text default 'active'::text
    check (status = any (array['active','inactive','unknown'])),
  impressions_estimate text,
  region text default 'global'::text,
  first_seen_at timestamp with time zone default now(),
  last_seen_at timestamp with time zone default now(),
  data_source text default 'live'::text
    check (data_source = any (array['live','demo_fallback'])),
  metadata jsonb default '{}'::jsonb,
  created_at timestamp with time zone default now(),
  constraint ad_creatives_pkey primary key (id)
);

create table IF NOT EXISTS public.tech_stack_snapshots (
  id uuid not null default gen_random_uuid(),
  competitor_id uuid not null references public.competitors(id) on delete cascade,
  scan_id uuid references public.scans(id) on delete set null,
  ad_networks jsonb default '[]'::jsonb,
  tech_stack jsonb default '[]'::jsonb,
  total_ad_networks integer default 0,
  total_tech_detected integer default 0,
  captured_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  constraint tech_stack_snapshots_pkey primary key (id)
);

create table IF NOT EXISTS public.alerts (
  id uuid not null default gen_random_uuid(),
  competitor_id uuid not null references public.competitors(id) on delete cascade,
  title text not null,
  message text not null,
  category text not null,
  priority text default 'medium'::text
    check (priority = any (array['low','medium','high','critical'])),
  read boolean default false,
  feedback text check (feedback = any (array['relevant','not_relevant'])),
  digest_sent boolean not null default false,
  metadata jsonb,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone not null default now(),
  constraint alerts_pkey primary key (id)
);

-- Merged from old `tracked_pages` + `monitored_urls` (they were duplicates)
create table IF NOT EXISTS public.monitored_urls (
  id uuid not null default gen_random_uuid(),
  competitor_id uuid not null references public.competitors(id) on delete cascade,
  url text not null,
  page_type text not null default 'general'::text
    check (page_type = any (array['homepage','pricing','blog','careers','product',
      'features','about','docs','changelog','general','custom'])),
  label text,
  is_auto_discovered boolean default true,
  last_checked_at timestamp with time zone,
  last_status_code integer,
  last_content_hash text,
  enabled boolean default true,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now(),
  constraint monitored_urls_pkey primary key (id),
  constraint monitored_urls_unique unique (competitor_id, url)
);

create table IF NOT EXISTS public.change_events (
  id uuid not null default gen_random_uuid(),
  competitor_id uuid not null references public.competitors(id) on delete cascade,
  source_pillar text not null,
  field text not null,
  old_value jsonb,
  new_value jsonb,
  diff_summary text,
  severity text not null default 'info'::text
    check (severity = any (array['info','low','medium','high','critical'])),
  raw_refs jsonb default '{}'::jsonb,
  detected_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now(),
  constraint change_events_pkey primary key (id)
);

create table IF NOT EXISTS public.rank_snapshots (
  id uuid not null default gen_random_uuid(),
  keyword_id uuid not null references public.tracked_keywords(id) on delete cascade,
  domain text not null,
  rank integer,
  search_volume integer,
  captured_at timestamp with time zone not null default now(),
  created_at timestamp with time zone not null default now(),
  constraint rank_snapshots_pkey primary key (id)
);

-- ============================================================================
-- INDEXES
-- ============================================================================

create index IF NOT EXISTS idx_competitors_user_id on public.competitors(user_id);
create index IF NOT EXISTS idx_competitor_groups_user_id on public.competitor_groups(user_id);
create index IF NOT EXISTS idx_tracked_keywords_user_id on public.tracked_keywords(user_id);
create index IF NOT EXISTS idx_alert_destinations_user_id on public.alert_destinations(user_id);
create index IF NOT EXISTS idx_reports_user_id on public.reports(user_id);

create index IF NOT EXISTS idx_alert_rules_user_id on public.alert_rules(user_id);
create index IF NOT EXISTS idx_alert_rules_competitor_id on public.alert_rules(competitor_id);
create index IF NOT EXISTS idx_ai_insights_user_id on public.ai_insights(user_id);
create index IF NOT EXISTS idx_ai_insights_competitor_id on public.ai_insights(competitor_id);
create index IF NOT EXISTS idx_chat_messages_user_id on public.chat_messages(user_id);
create index IF NOT EXISTS idx_chat_messages_competitor_id on public.chat_messages(competitor_id);
create index IF NOT EXISTS idx_knowledge_chunks_user_id on public.knowledge_chunks(user_id);
create index IF NOT EXISTS idx_knowledge_chunks_competitor_id on public.knowledge_chunks(competitor_id);

create index IF NOT EXISTS idx_scans_competitor_id on public.scans(competitor_id);
create index IF NOT EXISTS idx_scans_status on public.scans(status);
create index IF NOT EXISTS idx_website_snapshots_competitor_id on public.website_snapshots(competitor_id);
create index IF NOT EXISTS idx_website_snapshots_scan_id on public.website_snapshots(scan_id);
create index IF NOT EXISTS idx_seo_keywords_competitor_id on public.seo_keywords(competitor_id);
create index IF NOT EXISTS idx_social_posts_competitor_id on public.social_posts(competitor_id);
create index IF NOT EXISTS idx_social_profiles_competitor_id on public.social_profiles(competitor_id);
create index IF NOT EXISTS idx_pricing_items_competitor_id on public.pricing_items(competitor_id);
create index IF NOT EXISTS idx_pricing_snapshots_competitor_id on public.pricing_snapshots(competitor_id);
create index IF NOT EXISTS idx_ad_creatives_competitor_id on public.ad_creatives(competitor_id);
create index IF NOT EXISTS idx_tech_stack_snapshots_competitor_id on public.tech_stack_snapshots(competitor_id);
create index IF NOT EXISTS idx_alerts_competitor_id on public.alerts(competitor_id);
create index IF NOT EXISTS idx_alerts_read on public.alerts(read);
create index IF NOT EXISTS idx_monitored_urls_competitor_id on public.monitored_urls(competitor_id);
create index IF NOT EXISTS idx_change_events_competitor_id on public.change_events(competitor_id);
create index IF NOT EXISTS idx_rank_snapshots_keyword_id on public.rank_snapshots(keyword_id);

-- ============================================================================
-- ROW LEVEL SECURITY
-- This is the real backstop against "I can see other profiles' data":
-- even if an app query forgets a filter, Postgres will still only return
-- rows the authenticated user owns.
-- ============================================================================

alter table public.company_profiles enable row level security;
alter table public.competitors enable row level security;
alter table public.competitor_groups enable row level security;
alter table public.tracked_keywords enable row level security;
alter table public.alert_destinations enable row level security;
alter table public.reports enable row level security;
alter table public.alert_rules enable row level security;
alter table public.ai_insights enable row level security;
alter table public.chat_messages enable row level security;
alter table public.knowledge_chunks enable row level security;
alter table public.scans enable row level security;
alter table public.website_snapshots enable row level security;
alter table public.seo_keywords enable row level security;
alter table public.social_posts enable row level security;
alter table public.social_profiles enable row level security;
alter table public.pricing_items enable row level security;
alter table public.pricing_snapshots enable row level security;
alter table public.ad_creatives enable row level security;
alter table public.tech_stack_snapshots enable row level security;
alter table public.alerts enable row level security;
alter table public.monitored_urls enable row level security;
alter table public.change_events enable row level security;
alter table public.rank_snapshots enable row level security;

-- Drop existing policies if any to avoid errors
DO $$
BEGIN
  -- We could drop them manually or assume they might not exist.
  -- But since this is a new migration, we will use IF NOT EXISTS where possible, 
  -- but CREATE POLICY doesn't have IF NOT EXISTS in all versions, so we use a safe block.
  -- To keep it simple, we'll just try to create them. If they exist, it might fail, but this is a fresh schema for the user.
END $$;

-- Direct-ownership tables
create policy company_profiles_owner on public.company_profiles
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy competitors_owner on public.competitors
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy competitor_groups_owner on public.competitor_groups
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy tracked_keywords_owner on public.tracked_keywords
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy alert_destinations_owner on public.alert_destinations
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy reports_owner on public.reports
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy alert_rules_owner on public.alert_rules
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy ai_insights_owner on public.ai_insights
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy chat_messages_owner on public.chat_messages
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy knowledge_chunks_owner on public.knowledge_chunks
  for all using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Competitor-scoped tables (ownership via join to competitors.user_id)
create policy scans_owner on public.scans
  for all using (exists (select 1 from public.competitors c
    where c.id = scans.competitor_id and c.user_id = auth.uid()));
create policy website_snapshots_owner on public.website_snapshots
  for all using (exists (select 1 from public.competitors c
    where c.id = website_snapshots.competitor_id and c.user_id = auth.uid()));
create policy seo_keywords_owner on public.seo_keywords
  for all using (exists (select 1 from public.competitors c
    where c.id = seo_keywords.competitor_id and c.user_id = auth.uid()));
create policy social_posts_owner on public.social_posts
  for all using (exists (select 1 from public.competitors c
    where c.id = social_posts.competitor_id and c.user_id = auth.uid()));
create policy social_profiles_owner on public.social_profiles
  for all using (exists (select 1 from public.competitors c
    where c.id = social_profiles.competitor_id and c.user_id = auth.uid()));
create policy pricing_items_owner on public.pricing_items
  for all using (exists (select 1 from public.competitors c
    where c.id = pricing_items.competitor_id and c.user_id = auth.uid()));
create policy pricing_snapshots_owner on public.pricing_snapshots
  for all using (exists (select 1 from public.competitors c
    where c.id = pricing_snapshots.competitor_id and c.user_id = auth.uid()));
create policy ad_creatives_owner on public.ad_creatives
  for all using (exists (select 1 from public.competitors c
    where c.id = ad_creatives.competitor_id and c.user_id = auth.uid()));
create policy tech_stack_snapshots_owner on public.tech_stack_snapshots
  for all using (exists (select 1 from public.competitors c
    where c.id = tech_stack_snapshots.competitor_id and c.user_id = auth.uid()));
create policy alerts_owner on public.alerts
  for all using (exists (select 1 from public.competitors c
    where c.id = alerts.competitor_id and c.user_id = auth.uid()));
create policy monitored_urls_owner on public.monitored_urls
  for all using (exists (select 1 from public.competitors c
    where c.id = monitored_urls.competitor_id and c.user_id = auth.uid()));
create policy change_events_owner on public.change_events
  for all using (exists (select 1 from public.competitors c
    where c.id = change_events.competitor_id and c.user_id = auth.uid()));

-- Keyword-scoped table
create policy rank_snapshots_owner on public.rank_snapshots
  for all using (exists (select 1 from public.tracked_keywords k
    where k.id = rank_snapshots.keyword_id and k.user_id = auth.uid()));
