# 蚁域 (Ant Domain)

> 集蚂蚁资料库、生活史科普与个人蚁群记录于一体的 AI 原生平台

## 项目简介

蚁域面向蚂蚁爱好者、养殖用户与泛自然科普用户，提供三大核心模块：

- **资料库** — 系统化的蚂蚁物种知识库（覆盖蚁亚科 Formicinae + 切叶蚁亚科 Myrmicinae），含 AI 物种插图生成
- **生活史** — 可视化呈现蚂蚁从婚飞到群体成熟的完整生命历程（以弓背蚁属为标杆）
- **我的蚁群** — 记录、管理个人蚁群成长，AI 多模态分析（文字 + 图片视觉分析）
- **图库** — AI 生成的物种专业插图画廊

## 技术栈

| 层面 | 技术选型 |
|------|---------|
| 框架 | Next.js 16 (App Router) |
| 语言 | TypeScript 5 |
| 样式 | Tailwind CSS v4 |
| 数据库 | PostgreSQL (Supabase) |
| ORM | Prisma 7 |
| 认证 | Supabase Auth（Cookie）+ 自研 API Key 双认证 |
| AI | Anthropic SDK（多模态 glm-5v-turbo，支持图片视觉分析）|
| 图片生成 | MiniMax API → Supabase Storage |
| 测试 | Vitest 4 + Testing Library |

## 快速开始

### 环境要求

- Node.js >= 18
- npm / pnpm
- Supabase 项目（已链接远程）

### 安装与运行

```bash
# 安装依赖
npm install

# 复制环境变量模板
cp .env.example .env
# 编辑 .env，填入 Supabase URL / Service Role Key / Anthropic API Key 等

# 启动开发服务器
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看效果。

### 数据库初始化

项目使用 Supabase CLI 管理数据库（非 Prisma Migrate）：

```bash
# 执行初始化 SQL（建表、RLS、种子数据）
npx supabase db query --linked -f supabase/init.sql

# 执行扩展种子数据
npx supabase db query --linked -f supabase/seed-formicinae-extension.sql
npx supabase db query --linked -f supabase/seed-myrmicinae.sql
```

### 运行测试

```bash
# 监听模式
npm test

