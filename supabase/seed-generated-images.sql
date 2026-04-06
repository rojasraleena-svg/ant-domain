-- ============================================
-- generated_images 表：AI 生成的物种插图记录
-- 全局共享，按 species_id 归属，记录 created_by
-- ============================================

CREATE TABLE IF NOT EXISTS generated_images (
  id              SERIAL PRIMARY KEY,
  species_id      INTEGER NOT NULL REFERENCES species(id) ON DELETE CASCADE,
  url             TEXT NOT NULL,
  thumbnail_url   TEXT,

  -- 生成参数（便于筛选和复现）
  prompt          TEXT NOT NULL,
  model           TEXT NOT NULL DEFAULT 'image-01',
  view_type       TEXT,            -- dorsal / lateral / frontal / habitat
  style           TEXT,            -- scientific / macro_photo / watercolor / realistic
  caste           TEXT,            -- worker / queen / soldier / male
  aspect_ratio    TEXT DEFAULT '1:1',

  -- 管理字段
  is_featured     BOOLEAN DEFAULT FALSE,   -- 是否设为物种封面
  status          INTEGER DEFAULT 1,       -- 1: 正常 0: 已删除
  created_by      UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  task_id         TEXT,                   -- MiniMax 任务 ID

  -- 时间戳
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 索引
CREATE INDEX IF NOT EXISTS idx_generated_images_species ON generated_images(species_id);
CREATE INDEX IF NOT EXISTS idx_generated_images_created_by ON generated_images(created_by);
CREATE INDEX IF NOT EXISTS idx_generated_images_status ON generated_images(status);
CREATE INDEX IF NOT EXISTS idx_generated_images_featured ON generated_images(species_id) WHERE is_featured = TRUE;

-- 注释
COMMENT ON TABLE generated_images IS 'AI 生成的物种插图，全局共享';
COMMENT ON COLUMN generated_images.url IS 'Supabase Storage 永久公开 URL';
COMMENT ON COLUMN generated_images.model IS '使用的 AI 图像生成模型';
COMMENT ON COLUMN generated_images.is_featured IS '是否设为该物种的封面图';
COMMENT ON COLUMN generated_images.created_by IS '生成者（auth.users）';
