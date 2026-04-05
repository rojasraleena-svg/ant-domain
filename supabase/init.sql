-- ============================================
-- 蚁域 Supabase 初始化脚本
-- 在 Supabase Dashboard → SQL Editor 中执行
-- ============================================

-- ============================================
-- 1. 启用必要扩展
-- ============================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================
-- 2. 用户表 users（自定义用户名密码认证）
-- ============================================
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  username        TEXT UNIQUE NOT NULL,
  password_hash   TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- 注册时允许插入新用户
CREATE POLICY "允许注册新用户" ON users
  FOR INSERT WITH CHECK (true);

-- 登录时允许按用户名查询（通过 service_role 绕过 RLS，此策略作为备用）
CREATE POLICY "允许查询用户" ON users
  FOR SELECT USING (true);

-- 用户可更新自己的信息
CREATE POLICY "用户可更新自己" ON users
  FOR UPDATE USING (true);

CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. 物种表 species
-- ============================================
CREATE TABLE IF NOT EXISTS species (
  id                SERIAL PRIMARY KEY,
  name_cn           TEXT NOT NULL,
  name_lat          TEXT UNIQUE NOT NULL,
  subfamily         TEXT NOT NULL DEFAULT 'Formicinae',
  genus             TEXT NOT NULL,
  subfamily_cn      TEXT,
  genus_cn          TEXT,
  summary           TEXT,
  description       TEXT,
  worker_size       TEXT,
  queen_size        TEXT,
  body_color        TEXT,
  key_features      TEXT,
  difficulty        INTEGER DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 3),
  beginner_friendly BOOLEAN DEFAULT FALSE,
  temp_min          INTEGER,
  temp_max          INTEGER,
  temp_optimal      TEXT,
  humidity_min      INTEGER,
  humidity_max      INTEGER,
  humidity_optimal  TEXT,
  diet_type         TEXT,
  nest_type         TEXT,
  need_hibernation  BOOLEAN DEFAULT FALSE,
  distribution      TEXT,
  habitat           TEXT,
  flight_season     TEXT,
  flight_time       TEXT,
  colony_scale      TEXT,
  behavior_notes    TEXT,
  faq               JSONB,
  life_stage_overview TEXT,
  similar_species   JSONB,
  reference         TEXT,
  tags              JSONB,
  cover_image       TEXT,
  status            INTEGER DEFAULT 1,
  sort_order        INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_species_subfamily ON species(subfamily);
CREATE INDEX IF NOT EXISTS idx_species_genus ON species(genus);
CREATE INDEX IF NOT EXISTS idx_species_difficulty ON species(difficulty);
CREATE INDEX IF NOT EXISTS idx_species_beginner ON species(beginner_friendly);

-- RLS: 资料库公开可读，仅管理员可写
ALTER TABLE species ENABLE ROW LEVEL SECURITY;

CREATE POLICY "物种数据公开可读" ON species
  FOR SELECT USING (true);

CREATE POLICY "仅管理员可写入物种" ON species
  FOR ALL USING (false); -- MVP 阶段通过 Dashboard 手动管理

