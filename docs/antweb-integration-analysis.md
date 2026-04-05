# AntWeb 图片数据接入方案分析

> 调研日期：2026-04-06
> 目标：将 AntWeb（加州科学院）的蚂蚁标本图片接入蚁域项目，替代/补充当前质量不足的图片数据

---

## 一、AntWeb 概览

| 项目 | 数据 |
|------|------|
| 运营机构 | California Academy of Sciences |
| 网址 | https://www.antweb.org |
| GitHub | https://github.com/calacademy-research/antweb |
| 标本总量 | ~500,000+ |
| 图片总量 | ~200,000+ 张（~1.6TB） |
| 物种覆盖 | ~50,000+ 分类单元 |
| 技术栈 | Java/Struts + Python/Flask + MySQL + Solr + Docker + Caddy |

**定位**：全球最大的蚂蚁标本图像数据库，学术级标本摄影，质量远超 GBIF/iNaturalist。

---

## 二、AntWeb 提供的数据获取方案

根据 AntWeb GitHub 仓库文档（`docs/API.md`、`docs/DEVELOPMENT.md`），官方提供 **四层** 数据访问方式：

### 方案 1：公开 API v3（推荐首选）

**端点**：`https://api.antweb.org/v3/`

**核心接口**：

| 接口路径 | 说明 | 关键参数 |
|----------|------|----------|
| `GET /specimens` | 标本列表查询 | `taxon`, `limit`, `offset`, `format=csv` |
| `GET /specimens/{code}` | 单个标本详情 | code = 如 `CASENT0106394` |
| `GET /images` | 图片元数据列表 | `specimen_code`, `shot_type` |
| `GET /taxa` | 分类单元搜索 | `name`, `rank`, `format=csv` |
| `GET /taxa/{name}` | 单个分类单元详情 | name = 拉丁名 |
| `GET /geolocales/{id}/taxa` | 地理区域物种列表 | id = 国家代码 |

**特性**：
- 无需认证即可读取
- 全局 CORS（`Access-Control-Allow-Origin: *`）
- 支持 JSON 和 CSV 两种格式输出
- **速率限制**：1000 次/小时/IP，突发 10 次/秒，超出返回 HTTP 429 + `Retry-After`

**标本详情响应示例关键字段**：

```json
{
  "specimen": {
    "code": "CASENT0106394",
    "taxon_name": "Camponotus pennsylvanicus",
    "subfamily": "Formicinae",
    "genus": "Camponotus",
    "species": "pennsylvanicus",
    "country": "United States",
    "stateProvince": "California",
    "locality": "Marin Co., Point Reyes National Seashore",
    "collector": "B.L. Fisher",
    "determiner": "B.L. Fisher",
    "images": [
      {
        "shot_type": "d",
        "image_url": "https://www.antweb.org/images/casent0106394/casent0106394_d_1_high.jpg"
      },
      {
        "shot_type": "p",
        "image_url": "https://www.antweb.org/images/casent0106394/casent0106394_p_1_high.jpg"
      }
    ]
  }
}
```

### 方案 2：直接图片 URL

AntWeb 的图片 URL 遵循固定模式：

```
https://www.antweb.org/images/{code_lower}/{code_lower}_{shot_type}_{num}_{res}.{ext}
```

| 参数 | 含义 | 可选值 |
|------|------|--------|
| `{code_lower}` | 标本编号小写 | 如 `casent0106394` |
| `{shot_type}` | 拍摄角度 | `h`=头部, `d`=背视图, `p`=侧面, `l`=标签 |
| `{num}` | 序号 | 通常为 `1` |
| `{res}` | 分辨率 | `low`(480px), `med`(800px), `high`(1200px), `.tif`(原始) |
| `{ext}` | 格式 | `.jpg` 或 `.tif` |

**示例**：
- 高清背视图：`https://www.antweb.org/images/casent0106394/casent0106394_d_1_high.jpg`
- 缩略图：`https://www.antweb.org/images/casent0106394/casent0106394_d_1_low.jpg`

