-- 为 specimen_images.source_id 添加唯一约束（支持 upsert 去重）
CREATE UNIQUE INDEX IF NOT EXISTS idx_specimen_images_source_id
  ON specimen_images(source_id) WHERE source_id IS NOT NULL;
