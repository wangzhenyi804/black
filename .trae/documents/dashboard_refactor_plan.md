# 总览模块调整计划

## 1. 需求背景
根据用户提供的原型图，需要对“总览”页面进行重构，包括：
*   新增欢迎语。
*   调整“网页广告概览”板块，展示四个特定的分成后收入指标。
*   更新统计图表为“最近7天统计”折线图。
*   在图表下方增加交互按钮，点击可切换图表展示的维度（分成后收入、展现、点击、点击率、eCPM）。

## 2. 后端调整 (Spring Boot)

### 2.1 统计模型增强
*   在 `StatsController` 中新增 `/stats/dashboard` 接口，一次性返回首页所需的汇总数据。
*   返回数据结构包含：
    *   `yesterdayRevenue`: 昨日分成后收入
    *   `last7DaysRevenue`: 前7日分成后收入
    *   `thisMonthRevenue`: 本月分成后收入
    *   `last7DaysAvgRevenue`: 最近7日日均分成后收入

### 2.2 接口实现逻辑
*   `StatsService` 实现 `getDashboardStats`：
    *   计算昨日、前7天、本月开始日期。
    *   调用 `statsMapper` 进行聚合查询。
    *   计算日均值。

## 3. 前端调整 (React)

### 3.1 页面重构 (`Dashboard.tsx`)
*   **顶部欢迎语**：从 `AuthContext` 获取当前登录用户名，显示“您好，欢迎 [username]”。
*   **概览卡片**：
    *   标题改为“网页广告概览”。
    *   展示四个收入指标卡片，样式参考图片（白底、灰字、大标题数字）。
*   **趋势统计图**：
    *   标题“最近7天统计”。
    *   使用 `recharts` 的 `LineChart`。
    *   X 轴显示日期，Y 轴根据选中的指标动态变化。
*   **指标切换按钮**：
    *   在图表下方居中放置五个单选按钮（Radio Group 样式）。
    *   点击按钮切换 `activeMetric` 状态，图表随之重绘。

### 3.2 数据联调
*   调用 `/stats/dashboard` 获取卡片数据。
*   调用 `/stats/trend`（参数固定为最近7天）获取图表数据。

## 4. 实施步骤
1.  **后端**：定义 `DashboardStatsDTO` -> 增加 Controller 接口 -> 实现 Service 逻辑。
2.  **前端**：修改 `Dashboard.tsx` 布局 -> 实现指标切换逻辑 -> 接入后端数据。
3.  **验证**：检查数据准确性及图表交互。