### 方案 3：rclone 批量同步（需 DigitalOcean 凭据）

AntWeb 将全部图片存储在 DigitalOcean Spaces 上。GitHub 文档提供了 rclone 配置：

```ini
[antweb]
type = s3
provider = DigitalOcean
access_key_id = <your_key>
secret_access_key = <your_secret>
endpoint = sfo3.digitaloceanspaces.com
```

- Web 图片子集约 ~10GB
- 完整图片集约 ~1.6TB
- **限制**：需要内部凭据，外部用户无法使用

### 方案 4：数据库快照（需 SSH 访问）

通过 scp 从服务器拉取 MySQL dump：
```bash
scp user@antweb-server:/path/to/dump.sql .
```
**限制**：同样需要服务器访问权限，仅限核心贡献者。

---

## 三、关键障碍：Cloudflare 防护

### 测试结果

| 测试目标 | 方法 | 结果 |
|----------|------|------|
| `api.antweb.org/v3/specimens/CASENT0106394` | 服务端 fetch (Node.js) | **HTTP 403** (`Cf-Mitigated: challenge`) |
| `api.antweb.org/v3/taxa/Camponotus%20pennsylvanicus` | 服务端 fetch (Node.js) | **HTTP 403** |
| `www.antweb.org/images/.../..._d_1_high.jpg` | 服务端 fetch (Node.js) | **HTTP 403** |
| 同上 | 浏览器 fetch (CORS) | **正常 200** ✅ |
| 同上 | curl（命令行） | **HTTP 403** |

### 结论

**Cloudflare JS Challenge 拦截所有非浏览器请求**。这意味着：
- ❌ Next.js API Route / Server Action 无法直接调用
- ❌ Node.js 脚本无法直接调用
- ❌ curl/wget 无法直接调用
- ✅ 浏览器端 fetch 可以正常工作（通过 CORS）
- ✅ Playwright/Puppeteer 等无头浏览器可以绕过

---

## 四、与现有项目架构的兼容性分析

### 4.1 数据库表映射

现有 `specimen_images` 表结构（`supabase/migrations/003_create_specimen_images.sql`）：

| 字段 | 类型 | AntWeb 对应字段 | 映射说明 |
|------|------|-----------------|----------|
| `species_id` | INTEGER → species(id) | `specimen.taxon_name` | 需通过拉丁名匹配 species 表 |
| `url` | TEXT | `image.image_url` | 直接使用 high 分辨率 URL |
| `thumbnail_url` | TEXT | 同上 low 分辨率版本 | 用 `_low.jpg` 替换后缀生成 |
| `view_type` | TEXT DEFAULT 'dorsal' | `image.shot_type` | 见下方映射表 |
| `is_primary` | BOOLEAN | — | d(背视图) 设为主图 |
| `source` | TEXT DEFAULT 'gbif' | `'antweb'` | 新来源标识 |
| `source_id` | TEXT | `specimen.code` | 存储如 `CASENT0106394` |
| `photographer` | TEXT | `specimen.collector` 或摄影师信息 | AntWeb 有 photographer 字段 |
| `license` | TEXT | 各记录不同 | Creative Commons 系列 |
| `dataset_name` | TEXT | `'AntWeb - CalAcademy'` | 固定值 |
| `country` | TEXT | `specimen.country` | 直接映射 |
| `sort_order` | INTEGER | — | 按视角优先级排序 |

**Shot Type 映射**：

| AntWeb shot_type | 含义 | 本项目 view_type |
|------------------|------|-------------------|
| `d` | Dorsal（背视图） | `dorsal` ⭐ 主图候选 |
| `p` | Profile（侧面） | `lateral` |
| `h` | Head（头部特写） | `frontal` |
| `l` | Label（标签照） | 不入库（或标记 `other`） |

> 注：AntWeb 没有 habitat（生境照）类型，该类型仍由 MiniMax AI 生成补充。

### 4.2 前端组件兼容性

`src/components/specimen-image-gallery.tsx` 已完全兼容：

