# BlackAd API 接口文档

本文档整理了 BlackAd 项目的所有后端接口及其与前端的映射情况，并详细记录了目前发现的前后端字段不匹配项。

## 1. 通用规范
- **基础路径**：`http://localhost:8080`
- **鉴权方式**：`Authorization: Bearer {access_token}`
- **响应格式**：目前后端直接返回实体对象或 `IPage` 分页对象，尚未统一 `Result<T>` 包装。
- **命名规范**：
    - **后端 (Java)**：CamelCase (驼峰命名)
    - **前端 (TS)**：snake_case (下划线命名)
    - **重要提示**：由于后端尚未全局开启 Jackson 的 `SNAKE_CASE` 序列化策略，导致大量下划线命名的前端字段在后端无法自动映射为驼峰命名的属性。

## 2. 认证模块 (Auth)

### 2.1 登录获取 Token
- **URL**: `/token`
- **Method**: `POST`
- **描述**: 用户登录并获取 JWT 访问令牌。
- **请求体**:
  | 字段 | 类型 | 描述 |
  | :--- | :--- | :--- |
  | username | String | 用户名/邮箱 |
  | password | String | 密码 |
- **响应字段**:
  | 字段 | 类型 | 描述 |
  | :--- | :--- | :--- |
  | access_token | String | JWT 令牌 |
  | token_type | String | 令牌类型 (bearer) |
  | role | String | 用户角色 (admin/user) |

## 3. 用户模块 (Users)

### 3.1 获取当前用户信息
- **URL**: `/users/me`
- **Method**: `GET`
- **响应字段**: `id`, `username`, `role`, `isActive` (前端期望 `is_active`)

### 3.2 用户列表 (Admin)
- **URL**: `/users/`
- **Method**: `GET`
- **查询参数**: `page` (默认1), `size` (默认10)
- **响应字段**: `records` (List), `total`

### 3.3 创建用户 (Admin)
- **URL**: `/users/`
- **Method**: `POST`
- **请求体**: `username`, `password`, `role`

### 3.4 更新用户 (Admin)
- **URL**: `/users/{id}`
- **Method**: `PUT`
- **请求体**: `username`, `role`, `isActive` (前端发送的是 `is_active`)

### 3.5 删除用户 (Admin)
- **URL**: `/users/{id}`
- **Method**: `DELETE`

### 3.6 修改个人密码
- **URL**: `/users/me/password`
- **Method**: `PUT`
- **请求体**: `old_password`, `new_password`

### 3.7 重置用户密码 (Admin)
- **URL**: `/users/{id}/reset-password`
- **Method**: `PUT`
- **请求体**: `new_password`

## 4. 媒体模块 (Media)

### 4.1 媒体列表
- **URL**: `/media/`
- **Method**: `GET`
- **查询参数**: `page`, `size`, `name`, `category`, `status`
- **响应字段**: `records` (List), `total`

### 4.2 创建媒体
- **URL**: `/media/`
- **Method**: `POST`
- **请求体关键字段**: 
  - `name`, `domain`, `category`, `type`
  - `icpCode` (前端发送 `icp_code`)
  - `dailyVisits` (前端发送 `daily_visits`)
  - `statsAuthType` (前端发送 `stats_auth_type`)
  - `agentAuthUrl` (前端发送 `agent_auth_url`)
  - `copyrightUrl` (前端发送 `copyright_url`)

### 4.3 更新媒体
- **URL**: `/media/{id}`
- **Method**: `PUT`
- **请求体**: 同创建媒体

### 4.4 导出/导入媒体
- **导出**: `GET /media/export` (支持条件过滤)
- **导入**: `POST /media/import` (MultipartFile `file`)

## 5. 代码位模块 (CodeSlots)

### 5.1 代码位列表
- **URL**: `/codeslots/`
- **Method**: `GET`
- **查询参数**: `page`, `size`, `name`, `mediaId` (前端发送 `media_id`), `type`, `status`

