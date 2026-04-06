# 生活史模块 AI 趣味化 — 调研报告与实施方案

> 版本: v1.1 | 日期: 2026-04-06 | 状态: 调研完成，含放置位置与生成策略分析

---

## 目录

1. [现状诊断](#1-现状诊断)
2. [六大方向总览](#2-六大方向总览)
3. [方向一：AI 故事讲述器（详细方案）](#3-方向一ai-故事讲述器)
   - 3.1 [产品愿景](#31-产品愿景)
   - 3.2 [用户体验流程](#32-用户体验流程)
   - 3.3 [技术架构](#33-技术架构)
   - 3.4 [详细实现规范](#34-详细实现规范)
   - 3.5 [复用关系](#35-与现有代码的复用关系)
   - 3.6 [风险与缓解](#36-风险与缓解)
   - 3.7 [未来演进](#37-未来演进-v11)
4. [放置位置决策](#4-放置位置决策)
5. [生成策略决策](#5-生成策略决策)
6. [方向二：AI 阶段定位问答](#6-方向二ai-阶段定位问答)
7. [方向三：AI 阶段插图生成](#7-方向三ai-阶段插图生成)
8. [方向四：AI 属间对比问答](#8-方向四ai-属间对比问答)
9. [方向五：时间线预测](#9-方向五时间线预测)
10. [方向六：AI 冷知识彩蛋](#10-方向六ai-冷知识彩蛋)
11. [综合对比与路线图](#11-综合对比与路线图)

---

## 1. 现状诊断

### 1.1 生活史模块现状

| 文件 | 角色 | AI 参与 |
|------|------|---------|
| `src/app/lifecycle/page.tsx` | 时间线总览页（Server Component） | 无 |
| `src/app/lifecycle/[stage]/page.tsx` | 阶段详情页（Server Component） | 无 |
| 数据源: `life_stages` 表 + `stage_species_diffs` 表 | 10 阶段 × 7 属 = 70 条数据 | 纯静态 |

**生活史是全站唯一没有 AI 能力的模块。**

### 1.2 其他模块的 AI 模式参考

| 模块 | AI 用法 | 技术栈 | 趣味性来源 |
|------|---------|--------|-----------|
| 观测日志 | 多模态分析(文字+图片) → 摘要/阶段推断/风险/建议 | Claude API (`ai.ts`) | "AI 帮你看蚂蚁"即时反馈 |
| 成长周报 | 聚合多天日志 → 结构化周报 | Claude API (`ai.ts`) | 数据聚合后的成就感 |
| 蚁群建议 | 根据当前状态 → 个性化饲养建议 | Claude API (`ai.ts`) | "懂你的养蚁助手"人设 |
| AI 插图 | Claude 优化 Prompt → MiniMax 出图 → Gallery | `image-gen.ts` + MiniMax API | 视觉创造力 + 收集欲 |
| 物种详情页 | 内嵌 AI Gallery 组件 | `species-ai-gallery.tsx` | 物种 + 图片关联展示 |

### 1.3 现有 AI 基础设施

**核心文件: `src/lib/ai.ts`**
- SDK: `@anthropic-ai/sdk` (v0.82.0)，非 Vercel AI SDK
- Client 初始化: 模块级单例 (`ai.ts:8-11`)
- Model: `process.env.ANTHROPIC_MODEL || "glm-5v-turbo"`
- 调用模式: system prompt + structured user message → `client.messages.create()` → regex 解析
- 已有函数: `summarizeLog()`, `generateWeeklyReport()`, `generateColonyAdvice()`
- 解析工具: `extractSection()`, `extractList()`, `extractStage()` (私有)

**图片生成管道: `src/lib/image-gen.ts`**
- Pipeline: buildAntPrompt() → callMiniMaxAPI() → persistImagesToStorage() → saveImageRecords()
- 支持: 科学插图 / 微距摄影 / 手绘水彩 / 写实数字画
- 支持: 背面观 / 侧面观 / 正面观 / 栖息地
- 支持: 工蚁 / 蚁后 / 雄蚁 / 兵蚁
- 存储: Supabase Storage (`species-images` bucket)
- 持久化: `generated_images` 表

### 1.4 数据资产盘点

**life_stages 表 (10 行)**

| 字段 | 类型 | 示例 | 说明 |
|------|------|------|------|
| stage_key | TEXT UNIQUE | nuptial_flight, egg, pupa... | 阶段标识符 |
| name / name_en | TEXT | 婚飞 / Nuptial Flight | 中英文名 |
| definition | TEXT | 阶段科学定义 | 富文本段落 |
| external_features | TEXT | 外显特征描述 | |
| common_behaviors | TEXT | 常见行为 | |
| care_notes | TEXT | 饲养注意事项 | |
| common_mistakes | TEXT | 常见误区 | 红色警示样式 |
| duration_base | TEXT | 10-14 天 | 基准持续时间 |
| duration_note | TEXT | 温度相关时间变化 | |
| tips | JSONB | ["tip1", "tip2"] | 小贴士数组 |
| milestone | BOOLEAN | 3 个阶段为里程碑 | UI 强调标记 |
| icon / color | TEXT/TEXT | ✈️ / #8B5CF6 | UI 装饰 |
| prev_stage / next_stage | TEXT | 相邻阶段 key | 导航用 |

**stage_species_diffs 表 (60 行 = 10 阶段 × 6 属)**

| 字段 | 类型 | 说明 |
|------|------|------|
| stage_key + genus | 复合唯一键 | 阶段 + 属 |
| duration | TEXT? | 该属特异持续时间 |
| temp_note | TEXT? | 温度说明 |
| special_notes | TEXT | **最值钱的字段** — 属特异性详细行为描述 (100-300字) |

可用属: Camponotus(基线), Polyrhachis, Formica, Lasius, Paratrechina, Oecophylla, Plagiolepis

---

## 2. 六大方向总览

| # | 方向 | 一句话描述 | 复杂度 | 效果 | 独占性 |
|---|------|-----------|--------|------|--------|
| 一 | **AI 故事讲述器** | 把百科条目变成自然纪录片风格叙事 | 低 | 高高 | 中 |
| 二 | **AI 阶段定位问答** | 用户描述蚁群状态 → AI 判断所处阶段 | 低 | 高 | 高 |
| 三 | **AI 阶段插图生成** | 为每个阶段生成场景配图(婚飞/卵期/羽化...) | 中 | 高 | 高 |
| 四 | **AI 属间对比问答** | 聊天式跨属知识对比(利用60条差异数据) | 中 | 高 | 极高 |
| 五 | **时间线预测进度** | 在时间线上标注用户蚁群位置+预测下一步 | 中高 | 中 | 中 |
| 六 | **AI 冷知识彩蛋** | 预生成+实时补充的阶段趣味冷知识 | 低 | 中 | 低 |

---

## 3. 方向一：AI 故事讲述器（详细方案）

> **当前选定实现的优先方向**

### 3.1 产品愿景

将生活史详情页从「干巴巴的科学词条」升级为「沉浸式的自然纪录片体验」。用户点击展开后，AI 根据该阶段的科学数据（定义、特征、行为、属差异等）生成一段 200-400 字的生动叙事，配合诗意标题和冷知识趣闻。

### 3.2 用户体验流程

```
用户访问 /lifecycle/egg?genus=Camponotus
        ↓
页面正常加载（Server Component 渲染所有静态内容）
        ↓
滚动到 Tips 区块下方
        ↓
看到紫色虚线按钮: [📖 AI 叙事：聆听这个阶段的故事 ✨]
        ↓
点击按钮 → 面板展开 + 自动调用 AI 生成故事
        ↓
Loading 状态: spinner + "AI 正在编织故事..."
        ↓
展示结果:
  ┌─ 「黑暗中的第一缕微光」──────────────┐
  │                                       │
  │ 在温暖潮湿的巢室深处，一颗米粒大小的   │
  │ 卵正静静躺着。这是 Camponotus 新生命   │
  │ 的起点... (200-400字沉浸叙事)          │
  │                                       │
  │ ┌─ 你知道吗？────────────────────────┐│
  │ │ 弓背蚁的蚁后可产卵长达20年...      ││
  │ └───────────────────────────────────┘│
  │                                       │
  │              [换一个故事]  [收起]       │
  └───────────────────────────────────────┘
```

### 3.3 技术架构

#### 3.3.1 整体数据流

```
[Browser: LifecycleStory 组件 (Client Component)]
        |
        | 用户点击展开 → POST { stageKey, genus }
        v
[API Route: /api/lifecycle/story/route.ts]
        |
        |--- 检查内存缓存 (TTL=1h) ---命中--→ 直接返回缓存
        |
        |--- 缓存未命中:
        |--- getLifeStageByKey(stageKey)     → life_stages 表
        |--- getAllLifeStages()              → life_stages 表 (取 prev/next 名称)
        |--- getStageDiff(stageKey, genus)   → stage_species_diffs 表 (属差异)
        |
        v
[generateStageStory() in ai.ts]
        |
        | 构建 StageStoryInput (注入全部字段)
        | System Prompt: "自然纪录片解说员" 人设
        | User Message: 结构化的科学数据
        |
        v
[Claude API: client.messages.create()]
        | model: glm-5v-turbo
        | max_tokens: 800
        v
[parseStageStory()] → { title, narrative, funFact }
        |
        v
[写入缓存] → 返回给浏览器
        |
        v
[Browser: 展示故事面板]
```

#### 3.3.2 文件变更清单

| # | 文件路径 | 操作 | 改动量估计 |
|---|---------|------|-----------|
| 1 | `src/lib/ai.ts` | 修改 | +~100 行 (接口 + 函数 + 解析器) |
| 2 | `src/app/api/lifecycle/story/route.ts` | 新建 | ~65 行 (API handler + 缓存) |
| 3 | `src/components/lifecycle-story.tsx` | 新建 | ~120 行 (Client Component) |
| 4 | `src/app/lifecycle/[stage]/page.tsx` | 修改 | +~5 行 (import + 嵌入组件) |

**总计: ~290 行新代码, 1 个迁移 0 (纯应用层变更)**

### 3.4 详细实现规范

#### 3.4.1 Layer 1: AI 函数 (`src/lib/ai.ts`)

**新增接口定义:**

```typescript
/** 生活史故事生成请求参数 */
export interface StageStoryInput {
  stageKey: string;           // e.g., "egg"
  stageName: string;          // e.g., "卵期"
  stageNameEn: string;        // e.g., "Egg Stage"
  genusCnName: string;        // e.g., "弓背蚁属"
  genusLat: string;           // e.g., "Camponotus"
  definition?: string;        // 来自 life_stages.definition
  externalFeatures?: string;  // 来自 life_stages.external_features
  commonBehaviors?: string;   // 来自 life_stages.common_behaviors
  careNotes?: string;         // 来自 life_stages.care_notes
  durationBase?: string;      // 来自 life_stages.duration_base
  durationNote?: string;      // 来自 life_stages.duration_note
  specialNotes?: string;      // 来自 stage_species_diffs.special_notes (属差异金矿)
  prevStageName?: string | null;  // 前一阶段中文名
  nextStageName?: string | null;  // 后一阶段中文名
  isMilestone: boolean;       // 是否里程碑阶段
}

/** 生活史故事生成结果 */
export interface StageStoryResult {
  title: string;      // 一句话诗意标题 (15字内)
  narrative: string;  // 200-400字沉浸式正文
  funFact: string;    // 30-50字冷知识趣闻
}
```

**新增函数: `generateStageStory()`**

System Prompt 核心要点:
- **角色**: 自然纪录片解说员 + 科普作家
- **受众**: 中文蚂蚁饲养爱好者
- **视角**: 第二人称或第三人称（让读者置身蚁巢）
- **感官**: 视觉、触觉、温度、时间感受
- **约束**: 所有描述必须基于提供的数据，不得编造事实
- **属差异**: special_notes 必须融入叙事体现该属独特性
- **上下文**: 暗示前一→当前→后一阶段的时间流转
- **输出格式**: 严格的三段式 — ## 标题 / ## 故事 / ## 趣闻

User Message 构建策略: 将所有可用字段以结构化方式传入，作为 ground truth：

```
属：弓背蚁属（Camponotus）
阶段：卵期（Egg Stage）
这是一个里程碑阶段

科学定义：{definition}
外显特征：{externalFeatures}
常见行为：{commonBehaviors}
饲养要点：{careNotes}
持续时间：{durationBase}
时间备注：{durationNote}

=== 弓背蚁属的特殊之处 ===
{specialNotes}  ← 如果有属差异数据才注入

前一阶段：建巢 / 创群
后一阶段：幼虫期
```

**解析函数: `parseStageStory()`**

复用已有的 `extractSection()` 工具函数 (`ai.ts:306-318`)：
```typescript
function parseStageStory(text: string): StageStoryResult {
  const title = extractSection(text, "标题") || "生命之旅";
  const narrative = extractSection(text, "故事") || text.slice(0, 400);
  const funFact = extractSection(text, "趣闻") || "";
  return { title, narrative, funFact };
}
```

#### 3.4.2 Layer 2: API Route (`src/app/api/lifecycle/story/route.ts`)

**设计决策:**

| 决策点 | 选择 | 理由 |
|--------|------|------|
| HTTP Method | POST | 传递 stageKey + genus 参数 |
| Auth | 不需要 | 生活史是公开内容 |
| 缓存 | In-memory Map, TTL=1h | 最多 70 key, 总计 ~70KB 内存 |
| 数据获取 | Route 内部获取 | Client Component 只传 stageKey + genus，保持轻量 |

**缓存设计:**

```typescript
const storyCache = new Map<string, { data: StageStoryResult; ts: number }>();
const CACHE_TTL_MS = 3600 * 1000; // 1 小时

// cacheKey 格式: "{stageKey}:{genus}"  例如 "egg:Camponotus"
```

**Route 处理逻辑:**

```
POST /api/lifecycle/story
Body: { stageKey: string, genus?: string }

1. 校验 stageKey 非空
2. 构建 cacheKey = `${stageKey}:${genus || "Camponotus"}`
3. 检查缓存 → 命中则直接返回
4. 并行获取:
   - getLifeStageByKey(stageKey)     → 单个阶段完整数据
   - getAllLifeStages()              → 全部阶段 (取 prev/next 名称)
   - getStageDiff(stageKey, genus)   → 属差异 (仅非基线属)
5. 组装 StageStoryInput
6. 调用 generateStageStory(input)
7. 写入缓存
8. 返回 StageStoryResult JSON
```

**错误处理:** 遵循现有约定 `{ error: string }` + 对应 HTTP status code

#### 3.4.3 Layer 3: Client Component (`src/components/lifecycle-story.tsx`)

**组件接口:**

```typescript
interface LifecycleStoryProps {
  stageKey: string;   // 当前阶段标识符, 如 "egg"
  genus: string;      // 当前选中的属, 如 "Camponotus"
}
```

**状态机:**

```
[closed(收起)] ←→ [open + loading(加载中)] → [open + success(有结果)]
     ↑                                              |
     |                                    [换一个故事] → loading → success
     └────────────────← [收起按钮] ←────────────────┘
```

**UI 规格:**

| 状态 | 视觉 | 交互 |
|------|------|------|
| 收起 | 紫色虚线边框圆角按钮, 内含 BookOpen 图标 + "AI 叙事：聆听这个阶段的故事" + Sparkles 图标 | 点击展开 |
| 加载中 | 展开的紫色玻璃态卡片, 居中 Loader2 spinner + "AI 正在编织故事..." | 不可操作 |
| 有结果 | 展开的紫色玻璃态卡片, 含标题/正文/趣闻三个区域 + 操作按钮区 | 可收起/换一个 |
| 错误 | 卡片内显示红色错误文本 | 可重试 |

**颜色方案:** 紫色系 (`purple-500/400/300`)，与现有区块区分：
- 现有区块: neutral bg-card / blue 属差异 / red mistakes / accent tips
- 故事区块: **purple** (象征想象力/叙事/创意)

**CSS 类名参考 (glassmorphic 主题):**

```
容器: rounded-xl border border-purple-500/20
       bg-gradient-to-br from-purple-500/[0.03] to-transparent p-6 space-y-4

标题: text-xl font-bold leading-snug

正文: text-muted-foreground leading-relaxed whitespace-pre-wrap

趣闻卡片: rounded-lg bg-purple-500/10 border border-purple-500/20 px-4 py-3
         text-sm text-purple-300
         <span class="font-medium">你知道吗？</span>

收起按钮: text-purple-500/20 (border)
换一个按钮: RefreshCw icon + hover:text-purple-300
```

**收起态按钮:**

```
w-full flex items-center justify-center gap-2
rounded-lg border-2 border-dashed border-purple-500/30
bg-purple-500/5 px-4 py-3
text-sm font-medium text-purple-400
hover:border-purple-500/50 hover:bg-purple-500/10
transition-all duration-300
```

#### 3.4.4 Layer 4: 页面集成 (`src/app/lifecycle/[stage]/page.tsx`)

**改动位置:** Tips 区块 (`stage.tips` 部分, 约 line 246) 之后, CTA banner (line 249) 之前

**改动内容:**

```tsx
// 1. 文件顶部新增 import (约 line 10 后):
import { LifecycleStory } from "@/components/lifecycle-story";

// 2. 在 </div> (space-y-6 容器结束, 约 line 247) 之后插入:
{/* AI 叙事 */}
<div className="mt-6">
  <LifecycleStory stageKey={key} genus={selectedGenus} />
</div>
```

**总计 5 行改动**, 不影响任何现有逻辑。

### 3.5 与现有代码的复用关系

| 被复用的资产 | 来源位置 | 复用方式 |
|-------------|---------|---------|
| Anthropic client 实例 | `ai.ts:8-11` | 同一对象, 直接调用 `.messages.create()` |
| Model 配置 | `ai.ts:126,194,232` | `process.env.ANTHROPIC_MODEL \|\| "glm-5v-turbo"` |
| `extractSection()` 解析器 | `ai.ts:306-318` | 解析标题/故事/趣闻三个 section |
| Public Supabase client | `public-data.ts:4-7` | API Route 内获取阶段/差异数据 |
| `getLifeStageByKey()` | `public-data.ts:59-68` | 获取单个阶段完整行 |
| `getAllLifeStages()` | `public-data.ts:48-56` | 取 prev/next 阶段名称 |
| `getStageDiff()` | `public-data.ts:157-169` | 获取属特异数据 |
| Collapsible Panel UX | `image-generator.tsx:264-274` | 关闭=按钮, 展开=面板 的交互模式 |
| Loading/Error 状态 | `image-generator.tsx:491-514` | Spinner + 错误消息模式 |
| Section UI pattern | `page.tsx:168-175` | 圆角卡片 + 标题 + 正文 |

### 3.6 风险与缓解

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|---------|
| AI 幻觉/编造事实 | 中 | 高 | System prompt 明确要求"基于提供的数据"; 将所有科学字段作为 user message 注入 |
| 响应解析失败 | 低 | 中 | `extractSection()` 对缺失 section 有 fallback (返回默认值); 故事正文 fallback 到原始文本前 400 字 |
| 首次加载延迟 (2-5s) | 中 | 低 | Lazy-loaded Client Component; 页面首屏立即渲染, 故事异步加载; Loading 态有明确提示 |
| API 成本累积 | 低 | 低 | 70 个唯一 cache key; 1h 缓存意味着最坏情况 ~70 次/天; max_tokens=800 控制成本 |
| 故事质量因阶段而异 | 中 | 中 | 里程碑阶段通常产出更好; "换一个故事"允许重试; 属差异丰富的阶段更出彩 |
| 中文模型质量 | 未知 | 高 | 现有 3 个 AI 功能已成功使用中文同一模型; 同配置 |

### 3.7 未来演进 (v1.1+)

| 增强 | 描述 | 复杂度 |
|------|------|--------|
| 持久化存储 | 故事首次生成后写入 `life_stages.ai_story` JSONB 列, 后续零成本读取 | 低 |
| 流式输出 | 使用 Vercel AI SDK `streamText()` 逐 token 输出, 打字机效果 | 中 |
| 多版本轮播 | 预生成 3 个版本, 用户可在其间切换 | 低 |
| 音频朗读 | TTS 将故事转为语音, 配合背景音效 | 高 |
| 社交分享 | 生成故事卡片图片 (含文字+阶段图标), 一键分享 | 中 |
| 多语言 | 英文/日文版故事 (根据用户偏好) | 低 |

---

## 4. 放置位置决策

### 4.1 当前页面关系

```
物种详情页 /species/123  (如: 日本弓背蚁)
    │
    ├── 标本图像画廊
    ├── AI 插图展示 (SpeciesAIGallery)
    ├── AI 插图生成 (ImageGenerator)     ← 已有 AI 组件 ×2
    ├── 基本信息
    ├── 形态特征
    ├── 饲养信息
    ├── 分布与生态
    └── [查看生活史] CTA                 ← 链接到 /lifecycle?genus=Camponotus
            │
            ▼
生活史总览 /lifecycle?genus=Camponotus
    │
    ├── 时间线 (10个阶段节点)
    └── 阶段详情 /lifecycle/egg?genus=Camponotus
            │
            ├── 定义 / 外显特征 / 行为 / 注意事项 / ...
            └── (故事可放这里)
```

### 4.2 三个候选位置对比

| 维度 | A: 生活史详情页 `/lifecycle/[stage]` | B: 物种详情页 `/species/[id]` | C: 两边都放 |
|------|------|------|------|
| **数据粒度** | 属级别（"弓背蚁属的卵期"） | 可结合物种名（"日本弓背蚁的卵期"） | 物种页轻量 + 生活史页完整 |
| **用户场景** | 主动来学知识的用户 | 浏览物种时顺带看到 | 兼顾两种场景 |
| **页面流量** | 低（独立入口） | **高**（资料库主页面） | — |
| **已有 AI 组件** | 无 | AI Gallery + ImageGenerator（可形成 AI 三件套） | — |
| **交互设计复杂度** | 低（当前阶段确定） | 中（需设计多阶段切换或精选展示） | 高 |
| **故事角度** | 通用叙事 | 可更具体、更有针对性 | 分层叙事 |

### 4.3 各方案详细说明

#### 方案 A：放在生活史详情页（原计划）

在 `/lifecycle/[stage]/page.tsx` 的 Tips 区块之后、CTA banner 之前嵌入 `<LifecycleStory>` 组件。

- 故事作为**阶段详情的增强内容**
- 用户从物种页点"查看生活史"过来后能看到
- 上下文自然 — 用户正在看这个阶段的数据，故事直接呼应

#### 方案 B：放在物种详情页

在 `/species/[id]/page.tsx` 的"分布与生态"区块之后、"查看生活史"CTA 之前嵌入。

- 和已有的 `SpeciesAIGallery` + `ImageGenerator` 并列，形成 **AI 增强三件套**
- 物种页是流量核心，曝光量大
- 可传入 `nameCn` / `nameLat` 让故事更具体
- **需解决**: 一个物种展示哪个阶段的故事？方案:
  - 只展示 3 个里程碑阶段（婚飞/首批工蚁/成熟群体）
  - 或加一个阶段选择器 Tab
  - 或默认展示"卵期→蛹期→羽化"的核心发育链

#### 方案 C：两边都放（推荐）

- **物种页**: 轻量版 — 展示 1-2 个关键阶段的故事卡片，带 [查看完整生活史 →] 链接
- **生活史页**: 完整版 — 每个阶段详情都有独立的故事面板（原方案不变）

### 4.4 待定事项

> **需要产品决策后确定最终方案，当前文档以方案 C（两边都放）为基准继续设计，
> 但 MVP 可先实现生活史页版本（方案 A），后续扩展到物种页。**

---

## 5. 生成策略决策

### 5.1 三种生成时机策略

#### 策略 A：用户点击时实时生成（On-Demand）

```
用户访问页面 → 看到 [📖 AI 叙事] 按钮（收起态）
    ↓ 点击展开
POST /api/lifecycle/story → Claude API 调用
Loading 2-5 秒 → 展示故事内容
    ↓
写入内存缓存 (TTL=1h) → 同阶段同属的下一位访客秒开
```

| 优点 | 缺点 |
|------|------|
| 零预生成成本，没人点就不花钱 | **第一个访客要等 2-5 秒**（API 延迟） |
| 每次可"换一个"获得不同版本（多样性/新鲜感） | Claude 偶尔抽风时质量不稳定 |
| 属切换自动重新生成（Camponotus ≠ Formica） | API 故障时完全不可用 |
| 和现有 ImageGenerator 交互模式一致 | — |

**适用场景:** 流量中等、用户对 2-3 秒等待可接受、追求内容新鲜感

#### 策略 B：构建时 / 手动预生成存入数据库（Pre-generated）

```
开发者运行脚本 scripts/generate-lifecycle-stories.mjs
    ↓ 为 10 阶段 × 7 属 = 70 个组合各生成 1 个故事
    ↓ 审核质量后
写入 life_stages 表新字段 (如 ai_story JSONB 列)
    ↓
用户访问页面 → Server Component 直接从 DB 读 → 秒开，零等待
```

DB Schema 变更:

```sql
-- supabase/migrations/006_add_ai_story_to_life_stages.sql
ALTER TABLE life_stages ADD COLUMN IF NOT EXISTS ai_story JSONB;
COMMENT ON COLUMN life_stages.ai_story IS 'AI 生成的阶段叙事 { title, narrative, funFact }';
```

| 优点 | 缺点 |
|------|------|
| **用户体验最好** — 打开即看，零延迟 | 内容固定，每次看都一样 |
| 成本可控且可审计（一次性 ~$0.5-1） | 新增属/修改数据后需重新跑脚本 |
| 质量可控 — 生成后人工审核再上线 | 失去"每次不同"的新鲜感 |
| 不依赖 API 在线状态 | 70 个组合审核工作量大 |
| Server Component 可直接渲染（无需 Client Component） | 属差异故事需要多行存储或子表 |

**适用场景:** 追求首屏性能、内容质量要求高、运营团队可参与审核

#### 策略 C：混合模式（Hybrid — Pre-gen + On-Demand）

```
首次: 预生成 1 个默认版本存入 DB (ai_story JSONB 列)
    ↓
用户访问页面 → 从 DB 读默认故事 → 秒开展示
    ↓
用户点击 [换一个故事] → 实时调用 AI 生成新版本
    ↓ 可选: 质量好的新版本追加写入 DB（丰富故事库）
    ↓
用户点击 [AI 生成新故事] → 同上
```

| 优点 | 缺点 |
|------|------|
| 兼顾首屏体验（有默认内容保底） | 实现最复杂 |
| 保留互动新鲜感（可实时刷新） | 需要 DB schema 变更 |
| 预生成版本作为 quality baseline | 需要两套读取路径（DB 优先 / API fallback） |
| 后台逐步积累多版本，未来可做轮播 | — |

**适用场景:** 成熟产品、两个诉求都要兼顾

### 5.2 策略选型决策矩阵

| 因素 | 策略 A (实时) | 策略 B (预生成) | 策略 C (混合) |
|------|-------------|---------------|-------------|
| **开发速度** | 快（纯应用层，无 DB 变更） | 中（需 migration + seed 脚本） | 慢（两者兼有） |
| **首屏体验** | 需等待 2-5s（首次） | 即时 | 即时 |
| **API 月成本** | ~$0.5-1（按需） | ~$0.5-1（一次性） | ~$1-2（基础+补充） |
| **内容新鲜度** | 高（每次可不同） | 低（固定） | 高 |
| **离线可用性** | 不可用 | 可用 | 降级到预生成版可用 |
| **质量可控性** | 低（依赖 prompt 稳定性） | 高（人工审核） | 中（默认版审核 + 实时版随机） |
| **运维成本** | 无 | 需维护 seed 脚本 | 两者都要维护 |
| **与现有模式一致性** | 高（≈ImageGenerator） | 低（新模式） | 中 |
| **7属×10阶段=70组合** | 天然适合（按需生成） | 全量预生成工作量大 | 默认只预生成基线属 |

### 5.3 当前推荐：策略 A（On-Demand 实时生成）

**理由:**

1. **和现有 AI 组件交互一致** — `ImageGenerator` 就是点击→等待→出结果的模式，用户已习惯
2. **开发最简** — 不需要 migration、不需要 seed 脚本、不需要管理 DB 存储，4 个文件搞定
3. **70 组合全预生成不现实** — 10 阶段 × 7 属 = 70 个故事，审核成本高且质量参差
4. **缓存兜底** — 内存缓存 1h TTL 后，同阶段同属的后续访客秒开
5. **生活史页流量有限** — 不是首页级流量，2-3s 等待可接受
6. **可随时升级到策略 C** — 先上线验证需求，后续加 DB 持久化无障碍

**升级路径（如果将来需要）:**

```
v1.0 (MVP):  策略 A — 纯实时 + 内存缓存
    ↓ 验证需求后
v1.1:       策略 C 第一步 — 加 ai_story JSONB 列, 预生成默认版
             Server Component 优先读 DB, DB 为空时 fallback 到 API 实时生成
    ↓
v1.2:       策略 C 完善 — "换一个"生成的优质版本可选写入 DB
             后台积累故事库, 未来做版本轮播
```

---

## 6. 方向二：AI 阶段定位问答

### 核心思路
详情页底部 CTA 升级为轻量 AI 问答: 用户描述蚁群状态 → AI 判断所处阶段 + 置信度 + 建议 + 风险提示。

### 关键技术点
- **100% 复用 `extractStage()` 阶段推断逻辑** (需从 private 改为 export)
- **复用 `summarizeLog()` 的整套解析模式** (extractSection/extractList)
- 新增 `askStage()` 函数到 `ai.ts`
- 新 API: `POST /api/lifecycle/ask-stage` (无需登录, IP 限流 5/min)
- 新组件: `StageAskAI` (~150 行), 替换详情页 CTA 区域

### 输入/输出

```
输入: { description: "我有10只工蚁,看到白色茧状物", currentViewingStage?, genus? }
输出: {
  inferredStage: "pupa",
  stageName: "蛹期",
  confidence: "high" | "medium" | "low",
  reasoning: "根据'白色茧状物'判断...",
  tips: ["保持25-28°C", "避免频繁打扰"],
  riskAlert?: "...",
  suggestedAction?: "查看蛹期详细指南"
}
```

### 工作量: 4 步顺序开发, 每步 30-60 分钟

---

## 7. 方向三：AI 阶段插图生成

### 核心思路
复用 image-gen.ts 管道, 为 10 个生命周期阶段生成场景配图。

### 必要的 DB 变更

```sql
ALTER TABLE generated_images
  ADD COLUMN IF NOT EXISTS lifecycle_stage TEXT
  REFERENCES life_stages(stage_key) ON DELETE SET NULL;

CREATE INDEX idx_generated_images_lifecycle_stage
  ON generated_images(lifecycle_stage) WHERE lifecycle_stage IS NOT NULL;
```

### 10 阶段 Prompt 模板 (摘要)

| 阶段 | 场景 | 推荐比例 |
|------|------|---------|
| 婚飞 | 数百有翅蚁飞入金色傍晚天空, 雨后交配 | 16:9 |
| 建巢 | 新蚁后封入地下室, 撕翅, 几粒卵 | 16:9 |
| 卵期 | 微距乳白卵簇(~1mm), 蚁后触角轻抚 | 1:1 |
| 幼虫期 | 白色蠕虫幼虫, 工蚁喂养, 不同大小 | 1:1 |
| 蛹期 | 丝茧中的蛹, 排列整齐, 一只正在羽化 | 1:1 |
| 首批工蚁 | 苍白新生工蚁探索, 蚁后被喂养 | 16:9 |
| 初级扩群 | 10-50工蚁, 简单巢, 到处活动 | 16:9 |
| 稳定增长 | 50-200+工蚁, 多态, 复杂巢, 觅食路径 | 16:9 |
| 成熟群体 | 数千工蚁, 有翅繁殖蚁, 宏大场面 | 16:9 |
| 冬眠 | 工蚁聚团保暖, 冷蓝色调, 巢口有霜 | 16:9 |

### 策略: On-Demand + 缓存 (避免预生成 280 张图的成本)

### 文件变更: 2 新 4 改 (含 1 个 migration SQL)

---

## 8. 方向四：AI 属间对比问答

### 核心价值
利用 **60 条 `stage_species_diffs.special_notes`** 数据 — 这是整个项目中最未被充分利用的数据资产。

### 形式
浮动 FAB 按钮 (右下角) → 展开聊天面板 → 用户自由提问 → AI 基于注入的属差异数据回答

### Context 注入
System Prompt 注入结构化数据块:
- 17 属中文名映射表
- 相关阶段 definition + duration (每阶段 1 行)
- 相关属-阶段对的 duration + temp_note + **special_notes** (全文)
- Context 大小: 1500-3000 tokens

### 成本控制: max_tokens=600, 历史 6 条, 最多 4 属/次, ~$0.01-0.02/查询

### 快捷问题示例
- "弓背蚁 vs 大头蚁婚飞区别?"
- "哪些属不需要冬眠?"
- "织叶蚁建巢有什么特殊之处?"

### 工作量: 3 新 1 改, 最复杂方向

---

## 9. 方向五：时间线预测

- 需要**登录态 + colonies 数据联动**
- 查询用户 current_stage → 时间线上标注进度箭头
- 结合 duration_base 做时间估算
- **依赖方向二先积累用户数据, 适合 v2**

---

## 10. 方向六：AI 冷知识彩蛋

### 存储方案: 新表 `stage_fun_facts`

```sql
CREATE TABLE stage_fun_facts (
  id SERIAL PRIMARY KEY,
  stage_key VARCHAR(50) REFERENCES life_stages(stage_key),
  fact_text TEXT NOT NULL,
  fact_category VARCHAR(30) DEFAULT 'fun',  -- biology/behavior/evolution/fun/care_tip/surprising
  source VARCHAR(20) DEFAULT 'pre_generated',  -- pre_generated | ai_generated | curated
  is_featured BOOLEAN DEFAULT FALSE,
  view_count INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

### 混合策略: 预生成脚本 (~$0.10 一次性) + AI 实时补充

### UI: 发光蛋形触发器 (36px, pulse 动画) → 展开玻璃态卡片

### 工作量: 3 新 1 改 + 1 migration

---

## 11. 综合对比与路线图

### 优先级矩阵

| 维度 | 故事 | 定位问答 | 插图 | 对比问答 | 冷知识 |
|------|------|---------|------|---------|--------|
| 开发复杂度 | 低 | 低 | 中 | 中 | 低 |
| 趣味效果 | 高 | 高 | 高 | 高 | 中 |
| 代码复用率 | 高 | **极高** | 高 | 中 | 中 |
| 新文件数 | 3新1改 | 3新1改 | 2新4改 | 3新1改 | 3新1改+迁移 |
| 月API成本 | ~$0.5-1 | ~$1-3 | ~$2-5 | ~$3-10 | ~$0.1 |
| 独占性/差异化 | 中 | 高 | 高 | **极高** | 低 |
| 社交传播潜力 | 中 | 中 | **极高** | 中 | 高 |

### 推荐实施路线

```
Phase 1 (1-2 天) — ★ 当前聚焦
├── 方向一: AI 故事讲述器  ← 详细方案见第 3 章
│   放置位置: MVP 先做生活史详情页 (方案 A), 后续扩展到物种页 (方案 C)
│   生成策略: 策略 A (On-Demand 实时生成), 见第 5 章
│   理由: 开发快、提升内容品质、为后续方向铺路
│
├── (可选) 方向六: AI 冷知识彩蛋
│   理由: 开发快、增加页面活力、独立交付物
│
Phase 2 (2-3 天)
├── 方向二: AI 阶段定位问答
│   理由: 复用度最高、用户参与感最强
│
├── 方向三: 阶段插图生成
│   理由: 视觉差异化最大、社交传播潜力极高
│
Phase 3 (3-4 天)
└── 方向四: AI 属间对比问答
    理由: 杀手锏功能、利用独有数据资产、技术含量最高
```

### 已决策事项

| 决策项 | 当前结论 | 见章节 |
|--------|---------|--------|
| **优先方向** | 方向一：AI 故事讲述器 | 第 3 章 |
| **放置位置** | MVP: 生活史详情页 (方案 A); 未来: 两边都放 (方案 C) | 第 4 章 |
| **生成策略** | MVP: On-Demand 实时生成 (策略 A); 可升级到混合模式 (策略 C) | 第 5 章 |
| **缓存策略** | In-memory Map, TTL=1h, key=`{stageKey}:{genus}` | §3.4.2 |
| **UI 色系** | 紫色系 (purple-500), 与现有 neutral/blue/red/accent 区分 | §3.4.3 |

### 待定事项

> - [ ] 最终确认是否需要放到物种详情页（影响 Phase 1 的组件复用策略）
> - [ ] 是否在 v1.0 同步实现方向六（冷知识彩蛋）作为配套功能