- ✅ `SpecimenImageData` 接口字段一一对应
- ✅ 视角标签显示（背视图/侧视图/正面图）
- ✅ 摄影师 + 国家信息叠加层
- ✅ 许可证链接展示
- ✅ 缩略图切换 + 灯箱预览
- **无需任何前端修改**

### 4.3 数据访问层兼容性

`src/lib/public-data.ts` 已完全兼容：

- ✅ `getSpecimenImages(speciesId)` 按 `is_primary DESC, sort_order ASC` 排序
- ✅ `getPrimarySpecimenImage(speciesId)` 取单张主图
- **无需修改**

---

## 五、集成方案对比

### 方案 A：浏览器端实时加载

```
用户浏览物种页 → 前端 fetch(AntWeb API) → 渲染图片
```

| 维度 | 评价 |
|------|------|
| 实现难度 | 低（前端直接调 API） |
| 数据持久性 | ❌ 无（依赖 AntWeb 在线） |
| 加载速度 | ❌ 慢（每次都要跨域请求 + Cloudflare 延迟） |
| 离线可用 | ❌ 不可用 |
| 可控性 | ❌ 受限于 AntWeb 速率限制和可用性 |
| 综合评分 | ⭐⭐ 不推荐 |

### 方案 B：预取 + Supabase 存储（强烈推荐）

```
本地脚本(Playwright) → 批量抓取 AntWeb → 下载图片 → 上传 Supabase Storage → 写入 specimen_images 表
```

| 维度 | 评价 |
|------|------|
| 实现难度 | 中（需写预取脚本 + 数据处理管道） |
| 数据持久性 | ✅ 永久存储在自有基础设施 |
| 加载速度 | ✅ 快（Supabase CDN 直出） |
| 离线可用 | ✅ 完全可用 |
| 可控性 | ✅ 完全自主 |
| 可维护性 | ✅ 定期增量更新即可 |
| 综合评分 | ⭐⭐⭐⭐⭐ **推荐** |

### 方案 C：混合模式

```
优先查 Supabase（AntWeb 预取数据）→ 未命中时 fallback 到 MiniMax AI 生成
```

| 维度 | 评价 |
|------|------|
| 实现难度 | 中高（需整合两条数据管道） |
| 覆盖率 | ✅ 最高（AntWeb + AI 补充） |
| 数据一致性 | ⚠️ 需管理两套来源优先级 |
| 综合评分 | ⭐⭐⭐⭐ 可作为 Phase 2 |

---

## 六、推荐实施方案（方案 B 详细设计）

### 6.1 架构流程

```
┌─────────────────────────────────────────────────────────────┐
│                    预取脚本（一次性 + 定期更新）                │
│                                                             │
│  1. 从 species 表读取需要补图的物种列表                        │
│         ↓                                                    │
│  2. Playwright 浏览器打开 AntWeb API                         │
│     GET /v3/taxa/{latin_name} → 获取标本 code 列表            │
│         ↓                                                    │
│  3. 逐个获取标本详情                                         │
│     GET /v3/specimens/{code} → 获取图片 URL 列表              │
│         ↓                                                    │
│  4. 浏览器下载图片（绕过 Cloudflare）                          │
│         ↓                                                    │
│  5. 写入 Supabase                                           │
│     ├─ 图片上传到 species-images bucket                      │
│     └─ 记录写入 specimen_images 表（source='antweb'）        │
└─────────────────────────────────────────────────────────────┘
```

### 6.2 脚本技术选型

| 组件 | 选择 | 理由 |
|------|------|------|
| 浏览器自动化 | Playwright | 项目已配置 MCP Playwright；可绕过 Cloudflare |
| 数据库操作 | Supabase JS Client (`@supabase/supabase-js`) | 与项目一致 |
| 文件存储 | Supabase Storage SDK | 与项目一致 |
| 运行方式 | Node.js 脚本（`scripts/fetch-antweb.mjs`） | 独立于 Next.js 应用 |

### 6.3 数据处理规则

