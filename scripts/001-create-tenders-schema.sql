-- Tenders table: stores flattened tender data for fast querying
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
  -- Store the full JSON for the detail view
  raw_release JSONB NOT NULL,
  -- Sync metadata
  synced_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for fast filtering and searching
CREATE INDEX IF NOT EXISTS idx_tenders_status ON tenders(status);
CREATE INDEX IF NOT EXISTS idx_tenders_province ON tenders(province);
CREATE INDEX IF NOT EXISTS idx_tenders_category ON tenders(category);
CREATE INDEX IF NOT EXISTS idx_tenders_tender_period_end ON tenders(tender_period_end);
CREATE INDEX IF NOT EXISTS idx_tenders_tender_period_start ON tenders(tender_period_start);
CREATE INDEX IF NOT EXISTS idx_tenders_release_date ON tenders(release_date);
CREATE INDEX IF NOT EXISTS idx_tenders_buyer_name ON tenders(buyer_name);
CREATE INDEX IF NOT EXISTS idx_tenders_synced_at ON tenders(synced_at);

-- Full-text search index
ALTER TABLE tenders ADD COLUMN IF NOT EXISTS search_vector tsvector;

CREATE INDEX IF NOT EXISTS idx_tenders_search ON tenders USING GIN(search_vector);

-- Trigger to auto-update the search vector on insert/update
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
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tenders_search_trigger ON tenders;
CREATE TRIGGER tenders_search_trigger
  BEFORE INSERT OR UPDATE ON tenders
  FOR EACH ROW EXECUTE FUNCTION tenders_search_update();

-- Sync log table: tracks sync operations
CREATE TABLE IF NOT EXISTS sync_log (
  id SERIAL PRIMARY KEY,
  started_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'running', -- running, completed, failed
  tenders_fetched INTEGER DEFAULT 0,
  tenders_upserted INTEGER DEFAULT 0,
  date_from TEXT,
  date_to TEXT,
  error_message TEXT,
  duration_ms INTEGER
);

CREATE INDEX IF NOT EXISTS idx_sync_log_status ON sync_log(status);
CREATE INDEX IF NOT EXISTS idx_sync_log_started_at ON sync_log(started_at DESC);
