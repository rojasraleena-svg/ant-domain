# 蚁域 (Ant Domain)

> 集蚂蚁资料库、生活史科普与个人蚁群记录于一体的 AI 原生平台

## 项目简介

蚁域面向蚂蚁爱好者、养殖用户与泛自然科普用户，提供三大核心模块：

- **资料库** — 系统化的蚂蚁物种知识库与饲养信息（MVP 聚焦蚁亚科 Formicinae）
- **生活史** — 可视化呈现蚂蚁从婚飞到群体成熟的完整生命历程（以弓背蚁属为标杆）
- **我的蚁群** — 记录、管理个人蚁群成长，AI 生成分析与提醒

## 技术栈

| 层面 | 技术选型 |
|------|---------|
| 框架 | Next.js 16 (App Router) |
| 语言 | TypeScript |
| 样式 | Tailwind CSS v4 |
| 数据库 | PostgreSQL (Supabase) |
| ORM | Prisma |
| 认证 | Supabase Auth |
| AI | Claude API / OpenAI API |

## 快速开始

### 环境要求

- Node.js >= 18
- npm / yarn / pnpm

### 安装与运行

```bash
# 安装依赖
npm install

# 复制环境变量模板
cp .env.example .env
# 编辑 .env，填入 Supabase 和数据库连接信息

# 启动开发服务器
npm run dev
```

打开 [http://localhost:3000](http://localhost:3000) 查看效果。

### 数据库初始化

```bash
# 推送 Prisma Schema 到数据库
npx prisma db push

# （可选）生成种子数据
npx prisma db seed
```

## 项目结构

```
src/
├── app/                # Next.js App Router 页面
│   ├── (auth)/         # 认证相关页面（登录/注册）
│   ├── colonies/       # 我的蚁群模块
│   ├── lifecycle/      # 生活史模块
│   ├── species/        # 资料库模块
│   └── ...
├── components/         # 共享组件
│   └── layout/         # 布局组件
├── lib/                # 工具函数与配置
│   └── supabase/       # Supabase 客户端封装
├── middleware.ts        # 中间件（认证守卫等）
prisma/
├── schema.prisma       # 数据库模型定义
supabase/
├── init.sql            # 数据库初始化脚本
docs/
├── PRD-v1.0.md         # 产品需求文档
└── MVP-Scope-v1.0.md   # MVP 范围定义
```

## MVP 范围 (v1.0)

### 资料库 — 蚁亚科 (Formicinae)

覆盖弓背蚁属 (*Camponotus*)、多刺蚁属 (*Polyrhachis*) 等热门属种，包含物种详情、分类浏览、搜索筛选。

重点物种：日本弓背蚁、尼科巴弓背蚁、拟黑多刺蚁等。

### 生活史 — 弓背蚁属完整生命周期

10 个阶段时间轴：婚飞 → 建巢 → 卵 → 幼虫 → 蛹 → 首批工蚁 → 初级扩群 → 稳定增长 → 成熟群体 → 冬眠

### 我的蚁群 — 蚁群记录与管理

创建蚁群档案、撰写成长日志、自动生成时间线、AI 成长摘要与阶段判断。

## 核心页面路由

| 路径 | 说明 |
|------|------|
| `/` | 首页 |
| `/species` | 资料库 |
| `/species/[id]` | 物种详情 |
| `/lifecycle` | 生活史总览 |
| `/lifecycle/[stage]` | 阶段详情 |
| `/colonies` | 我的蚁群列表 |
| `/colonies/[id]` | 蚁群详情 |
| `/login` | 登录 |
| `/register` | 注册 |

## 开发命令

```bash
npm run dev      # 启动开发服务器
npm run build    # 生产构建
npm run start    # 启动生产服务器
npm run lint     # 代码检查
```

## 许可证

MIT