-- 自动更新 updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_species_updated_at
  BEFORE UPDATE ON species
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 3. 生活史阶段表 life_stages
-- ============================================
CREATE TABLE IF NOT EXISTS life_stages (
  id                SERIAL PRIMARY KEY,
  stage_key         TEXT UNIQUE NOT NULL,
  name              TEXT NOT NULL,
  name_en           TEXT,
  order_index       INTEGER NOT NULL,
  definition        TEXT,
  external_features TEXT,
  common_behaviors  TEXT,
  care_notes        TEXT,
  common_mistakes   TEXT,
  duration_base     TEXT,
  duration_note     TEXT,
  prev_stage        TEXT,
  next_stage        TEXT,
  milestone         BOOLEAN DEFAULT FALSE,
  icon              TEXT,
  color             TEXT,
  target_genus      TEXT DEFAULT 'Camponotus',
  tips              JSONB,
  created_at        TIMESTAMPTZ DEFAULT NOW(),
  updated_at        TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_life_stages_order ON life_stages(order_index);

ALTER TABLE life_stages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "生活史阶段公开可读" ON life_stages
  FOR SELECT USING (true);

CREATE POLICY "仅管理员可写入生活史" ON life_stages
  FOR ALL USING (false);

CREATE TRIGGER update_life_stages_updated_at
  BEFORE UPDATE ON life_stages
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 4. 蚁群表 colonies
-- ============================================
CREATE TABLE IF NOT EXISTS colonies (
  id              SERIAL PRIMARY KEY,
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  species_id      INTEGER NOT NULL REFERENCES species(id) ON DELETE CASCADE,
  avatar          TEXT,
  founded_date    TIMESTAMPTZ NOT NULL,
  acquired_date   TIMESTAMPTZ,
  acquire_method  TEXT,
  queen_count     INTEGER DEFAULT 1,
  current_stage   TEXT, -- 引用 life_stages.stage_key
  worker_range    TEXT,
  notes           TEXT,
  status          INTEGER DEFAULT 1, -- 1=正常 2=冬眠 3=已结束
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_colonies_user ON colonies(user_id);
CREATE INDEX IF NOT EXISTS idx_colonies_user_status ON colonies(user_id, status);

ALTER TABLE colonies ENABLE ROW LEVEL SECURITY;

-- 用户只能看到自己的蚁群
CREATE POLICY "用户可查看自己的蚁群" ON colonies
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "用户可创建自己的蚁群" ON colonies
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可更新自己的蚁群" ON colonies
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户可删除自己的蚁群" ON colonies
  FOR DELETE USING (auth.uid() = user_id);

CREATE TRIGGER update_colonies_updated_at
  BEFORE UPDATE ON colonies
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- 5. 日志表 colony_logs
-- ============================================
CREATE TABLE IF NOT EXISTS colony_logs (
  id              SERIAL PRIMARY KEY,
  colony_id       INTEGER NOT NULL REFERENCES colonies(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL,
  date            TIMESTAMPTZ NOT NULL,
  title           TEXT NOT NULL,
  content         TEXT,
  stage           TEXT, -- 引用 life_stages.stage_key
  worker_count    TEXT,
  egg_status      TEXT, -- none | few | many | abundant
  larva_status    TEXT,
  pupa_status     TEXT,
  feeding_record  TEXT,
  temperature     DECIMAL(4,1),
  humidity        DECIMAL(5,2),
  abnormal_type   TEXT, -- death | escape | disease | none
  abnormal_detail TEXT,
  images          JSONB,
  ai_summary      TEXT,
  event_type      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_logs_colony ON colony_logs(colony_id);
CREATE INDEX IF NOT EXISTS idx_logs_colony_date ON colony_logs(colony_id, date);
CREATE INDEX IF NOT EXISTS idx_logs_user ON colony_logs(user_id);

ALTER TABLE colony_logs ENABLE ROW LEVEL SECURITY;

-- 用户只能操作自己蚁群的日志
CREATE POLICY "用户可查看自己的日志" ON colony_logs
  FOR SELECT USING (
    auth.uid() = user_id OR
    colony_id IN (SELECT id FROM colonies WHERE user_id = auth.uid())
  );

CREATE POLICY "用户可创建自己的日志" ON colony_logs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户可更新自己的日志" ON colony_logs
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "用户可删除自己的日志" ON colony_logs
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 6. 阶段-物种差异表 stage_species_diffs（预留）
-- ============================================
CREATE TABLE IF NOT EXISTS stage_species_diffs (
  id            SERIAL PRIMARY KEY,
  stage_key     TEXT NOT NULL REFERENCES life_stages(stage_key),
  genus         TEXT NOT NULL,
  duration      TEXT,
  temp_note     TEXT,
  special_notes TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS idx_stage_diff_unique ON stage_species_diffs(stage_key, genus);

ALTER TABLE stage_species_diffs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "差异表公开可读" ON stage_species_diffs
  FOR SELECT USING (true);

CREATE POLICY "仅管理员可写入差异表" ON stage_species_diffs
  FOR ALL USING (false);

-- ============================================
-- 7. Storage：图片存储桶
-- ============================================

-- 蚁群封面/日志图片存储桶
INSERT INTO storage.buckets (id, name, public)
VALUES ('colony-images', 'colony-images', true)
ON CONFLICT (id) DO NOTHING;

-- 物种封面图存储桶
INSERT INTO storage.buckets (id, name, public)
VALUES ('species-images', 'species-images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage RLS 策略

-- 蚁群图片：已登录用户可上传，所有人可查看
CREATE POLICY "公开查看蚁群图片" ON storage.objects
  FOR SELECT USING (bucket_id = 'colony-images');

CREATE POLICY "已登录用户可上传蚁群图片" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'colony_images' AND auth.role() = 'authenticated'
  );

CREATE POLICY "用户可删除自己的蚁群图片" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'colony_images' AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 物种图片：公开可读，仅管理员可写
CREATE POLICY "公开查看物种图片" ON storage.objects
  FOR SELECT USING (bucket_id = 'species-images');

CREATE POLICY "仅管理员可上传物种图片" ON storage.objects
  FOR ALL USING (bucket_id = 'species-images' AND false);

-- ============================================
-- 8. 种子数据：生活史阶段（弓背蚁属）
-- ============================================
INSERT INTO life_stages (stage_key, name, name_en, order_index, definition, external_features, common_behaviors, care_notes, common_mistakes, duration_base, duration_note, prev_stage, next_stage, milestone, icon, color, target_genus, tips) VALUES
(
  'nuptial_flight',
  '婚飞',
  'Nuptial Flight',
  1,
  '有翅雄蚁和雌蚁（未来蚁后）在特定天气条件下集体飞行交配。',
  '大量有翅蚂蚁从巢中飞出；空中交配后雄蚁死亡，雌蚁落地脱翅。',
  '婚飞前工蚁频繁出入巢口；婚飞时成千上万有翅蚁同时起飞。',
  '这是获得新蚁后的主要途径。野外采集需注意安全，避免被咬伤或从高处跌落。',
  '"所有蚂蚁同时婚飞" — 实际不同种有不同婚飞窗口，同一地区可能持续数周。',
  '数小时（婚飞本身）；落地后数小时内脱翅',
  '通常发生在 5-8 月雨后闷热傍晚，具体时间因地区和物种而异',
  NULL,
  'nesting',
  true,
  '✈️',
  '#8B5CF6',
  'Camponotus',
  '["婚飞多在雨后闷热傍晚发生", "不同物种婚飞时间窗口不同", "落地后的新蚁后是最理想的采集对象"]'::jsonb
),
(
  'nesting',
  '建巢 / 创群',
  'Colony Founding',
  2,
  '新生蚁后寻找合适位置，封闭自己开始产卵，完全依靠自身储备营养度过初期。',
  '蚁后体型明显缩小（消耗自身营养）；可见白色卵粒；几乎不活动。',
  '自我封闭、清理卵周围环境、极少移动、用身体保护卵粒。',
  '**绝对黑暗**、**绝对安静**、**不要打扰**、**不要喂食**！将蚁后放入试管并遮光放置。',
  '"新蚁后需要喂食" — 错误！初期完全靠消耗自身脂肪和肌肉组织存活。',
  '约 4-6 周（至第一批工蚁出现）',
  '25°C 下约 4-6 周；温度越高发育越快但蚁后消耗也更快',
  'nuptial_flight',
  'egg',
  true,
  '🏠',
  '#F59E0B',
  'Camponotus',
  '["使用试管 + 棉花塞作为初始巢穴", "保持 24-28°C 加速发育", "绝对不要频繁打开观察"]'::jsonb
),
(
  'egg',
  '卵期',
  'Egg Stage',
  3,
  '蚁后产下的卵，呈米白色椭圆形，是蚁群生命的起点。',
  '米白色/微黄白色、椭圆形、约 1mm 大小、半透明、光滑、静止不动。',
  '卵被蚁后集中护理，用触角和口器不断清洁；会定期翻动卵堆。',
  '不要移动试管/巢穴；保持温湿度稳定（25°C / 60%）；避免震动。',
  '"卵不动就是死了" — 正常现象，蚂蚁卵本身就不会动。',
  '10-14 天',
  '25°C 条件下约 10-14 天；温度每降低 2°C 延长约 2-3 天',
  'nesting',
  'larva',
  false,
  '🥚',
  '#EF4444',
  'Camponotus',
  '["卵的数量是判断蚁后健康的重要指标", "健康蚁后每天可产 1-3 枚卵"]'::jsonb
),
(
  'larva',
  '幼虫期',
  'Larval Stage',
  4,
  '卵孵化后形成的蠕虫状幼虫，需要被喂养才能发育到蛹期。',
  '白色、蠕虫状、不分节或轻微分节、会蠕动、体型随时间明显增大。',
  '被蚁后（或工蚁）搬运和喂养；会吐丝结茧的准备工作（弓背蚁会结茧）。',
  '此阶段开始需要蛋白质食物（但初期仍靠蚁后唾腺分泌）；保持湿度充足。',
  '"幼虫不动的就是不健康" — 幼虫大部分时间是静止的，偶尔蠕动是正常的。',
  '14-21 天',
  '25°C 下约 14-21 天；弓背蚁幼虫会吐丝做茧',
  'egg',
  'pupa',
  false,
  '🐛',
  '#F97316',
  'Camponotus',
  '["这是判断蚁群是否健康的关键指标 — 幼虫饱满发亮=健康", "幼虫数量直接决定第一批工蚁的数量"]'::jsonb
),
(
  'pupa',
  '蛹期',
  'Pupal Stage',
  5,
  '幼虫完成发育后进入蛹期，弓背蚁会结茧包裹蛹体，等待羽化为成虫。',
  '白色/浅黄色、静止不动、茧壳包裹（弓背蚁有茧）、茧内可见蛹体轮廓。',
  '完全静止、不进食、内部进行剧烈的组织重构。',
  '蛹非常脆弱，避免震动；此阶段对湿度敏感（过低会导致干瘪）；不要打开茧。',
  '"蛹变黑了是正常变色" — 变黑通常意味着死亡或真菌感染，需立即隔离处理。',
  '14-21 天',
  '25°C 下约 14-21 天；临近羽化时蛹颜色会逐渐变深',
  'larva',
  'first_workers',
  false,
  '🪲',
  '#EAB308',
  'Camponotus',
  '["蛹期对湿度要求最高，建议保持在 60-70%", "即将羽化的蛹颜色会变深"]'::jsonb
),
(
  'first_workers',
  '第一批工蚁羽化',
  'First Workers Eclose',
  6,
  '第一批蛹羽化为工蚁，标志蚁群从"单后独居"正式进入"社会性群体"阶段。',
  '可见小型浅色工蚁在巢中活动；刚羽化的工蚁体色较浅，几天后变深。',
  '工蚁开始觅食、照顾后续幼虫、清理巢穴、喂养蚁后。',
  '里程碑事件！此时可以开始少量喂食（1:10 糖水为主）；保持黑暗环境。',
  '"工蚁出来就可以敞开养了" — 错误！早期群体仍然脆弱，需要继续精心照料。',
  '即时事件',
  '这是蚁群发展中最关键的转折点之一',
  'pupa',
  'early_growth',
  true,
  '🐜',
  '#22C55E',
  'Camponotus',
  '["首次喂食建议：1:10 糖水，用棉签提供", "第一批工蚁通常只有 3-10 只，体型较小"]'::jsonb
),
(
  'early_growth',
  '初级扩群',
  'Early Growth',
  7,
  '第一批工蚁工作后，蚁后专注产卵，群体数量逐步增加但仍处于脆弱期。',
  '工蚁数量缓慢增加（10-50 只）；可见各发育阶段的幼体并存；蚁后明显变大。',
  '工蚁分工明确（觅食/育幼/清洁）；蚁后持续高产卵；可能出现第一次搬巢需求。',
  '每 2-3 天喂食一次；糖水 + 少量蛋白质（昆虫尸体）；控制喂食量避免污染。',
  '"群体大了就不怕了" — 50 只以下的弓背蚁群体仍然非常脆弱，疾病可能导致全群覆灭。',
  '首批工蚁后 1-3 个月',
  '工蚁达到 10-50 只；此阶段可能经历第一次搬巢',
  'first_workers',
  'steady_growth',
  false,
  '📈',
  '#14B8A6',
  'Camponotus',
  '["第一次搬巢通常发生在此阶段", "蛋白质食物对群体增长至关重要", "保持耐心，此阶段增长相对缓慢"]'::jsonb
),
(
  'steady_growth',
  '稳定增长',
  'Steady Growth',
  8,
  '群体进入指数增长期，分工明确，各司其职，群体结构趋于复杂。',
  '工蚁数量快速增长（50-200+ 只）；出现明显的工蚁形态分化（大/中/小型）。',
  '明确的社会分工；大规模育幼活动；可能开始建造更复杂的巢室结构。',
  '可能需要搬入正式蚁巢（石膏/亚克力/3D 打印）；定期投喂多样化食谱；注意卫生管理。',
  '"大群体就不用担心了" — 群体增大后疾病传播更快，一旦爆发后果更严重。',
  '建群 3-12 个月',
  '工蚁 50-200+ 只；此阶段是选择/制作正式蚁巢的最佳时机',
  'early_growth',
  'mature',
  false,
  '🏗️',
  '#0EA5E9',
  'Camponotus',
  '["大型群体需要更大的生存空间", "可以开始尝试多样化食谱", "定期检查群体健康状况"]'::jsonb
),
(
  'mature',
  '成熟群体',
  'Mature Colony',
  9,
  '群体达到较大规模，产生繁殖蚁（雄蚁 + 新雌蚁），具备独立繁殖能力。',
  '数百至数千只工蚁；出现有翅繁殖蚁（雄蚁和新蚁后）；群体行为高度协调。',
  '产生繁殖蚁准备婚飞；部分工蚁专门负责照看繁殖蚁；群体可能有分蜂倾向。',
  '大型群体需要更大巢穴空间；可能需要考虑分蜂或提供额外空间；管理复杂度显著提升。',
  '"成熟群体不需要特别照顾" — 成熟群体反而更需要精细化管理，因为投入的时间和情感成本更高。',
  '建群 2 年以上',
  '数百至数千只工蚁；家养环境下不一定自然产生繁殖蚁',
  'steady_growth',
  'hibernation',
  false,
  '👑',
  '#6366F1',
  'Camponotus',
  '["家养环境下可能不会自然产生繁殖蚁", "成熟群体的日常维护工作量其实较小", "重点在于长期稳定的环境条件"]'::jsonb
),
(
  'hibernation',
  '季节变化 / 冬眠',
  'Seasonal Change / Hibernation',
  10,
  '温带地区的弓背蚁在冬季进入休眠状态，代谢大幅降低以度过不良季节。',
  '活动大幅减少；停止产卵；聚集在巢穴深处；对外界刺激反应迟钝。',
  '聚集抱团保温；极少移动；停止进食；代谢率降至最低水平。',
  '冬眠温度 5-10°C（不可低于 0°C 或高于 15°C）；冬眠期间 **不喂食**；逐渐降温/升温。',
  '"冬天加热让它们继续生长" — 这会严重缩短蚁后寿命，导致次年繁殖力下降甚至死亡。',
  '约 3-4 个月',
  '11 月 - 次年 2-3 月；热带弓背蚁种不需要冬眠',
  'mature',
  NULL,
  true,
  '❄️',
  '#94A3B8',
  'Camponotus',
  '["冬眠前确保群体足够强壮（至少 30+ 工蚁）", "降温过程应循序渐进（每周降 2-3°C）", "热带物种如尼科巴弓背蚁不需要冬眠"]'::jsonb
)
ON CONFLICT (stage_key) DO NOTHING;

-- ============================================
-- 9. 种子数据：物种（蚁亚科 MVP 核心物种）
-- ============================================
INSERT INTO species (name_cn, name_lat, subfamily, genus, subfamily_cn, genus_cn, summary, worker_size, queen_size, body_color, key_features, difficulty, beginner_friendly, temp_min, temp_max, temp_optimal, humidity_min, humidity_max, humidity_optimal, diet_type, nest_type, need_hibernation, distribution, habitat, flight_season, flight_time, colony_scale, behavior_notes, tags, status, sort_order) VALUES
(
  '日本弓背蚁',
  'Camponotus japonicus',
  'Formicinae',
  'Camponotus',
  '蚁亚科',
  '弓背蚁属',
  '日本弓背蚁是国内最常见的入门饲养弓背蚁种类之一，分布广泛，适应性强，饲养难度低，非常适合新手入门。工蚁体型中等偏大，具有典型的弓背蚁外形特征。',
  '6-12mm',
  '14-16mm',
  '黑色至黑褐色，部分个体腹部略带褐色',
  '头部较大且近方形；胸部有明显的弧形隆起（"弓背"特征）；上颚强壮',
  1,
  true,
  18,
  30,
  '24-28',
  50,
  80,
  '60-70',
  'omnivore',
  'test_tube / gypsum / acrylic',
  true,
  '中国（除新疆、西藏、青海外的绝大部分地区）、朝鲜半岛、日本',
  '林地边缘、草地、路边石缝、枯木下',
  '6-8月',
  '傍晚至夜间，尤其雨后闷热天气',
  '中型群体，成熟后可达数百只工蚁',
  '性格温和，受惊扰时会装死或快速逃跑；昼夜均活动但夜行性更强；善于利用现有缝隙筑巢',
  '["新手推荐", "国内常见", "温带种", "经典入门"]'::jsonb,
  1,
  1
),
(
  '尼科巴弓背蚁',
  'Camponotus nicobarensis',
  'Formicinae',
  'Camponotus',
  '蚁亚科',
  '弓背蚁属',
  '尼科巴弓背蚁是近年来在国内非常热门的热带弓背蚁品种，生长速度快，体色美观（金黄/橘红色），全年活跃无需冬眠，深受新手欢迎。',
  '5-10mm',
  '12-14mm',
  '金黄色至橘红色，腹部末端较深',
  '体型比日本弓背蚁稍小但更修长；体色鲜艳是其最大识别特点',
  1,
  true,
  22,
  32,
  '26-30',
  60,
  85,
  '70-80',
  'omnivore',
  'test_tube / plaster / acrylic',
  false,
  '中国南方（云南、广西、广东、海南、台湾）、东南亚、南亚',
  '热带森林、灌木丛、花园',
  '4-9月（热带地区可多次）',
  '黄昏至夜间',
  '中型群体，生长速度快',
  '非常活跃好动，生长速度在弓背蚁中属于较快水平；全年不需冬眠；喜欢温暖潮湿环境',
  '["新手推荐", "热带种", "无需冬眠", "生长快", "颜值高"]'::jsonb,
  1,
  2
),
(
  '史密斯弓背蚁',
  'Camponotus smithi',
  'Formicinae',
  'Camponotus',
  '蚁亚科',
  '弓背蚁属',
  '史密斯弓背蚁是一种大型弓背蚁，体型健壮，外观威武。适合有一定经验的进阶饲养者。其大工蚁体型可观，观赏性强。',
  '8-15mm',
  '16-18mm',
  '黑色，有时带有暗褐色光泽',
  '大型弓背蚁代表；体型粗壮；大工蚁与小型工蚁差异明显（多态性）',
  2,
  false,
  20,
  30,
  '24-27',
  55,
  75,
  '60-70',
  'omnivore',
  'gypsum / acrylic / 3d_printed',
  true,
  '中国华东、华中、华南地区',
  '山地森林、阔叶林',
  '5-7月',
  '傍晚',
  '中大型群体，成熟后可达数百至上千只',
  '攻击性中等，受到威胁时会张开上颚示威；多态性明显；筑巢能力强',
  '["进阶推荐", "大型种", "多态性", "温带种"]'::jsonb,
  1,
  3
),
(
  '费氏弓背蚁',
  'Camponotus festinus',
  'Formicinae',
  'Camponotus',
  '蚁亚科',
  '弓背蚁属',
  '费氏弓背蚁是一种主要分布在热带地区的弓背蚁，适应性较强，在中国南方部分地区有分布。',
  '6-11mm',
  '13-15mm',
  '红褐色至黑褐色',
  '体型介于日本弓背蚁和尼科巴之间；体色多变',
  2,
  false,
  22,
  32,
  '25-29',
  60,
  85,
  '70-80',
  'omnivore',
  'test_tube / plaster',
  false,
  '中国云南、广西、海南及东南亚各国',
  '热带季雨林、次生林',
  '5-8月',
  '夜间为主',
  '中型群体',
  '热带种特性，活跃期长；对湿度要求较高',
  '["热带种", "无需冬眠", "进阶推荐"]'::jsonb,
  1,
  4
),
(
  '宽结弓背蚁',
  'Camponotus tortuganus',
  'Formicinae',
  'Camponotus',
  '蚁亚科',
  '弓背蚁属',
  '宽结弓背蚁分布广泛，其名称来源于柄节（腰部）较宽的特征。适应性较强，可在多种环境中生存。',
  '5-9mm',
  '12-14mm',
  '黑褐色',
  '柄节（第一腹节）较宽是其命名来源；整体体型偏小巧灵活',
  2,
  false,
  18,
  30,
  '24-28',
  55,
  80,
  '65-75',
  'omnivore',
  'test_tube / gypsum',
  true,
  '中国大部分地区、东南亚广泛分布',
  '多种生境均可发现',
  '5-8月',
  '傍晚',
  '中小型群体',
  '适应性强；行动敏捷；筑巢方式多样',
  '["分布广", "适应性强", "温带种"]'::jsonb,
  1,
  5
),
(
  '拟黑多刺蚁',
  'Polyrhachis dives',
  'Formicinae',
  'Polyrhachis',
  '蚁亚科',
  '多刺蚁属',
  '拟黑多刺蚁是国产最经典的入门蚂蚁之一，外形独特（背部有刺），性格温和，饲养简单，繁殖速度快，是非常理想的新手入门物种。',
  '4-7mm',
  '10-12mm',
  '黑色具金属光泽（蓝绿/紫金色光泽）',
  '胸部和腹部背面具有明显的棘刺；金属光泽强烈；外形极具辨识度',
  1,
  true,
  20,
  30,
  '25-28',
  60,
  80,
  '65-75',
  'omnivore',
  'test_tube / plaster / plant',
  false,
  '中国南方大部分省份（云南、贵州、广西、广东、福建、台湾等）、东南亚',
  '树木上（树栖性）、灌木丛',
  '4-9月',
  '午后至傍晚',
  '中小型群体，繁殖速度快',
  '树栖性蚂蚁，可以在植物上筑巢；性格极其温和几乎不攻击人；繁殖速度在蚁亚科中名列前茅',
  '["新手推荐", "国产经典", "树栖性", "无需冬眠", "颜值高", "繁殖快"]'::jsonb,
  1,
  6
),
(
  '双齿多刺蚁',
  'Polyrhachis lamellidens',
  'Formicinae',
  'Polyrhachis',
  '蚁亚科',
  '多刺蚁属',
  '双齿多刺蚁因其胸部具有一对独特的齿状突起而得名，外观奇特，观赏价值高。适合有一定基础的饲养者。',
  '5-8mm',
  '11-13mm',
  '黑色带蓝绿色金属光泽',
  '胸部具有两个明显的齿状突起（双齿）；整体覆盖细密刻点',
  2,
  false,
  18,
  28,
  '22-26',
  60,
  80,
  '65-75',
  'omnivore',
  'plant / plaster',
  true,
  '中国华东、华中、华南、西南地区，日本',
  '树林、灌木丛',
  '5-7月',
  '白天为主',
  '中小型群体',
  '相比拟黑多刺蚁更偏好凉爽环境；具有一定的防御能力',
  '["外观独特", "进阶推荐", "温带种"]'::jsonb,
  1,
  7
)
ON CONFLICT (name_lat) DO NOTHING;

-- ============================================
-- 完成
-- ============================================
-- 执行后请验证：
-- SELECT count(*) FROM species;          -- 应返回 7+
-- SELECT count(*) FROM life_stages;       -- 应返回 10
-- SELECT * FROM storage.buckets;          -- 应包含 colony-images 和 species-images
