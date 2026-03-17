# API 接口梳理与文档沉淀计划

本计划旨在对 BlackAd 项目的所有前后端接口进行全量审计，识别字段命名风格（CamelCase vs snake_case）等不匹配问题，并将其沉淀为标准 Markdown 接口文档。

## 1. 核心目标
- **梳理后端接口**：深入 Controller 层，提取所有公开 API 的定义。
- **比对前端调用**：识别 URL 路径、请求参数、响应字段中的不匹配点。
- **沉淀接口文档**：在 `docs/api_specification.md` 记录接口标准。
- **记录不匹配项**：详尽列出“待修复/不匹配清单”，为后续代码更新提供依据。

## 2. 实施步骤

### 第一阶段：后端 API 深度审计 (Architect-001)
1.  **控制器扫描**：遍历 `AuthController`, `UserController`, `MediaController`, `CodeSlotController`, `StatsController`。
2.  **元数据提取**：
    - 请求方法 (GET, POST, PUT, DELETE)。
    - URL 路径 (含路径变量)。
    - 查询参数 (Query Params) 及请求体 (Request Body) 字段。
    - 响应体 (Response Body) 关键字段列表。

### 第二阶段：前端调用链比对 (FE-001)
1.  **接口消费审计**：扫描 `frontend/src/pages/` 目录下所有页面的 API 调用（使用 `api.ts` 或直接调用 `api` 实例的地方）。
2.  **不匹配识别**：
    - **路径不一致**：例如 `/users/` 与 `/users`。
    - **字段命名冲突**：例如后端 `mediaId` 与前端 `media_id`。
    - **参数丢失/冗余**：识别前端发送但后端未接收，或后端返回但前端未使用的字段。

### 第三阶段：文档沉淀与差异记录 (PM-001)
1.  **创建文档**：在根目录下创建 [api_specification.md](file:///Users/wangzhenyi/MyData/pycode/black-ad/docs/api_specification.md)。
2.  **文档结构**：
    - **第一部分**：通用规范（基础路径、公共响应格式、鉴权方式）。
    - **第二部分**：业务接口列表（按模块组织：认证、用户、媒体、代码位、数据统计）。
    - **第三部分**：**待修复/不匹配清单 (Discrepancy Log)** —— 详细记录每一处发现的差异，标注其影响面。

## 3. 验收标准
- [ ] [api_specification.md](file:///Users/wangzhenyi/MyData/pycode/black-ad/docs/api_specification.md) 文档已成功创建且内容完整。
- [ ] 文档涵盖所有核心业务模块的 100% 公开接口。
- [ ] “待修复清单”已详尽列出所有已知的 CamelCase 与 snake_case 冲突点。
- [ ] 代码库未发生任何非 Read-only 的变更（严格遵循“先记录，不修改”原则）。

---
*由 PM-001 (数字化产品经理) 编写并维护*
