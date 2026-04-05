# Ant Domain (蚁域) OpenClaw 接入指南

本指南描述如何通过 API Key 认证接入蚁域，允许 OpenClaw 等工具操作用户的蚁群数据。

## 实现状态

- ✅ API Key 管理接口 (`/api/keys`)
- ✅ 蚁群列表接口 (`/api/colonies`)
- ✅ 蚁群详情接口 (`/api/colonies/:id`)
- ✅ 蚁群日志接口 (`/api/colonies/:id/logs`)
- ⚠️ Settings 页面 UI（待实现）
- ⚠️ 物种公开 API（待实现）

## 获取 API Key

> ⚠️ Settings 页面 UI 尚未实现。目前需要通过 SQL 直接插入 API Key。

1. 登录蚁域
2. 访问 `/settings` 页面（功能开发中）
3. 在「API Keys」区域创建新 Key
4. **重要**：创建后会显示完整 Key，请立即保存，关闭后无法再次查看

## API 认证

所有 API 请求通过 HTTP Header 传递 API Key：

```
x-api-key: ant_your_api_key_here
```

## API Endpoints

### 获取蚁群列表

```
GET /api/colonies
```

**响应**

```json
{
  "colonies": [
    {
      "id": 1,
      "name": "我的第一窝弓背蚁",
      "speciesId": 1,
      "species": {
        "nameCn": "日本弓背蚁",
        "nameLat": "Camponotus japonicus"
      },
      "currentStage": "steady_growth",
      "workerRange": "50-100",
      "status": 1,
      "foundedDate": "2024-03-15T00:00:00.000Z"
    }
  ]
}
```

### 获取单个蚁群详情

```
GET /api/colonies/:id
```

**响应**

```json
{
  "colony": {
    "id": 1,
    "name": "我的第一窝弓背蚁",
    "species": { ... },
    "foundedDate": "2024-03-15",
    "acquiredDate": "2024-03-15",
    "acquireMethod": "婚飞采集",
    "queenCount": 1,
    "currentStage": "steady_growth",
    "workerRange": "50-100",
    "notes": "健康稳定",
    "status": 1
  }
}
```

### 获取蚁群日志

```
GET /api/colonies/:id/logs
```

**查询参数**

| 参数 | 类型 | 描述 |
|------|------|------|
| limit | number | 返回数量，默认 20 |
| offset | number | 偏移量，默认 0 |

**响应**

```json
{
  "logs": [
    {
      "id": 1,
      "date": "2024-06-01T00:00:00.000Z",
      "title": "日常观察",
      "content": "工蚁数量明显增加，",
      "stage": "steady_growth",
      "workerCount": "50-100",
      "eggStatus": "abundant",
      "larvaStatus": "many",
      "pupaStatus": "few",
      "feedingRecord": "糖水 + 面包虫",
      "aiSummary": "蚁群状态良好",
      "createdAt": "2024-06-01T12:00:00.000Z"
    }
  ],
  "total": 15
}
```

### 创建蚁群

```
POST /api/colonies
```

**请求体**

```json
{
  "name": "新蚁群",
  "speciesId": 1,
  "foundedDate": "2024-06-01",
  "queenCount": 1
}
```

**响应**

```json
{
  "colony": { ... },
  "id": 2
}
```

### 创建日志

```
POST /api/colonies/:id/logs
```

**请求体**

```json
{
  "date": "2024-06-15",
  "title": "每周观察",
  "content": "今天喂食了糖水",
  "stage": "steady_growth",
  "workerCount": "100-200",
  "eggStatus": "many",
  "larvaStatus": "abundant",
  "pupaStatus": "many",
  "feedingRecord": "1:10 糖水"
}
```

### 获取物种列表（公开）

```
GET /api/species
```

**响应**

```json
{
  "species": [
    {
      "id": 1,
      "nameCn": "日本弓背蚁",
      "nameLat": "Camponotus japonicus",
      "genus": "Camponotus",
      "difficulty": 1,
      "beginnerFriendly": true
    }
  ]
}
```

### 获取物种详情（公开）

```
GET /api/species/:id
```

## OpenClaw 配置示例

在 OpenClaw 的配置文件中添加：

```json
{
  "apiEndpoint": "https://your-domain.vercel.app/api",
  "headers": {
    "Content-Type": "application/json",
    "x-api-key": "ant_your_api_key_here"
  }
}
```

## 错误响应

所有 API 错误返回统一格式：

```json
{
  "error": "错误描述"
}
```

| HTTP 状态码 | 含义 |
|-------------|------|
| 400 | 请求参数错误 |
| 401 | API Key 无效或缺失 |
| 403 | 无权限访问该资源 |
| 404 | 资源不存在 |
| 500 | 服务器内部错误 |

## 注意事项

1. **API Key 安全**：请勿将 API Key 提交到公开的代码仓库
2. **频率限制**：建议控制调用频率，避免短时间内大量请求
3. **数据归属**：所有 API 操作会记录到对应用户名下
