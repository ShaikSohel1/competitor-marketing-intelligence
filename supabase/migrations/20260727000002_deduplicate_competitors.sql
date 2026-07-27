-- Remove duplicate competitors sharing the same domain within a workspace, keeping the newest record
DELETE FROM competitors c1
WHERE EXISTS (
  SELECT 1 FROM competitors c2
  WHERE c2.workspace_id = c1.workspace_id
    AND LOWER(REGEXP_REPLACE(c2.website, '^https?://(www\.)?', '')) = LOWER(REGEXP_REPLACE(c1.website, '^https?://(www\.)?', ''))
    AND (c2.created_at > c1.created_at OR (c2.created_at = c1.created_at AND c2.id > c1.id))
);

-- Unique index to prevent duplicate domain entries per workspace in Postgres
CREATE UNIQUE INDEX IF NOT EXISTS idx_competitors_workspace_domain
  ON competitors (workspace_id, LOWER(REGEXP_REPLACE(website, '^https?://(www\.)?', '')));
