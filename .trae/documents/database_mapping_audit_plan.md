# 数据库设计与字段映射审计计划

本计划旨在梳理 BlackAd 项目中从前端接口参数、后端实体字段到数据库列的完整映射关系，并产出一份专业的数据库设计文档。

## 1. 核心目标
- **梳理映射一致性**：验证 `JSON (snake_case) ↔ Java (camelCase) ↔ DB (snake_case)` 的转换链路是否覆盖所有业务字段。
- **产出数据库设计文档**：提供包含表结构说明、字段定义、索引建议及映射关系的详细文档。
- **同步基础脚本**：更新 `schema.sql`，确保其反映当前实体类的最新结构（包括最近新增的统计系数、分成前收入等字段）。

## 2. 实施步骤

### 第一阶段：映射关系审计 (Architect-001)
1.  **逐模块比对**：
    - **用户模块**：比对 `user` 表、`User.java` 实体。
    - **媒体模块**：比对 `media` 表、`Media.java` 实体，重点检查资质上传相关字段。
    - **代码位模块**：比对 `code_slot` 表、`CodeSlot.java` 实体，重点检查新增的展示形式、广告类型及分成系数。
    - **统计模块**：比对 `stats` 表、`Stats.java` 实体，重点检查 `pre_revenue`, `ratio`, `extra_data` 等新增字段。
2.  **验证转换策略**：
    - 检查 Jackson 的 `SNAKE_CASE` 策略是否对所有 DTO/Entity 生效。
    - 检查 MyBatis-Plus 的 `map-underscore-to-camel-case` 策略。

### 第二阶段：编写数据库设计文档 (DB-001)
1.  **创建文档**：在 `docs/` 目录下创建 [database_design.md](file:///Users/wangzhenyi/MyData/pycode/black-ad/docs/database_design.md)。
2.  **文档内容**：
    - **表结构总览**：ER 模型简述。
    - **详细字段说明**：每个表的字段名、数据类型、注释、默认值及主外键关系。
    - **映射关系表**：展示从接口 JSON 到数据库列的映射路径。
    - **索引设计**：记录现有的索引并提供优化建议。

### 第三阶段：同步 schema.sql (Architect-001)
1.  **整合更新**：将 `update_codeslot_table.sql` 中的变更以及实体类中新增但脚本缺失的字段（如 `Stats` 表的新增字段）整合进主 [schema.sql](file:///Users/wangzhenyi/MyData/pycode/black-ad/backend/src/main/resources/schema.sql)。
2.  **保持一致性**：确保新部署的环境可以通过执行主脚本直接还原最新的数据库结构。

## 3. 验收标准
- [ ] [database_design.md](file:///Users/wangzhenyi/MyData/pycode/black-ad/docs/database_design.md) 文档内容详实且与源码完全一致。
- [ ] 映射关系覆盖了项目中 100% 的业务字段。
- [ ] [schema.sql](file:///Users/wangzhenyi/MyData/pycode/black-ad/backend/src/main/resources/schema.sql) 已包含所有实体的最新字段定义。

---
*由 Architect-001 (架构师) 编写并维护*