**主图选择逻辑**：
1. 优先选择 `shot_type=d`（背视图）作为 `is_primary=true`
2. 若无背视图，则选择 `shot_type=p`（侧视图）
3. 同一视角多张标本时，按 AntWeb 默认排序取第一张

**去重逻辑**：
- 以 `source_id`（即 AntWeb specimen code）+ `view_type` 为唯一键
- 同一物种同一视角只保留一张最佳图片
- 后续更新时 upsert 覆盖

**排序规则**（`sort_order`）：
- dorsal = 10（最优先）
- lateral = 20
- frontal = 30
- other = 99

### 6.4 错误处理与容错

| 场景 | 处理策略 |
|------|----------|
| API 返回 429（速率限制） | 等待 `Retry-After` 秒数后重试，最多 3 次 |
| 图片下载失败 | 跳过该张，记录日志，继续下一张 |
| 物种名匹配不上 | 记录到未匹配列表，人工后续处理 |
| Cloudflare Challenge 升级 | Playwright 自动等待挑战完成 |
| 网络中断 | 支持断点续传（记录已处理的 specimen code） |

### 6.5 执行计划

**Phase 1：验证性导入（首批 10-20 个常见物种）**
1. 编写基础预取脚本
2. 手动选取项目中已有且常见的物种（如 Camponotus japonicus、Polyrhachis dives 等）
3. 执行导入并验证图片质量和页面展示效果
4. 根据实际结果调整映射规则

**Phase 2：批量导入**
1. 扩展脚本支持全量物种遍历
2. 按属分批执行（避免触发速率限制）
3. 建立进度追踪和断点续传机制

**Phase 3：定期更新**
1. 设置定时任务（如每月一次）
2. 仅检查新增/更新的标本
3. 增量同步到 Supabase

---

## 七、风险与注意事项

### 7.1 法律合规

| 项目 | 说明 |
|------|------|
| 使用许可 | AntWeb 大部分图片采用 Creative Commons 协议（CC-BY / CC-BY-NC 等） |
| 商业使用 | 部分图片限制非商业用途，需逐条检查 license 字段 |
| 引用要求 | 学术引用格式：`http://www.antweb.org/specimen.do?code={code}` |
| 建议 | 页面展示时标注图片来源和许可证链接（现有组件已支持） |

### 7.2 技术风险

| 风险 | 概率 | 影响 | 缓解措施 |
|------|------|------|----------|
| Cloudflare 加强防护 | 中 | 高 | Playwright 方案相对稳定；保留已存储副本 |
| AntWeb API 变更 | 低 | 中 | 封装 API 调用层，便于适配 |
| 图片 CDN 不稳定 | 低 | 低 | 已存入 Supabase Storage，不依赖原始源 |
| 速率限制导致慢 | 高 | 低 | 分批执行 + 重试机制；非紧急任务 |

### 7.3 数据质量预期提升

| 指标 | 当前（GBIF/iNaturalist） | 接入 AntWeb 后 |
|------|--------------------------|---------------|
| 图片专业度 | 混合质量（业余拍摄居多） | 学术级标本摄影 |
| 角角完整性 | 多数仅有 1-2 张 | 通常 dorsal + profile + head 多角度 |
| 分辨率 | 不确定 | 最高 1200px（高清）/ 原始 TIFF |
| 元数据丰富度 | 基础 | 包含采集地、采集人、鉴定人等 |
| 物种覆盖率 | 较广但浅 | 深度覆盖模式物种 |

---

## 八、总结

**核心结论**：AntWeb 是当前最优的蚂蚁标本图片数据源，其 API v3 设计完善、文档清晰、数据质量极高。虽然 Cloudflare 阻止了服务端直连请求，但通过 Playwright 浏览器自动化方案可以可靠地完成数据预取，并将图片持久化到现有的 Supabase 基础设施中。

**推荐路径**：方案 B（预取 + Supabase 存储）→ 方案 C（混合模式，AI 补充未覆盖物种）

**投入产出比**：编写一次预取脚本（预计 1-2 天开发 + 数小时执行），即可获得数千张高质量学术级标本图片，显著提升整个物种库的视觉呈现质量。
