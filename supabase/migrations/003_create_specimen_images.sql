-- ============================================
-- 标本图片表 specimen_images
-- 存储从 GBIF/iNaturalist 获取的物种标本图片
-- ============================================

CREATE TABLE IF NOT EXISTS specimen_images (
  id              SERIAL PRIMARY KEY,
  species_id      INTEGER NOT NULL REFERENCES species(id) ON DELETE CASCADE,
  url             TEXT NOT NULL,
  thumbnail_url   TEXT,
  view_type       TEXT NOT NULL DEFAULT 'dorsal',
  is_primary      BOOLEAN DEFAULT FALSE,
  source          TEXT NOT NULL DEFAULT 'gbif',
  source_id       TEXT,
  photographer    TEXT,
  license         TEXT,
  dataset_name    TEXT,
  country         TEXT,
  sort_order      INTEGER DEFAULT 0,
  status          INTEGER DEFAULT 1,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_specimen_images_species ON specimen_images(species_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_specimen_one_primary
  ON specimen_images(species_id) WHERE is_primary = TRUE;

-- RLS: 公开可读，仅管理员可写
ALTER TABLE specimen_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "标本图片公开可读" ON specimen_images
  FOR SELECT USING (true);

CREATE POLICY "仅管理员可写入标本图片" ON specimen_images
  FOR ALL USING (false);
