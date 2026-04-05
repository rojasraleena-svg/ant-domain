## 数据库操作规范

- **所有数据库更新和修改必须使用 Supabase CLI 完成**，禁止直接连接数据库或使用其他工具
- 执行 SQL：`npx supabase db query --linked -f "path/to/file.sql"` 或内联 SQL：`npx supabase db query --linked "SQL语句"`
- 项目已链接远程 Supabase 项目（Ant / East US），使用 `--linked` 标志操作远程库
- 本地 Supabase 默认不启动，不要尝试 `--local`
- 种子数据文件放在 `supabase/` 目录下，命名规则：`seed-{用途}.sql`
- DDL 变更（建表/改表）应通过 migration 文件管理；DML（种子/差异数据）通过 seed 文件执行

### 常用命令速查

| 操作 | 命令 |
|------|------|
| 执行 SQL 文件 | `npx supabase db query --linked -f "file.sql"` |
| 执行单条 SQL | `npx supabase db query --linked "SELECT ..."` |
| 查看表结构 | `npx supabase db query --linked "\d table_name"` |
| 验证数据 | `npx supabase db query --linked "SELECT count(*) FROM table"` |

## 部署规范（Vercel）

- **所有部署操作必须使用 Vercel CLI 完成**，禁止通过网页 Dashboard 操作
- 项目已链接 Vercel 项目（ant_domain / team_fRrHbb0yD6hQSJuaGPmZV2FK）
- 部署前确保：类型检查通过、lint 通过、数据库变更已执行

### 常用命令速查

| 操作 | 命令 |
|------|------|
| 本地预览 | `npx vercel dev` |
| 部署到 Preview | `npx vercel` |
| 部署到 Production | `npx vercel --prod` |
| 查看部署日志 | `npx vercel logs [deployment_url]` |
| 查看环境变量 | `npx vercel env ls` |
| 拉取环境变量 | `npx vercel env pull .env.local` |
| 查看最近部署 | `npx vercel ls` |
