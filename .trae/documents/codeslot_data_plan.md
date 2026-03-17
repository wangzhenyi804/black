# 代码位数据模块需求分析与设计方案

## 1. 需求分析 (Requirement Analysis)

根据提供的界面截图，代码位数据模块旨在为用户提供基于**代码位维度**的详细数据报表。与“数据总览”不同，此模块的重点在于对比不同代码位的表现，而非整体趋势。

### 1.1 筛选区 (Filter Bar)
*   **日期选择**：同数据总览，支持自定义日期范围及快捷选项（昨日、最近7天、最近30天等）。
*   **多维度筛选**：
    *   **代码位ID**：输入框，精确匹配。
    *   **代码位名称**：输入框，模糊匹配。
    *   **终端类型**：下拉选择（全部、PC、Mobile、App）。
    *   **展现类型**：下拉选择（全部、Banner、插屏、原生等）。
*   **操作**：查询按钮、导出按钮。

### 1.2 数据表格 (Data Table)
*   **维度**：每一行代表一个**代码位**（在选定时间范围内的聚合数据）。
*   **汇总行**：表格第一行固定显示“汇总”数据，展示所有筛选结果的总和。
*   **列定义**：
    1.  **代码位ID**
    2.  **代码位名称**
    3.  **展现量** (Impressions)
    4.  **点击量** (Clicks)
    5.  **点击率** (CTR)
    6.  **eCPM**
    7.  **ACP**
    8.  **分成前收入** (预留，目前可显示 0 或与分成后一致)
    9.  **分成系数** (预留，默认 1.00 或 0.00)
    10. **分成后收入** (Revenue)
*   **分页**：支持大量代码位的分页展示。

---

## 2. 技术设计方案 (Technical Design)

### 2.1 后端设计 (Spring Boot)

#### 2.1.1 API 接口设计
在 `StatsController` 中新增一个专门用于代码位维度聚合的接口：

*   **代码位数据列表查询**
    *   `GET /stats/codeslots`
    *   **Params**: `startDate`, `endDate`, `codeSlotId`, `codeSlotName`, `terminal`, `type`, `page`, `size`
    *   **Response**: `IPage<StatsCodeSlotDTO>`
        *   `StatsCodeSlotDTO` 包含：`codeSlotId`, `codeSlotName`, `impressions`, `clicks`, `revenue`, `ctr`, `ecpm`, `acp`。

#### 2.1.2 Service 层逻辑 (`StatsService`)
*   **聚合逻辑**：
    *   需要按 `code_slot_id` 分组 (`GROUP BY s.code_slot_id`)。
    *   需要联表查询 `code_slot` 表以获取名称 (`name`)。
    *   时间范围内的所有数据汇总到该代码位上。
*   **汇总行计算**：
    *   前端可以复用 `/stats/summary` 接口获取整体汇总数据，或者后端在返回 Page 对象时附带汇总信息（通常分开请求更清晰）。

#### 2.1.3 Mapper 层 (`StatsMapper`)
*   编写新的 SQL 查询：
    ```sql
    SELECT 
        s.code_slot_id,
        cs.name as code_slot_name,
        SUM(s.impressions) as impressions,
        ...
    FROM stats s
    JOIN code_slot cs ON s.code_slot_id = cs.id
    WHERE ...
    GROUP BY s.code_slot_id
    ```

### 2.2 前端设计 (React)

#### 2.2.1 页面结构 (`pages/CodeSlotData.tsx`)
*   **复用组件**：
    *   复用 `DataOverview` 中的 `FilterSection`（日期选择 + 筛选条件）。
    *   复用 API 调用逻辑（`fetchData`）。
*   **表格组件**：
    *   使用 Tailwind CSS 构建响应式表格。
    *   **汇总行处理**：在表格 `tbody` 的第一行手动插入从 `/stats/summary` 获取的数据，标记为“汇总”。
    *   **数据行**：渲染从 `/stats/codeslots` 获取的列表数据。

#### 2.2.2 状态管理
*   `filters`: 同数据总览。
*   `summary`: 用于显示汇总行。
*   `listData`: 用于显示代码位列表。
*   `pagination`: 控制分页。

## 3. 实施步骤

1.  **后端**：
    *   创建 `StatsCodeSlotDTO`。
    *   在 `StatsMapper` 中添加 `selectCodeSlotStats` 方法及 SQL。
    *   在 `StatsService` 实现逻辑。
    *   在 `StatsController` 暴露 `/stats/codeslots` 接口。
2.  **前端**：
    *   创建 `CodeSlotData.tsx`。
    *   实现筛选栏（可提取公共组件或复制逻辑）。
    *   实现包含汇总行的表格。
    *   联调接口。