### 5.2 创建代码位
- **URL**: `/codeslots/`
- **Method**: `POST`
- **请求体关键字段**:
  - `name`, `mediaId` (前端发送 `media_id`)
  - `terminal`, `displayType` (前端发送 `display_type`)
  - `adType` (前端发送 `ad_type`), `adForm` (前端发送 `ad_form`)
  - `ratio`, `styleType` (前端发送 `style_type`)
  - `isShielding` (前端发送 `is_shielding`), `revenueRatio` (前端发送 `revenue_ratio`)

### 5.3 更新代码位
- **URL**: `/codeslots/{id}`
- **Method**: `PUT`
- **请求体**: 同上

### 5.4 调整分成系数 (Admin)
- **URL**: `/codeslots/{id}/ratio`
- **Method**: `PUT`
- **请求体**: `ratio`

### 5.5 导出/导入代码位
- **导出**: `GET /codeslots/export`
- **导入**: `POST /codeslots/import`

## 6. 数据统计模块 (Stats)

### 6.1 仪表盘汇总
- **URL**: `/stats/dashboard`
- **Method**: `GET`
- **响应字段**: `yesterdayRevenue`, `last7DaysRevenue`, `monthRevenue`, `dailyAvgRevenue`

### 6.2 统计汇总/趋势/明细
- **汇总**: `GET /stats/summary`
- **趋势**: `GET /stats/trend`
- **列表**: `GET /stats/list`
- **查询参数**: `startDate`, `endDate`, `codeSlotId`, `codeSlotName`, `terminal`, `type`

### 6.3 代码位维度统计
- **URL**: `/stats/codeslots`
- **Method**: `GET`
- **查询参数**: 同上 + `page`, `size`

## 7. 文件上传模块 (Upload)

### 7.1 上传文件
- **URL**: `/upload`
- **Method**: `POST`
- **参数**: `file` (MultipartFile)
- **响应**: `{ "url": "/upload/files/xxx.jpg" }`

---

## 8. 待修复/不匹配清单 (Discrepancy Log)

以下为当前系统中 **必须修复** 的前后端字段差异，否则会导致数据保存失败或显示异常。

### 8.1 命名风格冲突 (CamelCase vs snake_case)

| 模块 | 后端属性 (Java) | 前端属性 (TS/JSON) | 影响接口 |
| :--- | :--- | :--- | :--- |
| **User** | `isActive` | `is_active` | `GET /users/me`, `PUT /users/{id}` |
| **Media** | `icpCode` | `icp_code` | `POST /media/`, `PUT /media/{id}` |
| **Media** | `dailyVisits` | `daily_visits` | 同上 |
| **Media** | `statsAuthType` | `stats_auth_type` | 同上 |
| **Media** | `agentAuthUrl` | `agent_auth_url` | 同上 |
| **Media** | `copyrightUrl` | `copyright_url` | 同上 |
| **CodeSlot** | `mediaId` | `media_id` | `GET /codeslots/`, `POST /codeslots/` |
| **CodeSlot** | `displayType` | `display_type` | `POST /codeslots/`, `PUT /codeslots/{id}` |
| **CodeSlot** | `adType` | `ad_type` | 同上 |
| **CodeSlot** | `adForm` | `ad_form` | 同上 |
| **CodeSlot** | `styleType` | `style_type` | 同上 |
| **CodeSlot** | `imageUrl` | `image_url` | 同上 |
| **CodeSlot** | `isShielding` | `is_shielding` | 同上 |
| **CodeSlot** | `revenueRatio` | `revenue_ratio` | 同上 |
| **CodeSlot** | `createdAt` | `created_at` | `GET /codeslots/` (显示异常) |
| **CodeSlot** | `updatedAt` | `updated_at` | 同上 |

### 8.2 路径与参数差异

| 模块 | 差异描述 | 建议修复方案 |
| :--- | :--- | :--- |
| **User** | 后端定义 `/users/` 而前端 POST 调用为 `/users` | 统一去除后端路径末尾的斜杠或前端补齐 |
| **CodeSlot** | 代码位搜索参数 `media_id` 后端无法识别 | 后端使用 `@RequestParam("media_id")` 或前端改名为 `mediaId` |

---
*由 PM-001 整理，最后更新日期：2026-03-12*
