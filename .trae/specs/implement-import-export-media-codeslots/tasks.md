# Tasks - 媒体与代码位导入导出功能

- [x] Task 1: (Architect-001) 后端 - 实现 CSV 处理工具类: 封装通用的 CSV 解析与生成工具，减少 Controller 中的冗余逻辑。
  - [x] SubTask 1.1: 创建 `CsvUtils` 类，包含对象列表转 CSV 字符串的方法。
  - [x] SubTask 1.2: 编写 CSV 字符串解析为对象列表的方法。

- [x] Task 2: (Architect-001) 后端 - 媒体管理接口开发: 在 `MediaController` 中新增导入导出接口。
  - [x] SubTask 2.1: 实现 `GET /media/export` 导出接口，支持条件过滤。
  - [x] SubTask 2.2: 实现 `POST /media/import` 导入接口，解析 CSV 并批量保存。

- [x] Task 3: (Architect-001) 后端 - 代码位管理接口开发: 在 `CodeSlotController` 中新增导入导出接口。
  - [x] SubTask 3.1: 实现 `GET /codeslots/export` 导出接口。
  - [x] SubTask 3.2: 实现 `POST /codeslots/import` 导入接口。

- [x] Task 4: (FE-001) 前端 - 媒体管理界面增强: 在 `Media.tsx` 中增加导入导出按钮并实现逻辑。
  - [x] SubTask 4.1: 在工具栏添加“导出媒体”和“批量导入”按钮（支持文件上传选择）。
  - [x] SubTask 4.2: 编写 `handleExport` 和 `handleImport` 的前端交互与 API 调用。

- [x] Task 5: (FE-001) 前端 - 代码位管理界面增强: 在 `CodeSlots.tsx` 中增加导入导出按钮。
  - [x] SubTask 5.1: 添加 UI 按钮。
  - [x] SubTask 5.2: 实现逻辑对接。

- [x] Task 6: (QA-001) 测试与验证: 验证导入导出的全链路逻辑。
  - [x] SubTask 6.1: 编写单元测试验证 `CsvUtils` 解析精度。
  - [x] SubTask 6.2: 验证媒体导出 CSV 后，重新导入是否能成功保存（数据完整性校验）。

# Task Dependencies
- Task 2 依赖 Task 1
- Task 3 依赖 Task 1
- Task 4 依赖 Task 2
- Task 5 依赖 Task 3
- Task 6 依赖 Task 2, 3, 4, 5
