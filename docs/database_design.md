# 数据库设计文档

**项目名称**：BlackAd 广告管理平台  
**文档版本**：v1.1  
**负责人**：DB-001 (数据库设计专家)  
**更新日期**：2026-03-12

---

## 1. 映射规范
为了确保前后端协作高效且数据库结构规范，项目遵循以下命名映射规则：
- **API 层 (JSON)**：下划线命名 (`snake_case`)，由 Jackson `SNAKE_CASE` 策略控制。
- **业务层 (Java)**：驼峰命名 (`camelCase`)，Lombok 自动生成 Getter/Setter。
- **持久层 (MySQL)**：下划线命名 (`snake_case`)，由 MyBatis-Plus 自动转换。

## 2. 表结构详细设计

### 2.1 用户表 (user)
存储系统用户信息及权限角色。

| 数据库列名 | 实体字段名 | 类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 用户唯一标识 |
| `username` | `username` | VARCHAR(255) | NOT NULL, UNIQUE | 登录账号 |
| `password` | `password` | VARCHAR(255) | NOT NULL | 加密存储的密码 |
| `role` | `role` | VARCHAR(50) | NOT NULL | 用户角色 (admin/user) |
| `is_active` | `isActive` | BOOLEAN | DEFAULT TRUE | 账号是否启用 |

### 2.2 媒体表 (media)
存储媒体（网站/应用）的基础信息及审核资质。

| 数据库列名 | 实体字段名 | 类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 媒体唯一标识 |
| `user_id` | `userId` | BIGINT | FOREIGN KEY | 所属用户 ID |
| `name` | `name` | VARCHAR(255) | NOT NULL | 媒体名称 |
| `type` | `type` | VARCHAR(50) | NOT NULL | 媒体类型 (Website/APP) |
| `domain` | `domain` | VARCHAR(255) | - | 域名 |
| `category` | `category` | VARCHAR(50) | - | 行业分类 |
| `icp_code` | `icpCode` | VARCHAR(100) | - | ICP 备案号 |
| `daily_visits` | `dailyVisits` | VARCHAR(50) | - | 日均访问量 |
| `stats_auth_type`| `statsAuthType`| VARCHAR(50) | - | 统计授权方式 |
| `agent_auth_url` | `agentAuthUrl` | VARCHAR(500) | - | 代理授权文件 URL |
| `copyright_url` | `copyrightUrl` | VARCHAR(500) | - | 软著/资质文件 URL |
| `status` | `status` | VARCHAR(50) | DEFAULT 'PENDING' | 审核状态 |
| `created_at` | `createdAt` | DATETIME | DEFAULT CURRENT_TIMESTAMP | 创建时间 |

### 2.3 代码位表 (code_slot)
存储广告位的具体展示配置及集成代码。

| 数据库列名 | 实体字段名 | 类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 代码位唯一标识 |
| `media_id` | `mediaId` | BIGINT | FOREIGN KEY | 所属媒体 ID |
| `name` | `name` | VARCHAR(255) | NOT NULL | 代码位名称 |
| `terminal` | `terminal` | VARCHAR(50) | - | 终端类型 (H5/PC) |
| `display_type` | `displayType` | VARCHAR(50) | - | 展示形式 (固定/悬浮/插屏) |
| `ad_type` | `adType` | VARCHAR(50) | - | 广告类型 (信息流/图文) |
| `ad_form` | `adForm` | VARCHAR(50) | - | 广告表现形式 |
| `ratio` | `ratio` | INT | - | 尺寸比例 (20:N 中的 N) |
| `revenue_ratio` | `revenueRatio` | DECIMAL(4,2) | DEFAULT 1.00 | 分成系数 (0-1) |
| `is_shielding` | `isShielding` | BOOLEAN | DEFAULT FALSE | 是否开启反屏蔽 |
| `code_content` | `codeContent` | TEXT | - | 生成的集成代码内容 |
| `status` | `status` | VARCHAR(50) | DEFAULT 'ACTIVE' | 状态 (ACTIVE/PAUSED) |

### 2.4 统计表 (stats)
存储每日维度的展示、点击及收入数据。

| 数据库列名 | 实体字段名 | 类型 | 约束 | 描述 |
| :--- | :--- | :--- | :--- | :--- |
| `id` | `id` | BIGINT | PRIMARY KEY, AUTO_INCREMENT | 统计 ID |
| `date` | `date` | DATE | - | 统计日期 |
| `code_slot_id` | `codeSlotId` | BIGINT | FOREIGN KEY | 关联的代码位 ID |
| `impressions` | `impressions` | BIGINT | DEFAULT 0 | 展现量 |
| `clicks` | `clicks` | BIGINT | DEFAULT 0 | 点击量 |
| `revenue` | `revenue` | DECIMAL(10,2) | DEFAULT 0.00 | 原始收入 (分成前) |
| `ratio` | `ratio` | DECIMAL(4,2) | DEFAULT 1.00 | 结算时使用的系数 |
| `extra_data` | `extraData` | TEXT | - | 导入时的原始冗余数据 (JSON) |

## 3. 索引建议
- **user**: `username` (UNIQUE)
- **media**: `user_id` (INDEX)
- **code_slot**: `media_id` (INDEX), `user_id` (INDEX)
- **stats**: `(date, code_slot_id)` (UNIQUE INDEX) 确保每日每个代码位只有一条记录。

---
*由 DB-001 (数据库设计专家) 整理*
