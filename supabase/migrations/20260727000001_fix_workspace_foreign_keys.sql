-- Ensure default workspace exists to guarantee foreign key integrity
INSERT INTO workspaces (id, name)
VALUES ('00000000-0000-0000-0000-000000000000', 'Default Workspace')
ON CONFLICT (id) DO NOTHING;

-- RLS policies for workspaces
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'workspaces' AND policyname = 'Allow select for all authenticated users'
  ) THEN
    CREATE POLICY "Allow select for all authenticated users"
      ON workspaces FOR SELECT
      USING (true);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'workspaces' AND policyname = 'Allow insert for all authenticated users'
  ) THEN
    CREATE POLICY "Allow insert for all authenticated users"
      ON workspaces FOR INSERT
      WITH CHECK (true);
  END IF;
END $$;