# 单次运行
npm run test:run
```

## 项目结构

```
src/
├── app/                        # Next.js App Router 页面
│   ├── (auth)/                 # 认证路由组（登录/注册）
│   ├── admin/                  # 管理后台（图片管理）
│   ├── api/                    # RESTful API 路由
│   │   ├── colonies/[id]/      # 蚁群 & 日志 CRUD
│   │   ├── upload-image        # 观测图片上传
│   │   ├── delete-image        # 观测图片删除
│   │   ├── generate-image      # AI 物种插图生成
│   │   ├── gallery/            # 图库 API
│   │   ├── keys/               # API 密钥管理
│   │   └── auth/               # 认证 API
│   ├── colonies/               # 我的蚁群模块
│   │   ├── [id]/log/new/       # 新建观测日志（含图片上传 + AI 视觉分析）
│   │   └── components/         # 蚁群页面专用组件
│   ├── gallery/                # AI 图库页面
│   ├── lifecycle/              # 生活史模块（10 阶段时间轴）
│   ├── settings/                # 设置页（API Key 管理）
│   ├── species/                # 资料库模块
│   └── ...
├── components/                 # 共享组件
│   ├── image-generator.tsx     # AI 物种插图生成器
│   ├── image-uploader.tsx      # 观测日志图片上传组件
│   ├── log-image-gallery.tsx   # 日志图片画廊（灯箱预览）
│   ├── species-ai-gallery.tsx  # 物种 AI 图库展示
│   ├── specimen-image-gallery.tsx # 标本图片画廊
│   └── layout/                 # 布局组件（Header, AuthButton）
├── lib/                        # 工具函数与配置
│   ├── ai.ts                   # AI 服务（多模态摘要/周报/建议）
│   ├── image-gen.ts            # AI 图片生成逻辑（MiniMax）
│   ├── image-upload.ts         # 图片上传工具（验证/路径/Storage）
│   ├── apiKey.ts               # API 密钥管理
│   ├── auth-api.ts             # API 认证中间件
│   ├── labels.ts               # 阶段/异常标签映射
│   └── db.ts                   # Supabase 服务端客户端
├── test/                       # Vitest 单元测试
│   ├── colony-api.test.ts      # 蚁群 API 测试
│   ├── api-key.test.ts         # API 密钥测试
│   └── image-upload.test.ts    # 图片上传验证测试
├── middleware.ts               # 中间件（认证守卫）
supabase/
├── init.sql                    # 数据库初始化（表/RLS/策略/种子）
├── seed-*.sql                  # 各扩展种子数据
└── migrations/                 # 数据库迁移
public/
└── SKILLS.md                   # 外部 API 接入文档（OpenClaw 等）
```

## 核心页面路由

| 路径 | 说明 |
|------|------|
| `/` | 首页（阵列总览） |
| `/species` | 物种资料库列表 |
| `/species/[id]` | 物种详情（含 AI 插图生成） |
| `/gallery` | AI 物种插图图库 |
| `/lifecycle` | 生活史总览（10 阶段时间轴） |
| `/lifecycle/[stage]` | 阶段详情 |
| `/colonies` | 我的蚁群列表 |
| `/colonies/new` | 创建新蚁群 |
| `/colonies/[id]` | 蚁群详情（AI 分析中枢 + 观测日志池 + 影像归档） |
| `/colonies/[id]/log/new` | 新建观测日志（文字 + 图片 + AI 多模态分析） |
| `/settings` | 设置（API Key 管理） |
| `/admin` | 管理后台（图片管理） |
| `/login` | 登录 |
| `/register` | 注册 |

## API 接口

> 完整文档见 [public/SKILLS.md](public/SKILLS.md)，支持 `x-api-key` Header 认证。

| 方法 | 路径 | 说明 |
|------|------|------|
| GET | `/api/colonies` | 获取蚁群列表 |
| POST | `/api/colonies` | 创建蚁群 |
| GET | `/api/colonies/:id` | 蚁群详情 |
| DELETE | `/api/colonies/:id` | 删除蚁群 |
| GET | `/api/colonies/:id/logs` | 日志列表（含图片） |
| POST | `/api/colonies/:id/logs` | 创建日志（支持 images 字段） |
| POST | `/api/upload-image` | 上传观测图片（multipart） |
| DELETE | `/api/delete-image` | 删除观测图片 |
| POST | `/api/generate-image` | AI 生成物种插图 |
| GET | `/api/gallery` | 图库列表 |
| GET/POST | `/api/keys` | API 密钥管理 |
| GET | `/api/species` | 物种列表（公开） |
| GET | `/api/species/:id` | 物种详情（公开） |

## AI 能力

### 多模态日志分析

观测日志支持附带图片，AI 模型（glm-5v-turbo 多模态）会同时分析文字和图片：

1. 用户在新建日志时上传观测照片（≤6 张，jpg/png/webp）
2. 图片存储至 Supabase Storage `colony-images` 桶
3. 提交后服务端 fetch 图片转 base64，传入 AI
4. AI 输出包含**视觉观察**的增强摘要（蚁群状态、幼体发育、环境条件）

### 物种插图生成

基于 MiniMax API 的 AI 图片生成系统：
- 支持视角选择（背视图/侧视图/正面图/生态环境）
- 支持风格切换（科学插图/微距摄影/手绘水彩/写实数字画）
- 自动存储到 Supabase 并持久化到数据库

## 开发命令

```bash
npm run dev          # 启动开发服务器
npm run build        # 生产构建
npm run start        # 启动生产服务器
npm run lint         # ESLint 代码检查
npm test             # Vitest 测试（监听模式）
npm run test:run     # Vitest 测试（单次运行）
```

## 数据库设计概要

### 核心表

| 表名 | 用途 | 关键字段 |
|------|------|----------|
| `species` | 物种资料库 | name_cn, name_lat, genus, difficulty |
| `colonies` | 用户蚁群 | name, species_id, current_stage, worker_range |
| `colony_logs` | 观测日志 | title, content, stage, **images**(JSONB), ai_summary, event_type |
| `generated_images` | AI 生成插图 | species_id, url, prompt, model, view_type, style |
| `api_keys` | 外部 API 密钥 | key_hash, user_id, name, permissions |

### Storage 桶

| 桶名 | 用途 | 访问策略 |
|------|------|----------|
| `colony-images` | 观测日志图片 | 公开读，认证用户写/删 |
| `species-images` | 物种插图 | 公开读，管理员写 |

## 部署

项目部署于 **Vercel**，使用 Vercel CLI 管理：

```bash
# 本地预览
npx vercel dev

# 部署 Preview
npx vercel

# 部署 Production
npx vercel --prod

# 拉取环境变量
npx vercel env pull .env.local
```

已链接项目：`ant_domain` / team `fRrHbb0yD6hQSJuaGPmZV2FK`

## 许可证

MIT
