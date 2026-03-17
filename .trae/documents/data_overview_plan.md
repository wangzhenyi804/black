# 数据总览模块需求分析与设计方案

## 1. 需求分析 (Requirement Analysis)

根据提供的界面截图，数据总览模块需要提供一个全面、交互性强的数据分析面板。

### 1.1 筛选区 (Filter Bar)
*   **日期选择**：支持自定义日期范围，以及快捷选项：昨日、最近7天、最近30天、最近90天、本月、上个月、本季度。
*   **多维度筛选**：
    *   **代码位ID**：输入框，精确匹配。
    *   **代码位名称**：输入框，模糊匹配。
    *   **终端类型**：下拉选择（全部、PC、Mobile、App）。
    *   **展现类型**：下拉选择（全部、Banner、插屏、原生等）。
*   **操作**：查询按钮（触发筛选）、导出按钮（导出 Excel/CSV）、数据查询接口（API 文档入口）。

### 1.2 核心指标卡片 (Key Metrics Cards)
需要展示以下聚合数据（基于筛选条件）：
1.  **展现 (Impressions)**
2.  **点击 (Clicks)**
3.  **点击率 (CTR)** = 点击 / 展现
4.  **eCPM** = (收入 / 展现) * 1000
5.  **ACP (平均点击价格)** = 收入 / 点击
6.  **分成后收入 (Revenue)**
7.  **日均分成后收入** = 总收入 / 天数

### 1.3 趋势图表 (Trend Chart)
*   **双轴图表**：支持同时展示两个指标的趋势对比（如左轴为展现，右轴为收入）。
*   **指标切换**：
    *   左侧显示当前选中的两个指标标签。
    *   提供“更多指标”按钮，点击弹出模态框，允许用户从所有可用指标中勾选最多 2 个进行展示（如展现、收入、点击、点击率、eCPM、ACP）。
*   **交互**：Hover 显示具体日期的详细数据。

### 1.4 数据明细表格 (Detailed Table)
*   **维度**：默认按“日期”聚合。
*   **列**：日期、展现、点击、点击率、eCPM、ACP、分成前收入（预留）、分成系数（预留）、分成后收入。
*   **分页**：支持大量数据的分页展示。

---

## 2. 技术设计方案 (Technical Design)

### 2.1 后端设计 (Spring Boot)

#### 2.1.1 API 接口设计
新增 `StatsController` 的高级查询接口：

1.  **聚合数据查询 (Summary)**
    *   `GET /stats/summary`
    *   **Params**: `startDate`, `endDate`, `codeSlotId`, `codeSlotName`, `terminal`, `type`
    *   **Response**: `{ impressions, clicks, revenue, ctr, ecpm, acp, dailyAvgRevenue }`

2.  **趋势图数据查询 (Trend)**
    *   `GET /stats/trend`
    *   **Params**: 同上
    *   **Response**: `List<{ date, impressions, clicks, revenue, ... }>`

3.  **列表数据查询 (List)**
    *   `GET /stats/list`
    *   **Params**: 同上 + `page`, `size`, `sortField`, `sortOrder`
    *   **Response**: `IPage<StatsDTO>`

#### 2.1.2 Service 层逻辑 (`StatsService`)
*   使用 MyBatis-Plus 的 `QueryWrapper` 或自定义 XML Mapper 来处理复杂的动态 SQL。
*   需要联表查询 (`stats` left join `code_slot` on stats.code_slot_id = code_slot.id) 以支持按代码位名称、终端、类型筛选。
*   **权限控制**：始终追加 `user_id = current_user` 条件（管理员除外）。

#### 2.1.3 实体与 DTO
*   **StatsQueryDTO**: 封装前端传递的筛选参数。
*   **StatsTrendDTO**: 封装图表和列表返回的数据结构。

### 2.2 前端设计 (React + Tailwind + Recharts)

#### 2.2.1 页面结构 (`pages/DataOverview.tsx`)
*   **Layout**: 垂直布局，依次为 `FilterSection`, `SummaryCards`, `ChartSection`, `DataTable`。
*   **State Management**:
    *   `filter`: 存储日期范围和其他筛选条件。
    *   `summaryData`: 存储卡片数据。
    *   `trendData`: 存储图表数据。
    *   `listData`: 存储表格数据。
    *   `chartMetrics`: 存储当前图表展示的指标 key（数组，长度为 2）。

#### 2.2.2 关键组件
*   **DateRangePicker**: 复用或封装日期选择器，支持快捷按钮。
*   **MetricsModal**: 一个 Checkbox Group 模态框，用于选择图表指标。
*   **DualAxisChart**: 基于 `recharts` 的 `ComposedChart`，根据 `chartMetrics` 动态渲染 `Bar` 或 `Line`，并配置左右 Y 轴。

#### 2.2.3 交互逻辑
*   **联动**：点击“查询”按钮后，同时触发 `fetchSummary`, `fetchTrend`, `fetchList`。
*   **图表切换**：修改 `chartMetrics` 状态后，图表自动重绘，无需重新请求后端（因为 `trendData` 包含了所有指标）。

## 3. 实施步骤

1.  **后端**：
    *   创建 `StatsQueryDTO`。
    *   更新 `StatsMapper.xml` 实现多维度聚合查询 SQL。
    *   在 `StatsService` 中实现聚合、趋势、列表逻辑。
    *   更新 `StatsController` 暴露新接口。
2.  **前端**：
    *   创建 `DataOverview.tsx` 页面骨架。
    *   实现筛选栏（Filter Bar）。
    *   实现核心指标卡片（Cards）。
    *   集成 Recharts 实现双轴图表及指标切换模态框。
    *   实现数据表格。
    *   联调 API。
