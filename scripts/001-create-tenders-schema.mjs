import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

async function migrate() {
  console.log("Starting migration...");

  // Create tenders table
  await sql`
    CREATE TABLE IF NOT EXISTS tenders (
      ocid TEXT PRIMARY KEY,
      release_id TEXT NOT NULL,
      release_date TIMESTAMPTZ,
      tender_id TEXT,
      title TEXT,
      status TEXT,
      category TEXT,
      province TEXT,
      delivery_location TEXT,
      special_conditions TEXT,
      main_procurement_category TEXT,
      description TEXT,
      procurement_method TEXT,
      procurement_method_details TEXT,
      estimated_value NUMERIC DEFAULT 0,
      currency TEXT DEFAULT 'ZAR',
      tender_period_start TIMESTAMPTZ,
      tender_period_end TIMESTAMPTZ,
      buyer_id TEXT,
      buyer_name TEXT,
      procuring_entity_id TEXT,
      procuring_entity_name TEXT,
      contact_name TEXT,
      contact_email TEXT,
      contact_phone TEXT,
      briefing_is_session BOOLEAN DEFAULT FALSE,
      briefing_compulsory BOOLEAN DEFAULT FALSE,
      briefing_date TIMESTAMPTZ,
      briefing_venue TEXT,
      document_count INTEGER DEFAULT 0,
      award_count INTEGER DEFAULT 0,
      total_award_value NUMERIC DEFAULT 0,
      raw_release JSONB NOT NULL,
      synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `;
  console.log("Created tenders table");

  // Create indexes
  await sql`CREATE INDEX IF NOT EXISTS idx_tenders_status ON tenders(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_tenders_province ON tenders(province)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_tenders_category ON tenders(category)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_tenders_tender_period_end ON tenders(tender_period_end)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_tenders_tender_period_start ON tenders(tender_period_start)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_tenders_release_date ON tenders(release_date)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_tenders_buyer_name ON tenders(buyer_name)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_tenders_synced_at ON tenders(synced_at)`;
  console.log("Created indexes");

  // Add search vector column
  await sql`ALTER TABLE tenders ADD COLUMN IF NOT EXISTS search_vector tsvector`;
  await sql`CREATE INDEX IF NOT EXISTS idx_tenders_search ON tenders USING GIN(search_vector)`;
  console.log("Created search vector");

  // Create search trigger function
  await sql`
    CREATE OR REPLACE FUNCTION tenders_search_update() RETURNS trigger AS $$
    BEGIN
      NEW.search_vector :=
        setweight(to_tsvector('english', COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector('english', COALESCE(NEW.description, '')), 'B') ||
        setweight(to_tsvector('english', COALESCE(NEW.buyer_name, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.procuring_entity_name, '')), 'C') ||
        setweight(to_tsvector('english', COALESCE(NEW.category, '')), 'D') ||
        setweight(to_tsvector('english', COALESCE(NEW.province, '')), 'D');
      NEW.updated_at := NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql
  `;
  console.log("Created search trigger function");

  // Create trigger
  await sql`DROP TRIGGER IF EXISTS tenders_search_trigger ON tenders`;
  await sql`
    CREATE TRIGGER tenders_search_trigger
      BEFORE INSERT OR UPDATE ON tenders
      FOR EACH ROW EXECUTE FUNCTION tenders_search_update()
  `;
  console.log("Created search trigger");

  // Create sync log table
  await sql`
    CREATE TABLE IF NOT EXISTS sync_log (
      id SERIAL PRIMARY KEY,
      started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      completed_at TIMESTAMPTZ,
      status TEXT NOT NULL DEFAULT 'running',
      tenders_fetched INTEGER DEFAULT 0,
      tenders_upserted INTEGER DEFAULT 0,
      date_from TEXT,
      date_to TEXT,
      error_message TEXT,
      duration_ms INTEGER
    )
  `;
  await sql`CREATE INDEX IF NOT EXISTS idx_sync_log_status ON sync_log(status)`;
  await sql`CREATE INDEX IF NOT EXISTS idx_sync_log_started_at ON sync_log(started_at DESC)`;
  console.log("Created sync_log table");

  console.log("Migration complete!");
}

migrate().catch((err) => {
  console.error("Migration failed:", err);
  process.exit(1);
});
