# 媒体与代码位信息导入导出功能 Spec

## Why
目前项目中媒体和代码位的录入完全依赖手动单个操作，对于拥有大量资源的用户（大客户）来说效率极低。引入导入导出功能可以：
1. 提高大批量数据录入的效率。
2. 支持线下数据备份与分析。
3. 方便系统间的数据迁移。

## What Changes
- **后端**：
    - `MediaController`：新增 `/media/export` (GET) 和 `/media/import` (POST) 接口。
    - `CodeSlotController`：新增 `/codeslots/export` (GET) 和 `/codeslots/import` (POST) 接口。
    - 实现 CSV 解析与生成逻辑。
- **前端**：
    - `Media.tsx`：在工具栏增加“批量导入”和“导出”按钮。
    - `CodeSlots.tsx`：在工具栏增加“批量导入”和“导出”按钮。
    - 实现文件上传与下载的交互逻辑。

## Impact
- **Affected Specs**: [Media.tsx](file:///Users/wangzhenyi/MyData/pycode/black-ad/frontend/src/pages/Media.tsx), [CodeSlots.tsx](file:///Users/wangzhenyi/MyData/pycode/black-ad/frontend/src/pages/CodeSlots.tsx), [MediaController.java](file:///Users/wangzhenyi/MyData/pycode/black-ad/backend/src/main/java/com/blackad/backend/controller/MediaController.java), [CodeSlotController.java](file:///Users/wangzhenyi/MyData/pycode/black-ad/backend/src/main/java/com/blackad/backend/controller/CodeSlotController.java)
- **Affected Code**: 新增 CSV 处理工具类，修改现有 Controller。

## ADDED Requirements
### Requirement: 媒体信息导出
系统应支持将当前筛选条件下的所有媒体信息导出为 CSV 文件。

#### Scenario: 导出媒体成功
- **WHEN** 用户点击“导出媒体”按钮
- **THEN** 浏览器下载一个包含媒体 ID、名称、域名、分类、状态、创建时间等字段的 CSV 文件。

### Requirement: 媒体信息导入
系统应支持通过上传 CSV 文件批量创建媒体。

#### Scenario: 导入媒体成功
- **WHEN** 用户上传符合模板格式的 CSV 文件
- **THEN** 系统解析文件，批量保存至数据库，并提示导入成功数量。

### Requirement: 代码位信息导出/导入
功能逻辑与媒体信息一致，包含代码位特有字段（终端、展示形式、尺寸等）。

## MODIFIED Requirements
无。

## REMOVED Requirements
无。
