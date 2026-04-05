-- ============================================
-- 蚁域 API Keys 表迁移
-- 在 Supabase Dashboard → SQL Editor 中执行
-- ============================================

-- ============================================
-- 0. 启用 uuid 生成函数
-- ============================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 1. 创建 api_keys 表
-- ============================================
CREATE TABLE IF NOT EXISTS api_keys (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name        TEXT NOT NULL,
  key_hash    TEXT UNIQUE NOT NULL,
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. 创建索引
-- ============================================
CREATE INDEX IF NOT EXISTS idx_api_keys_user ON api_keys(user_id);
CREATE INDEX IF NOT EXISTS idx_api_keys_key_hash ON api_keys(key_hash);

-- ============================================
-- 3. RLS 策略
-- ============================================
ALTER TABLE api_keys ENABLE ROW LEVEL SECURITY;

-- 用户只能看到自己的 API Keys
CREATE POLICY "用户可查看自己的 API Keys" ON api_keys
  FOR SELECT USING (auth.uid() = user_id);

-- 用户只能创建自己的 API Keys
CREATE POLICY "用户可创建自己的 API Keys" ON api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 用户只能删除自己的 API Keys
CREATE POLICY "用户可删除自己的 API Keys" ON api_keys
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 4. 验证
-- ============================================
-- SELECT * FROM api_keys LIMIT 1;
