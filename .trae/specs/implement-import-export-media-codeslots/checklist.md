# Checklist - 媒体与代码位导入导出功能

- [x] 后端 CSV 处理工具类功能完备，支持对象列表与 CSV 字符串的互转
- [x] 后端 `MediaController` 新增 `GET /media/export` 接口，导出内容包含所有关键字段
- [x] 后端 `MediaController` 新增 `POST /media/import` 接口，解析 CSV 后成功创建媒体记录
- [x] 后端 `CodeSlotController` 新增 `GET /codeslots/export` 接口，导出内容包含代码位配置
- [x] 后端 `CodeSlotController` 新增 `POST /codeslots/import` 接口，解析 CSV 后成功创建代码位记录
- [x] 前端 `Media.tsx` 页面“导出媒体”按钮点击后，浏览器成功下载 CSV 文件
- [x] 前端 `Media.tsx` 页面“批量导入”按钮点击并选择文件后，导入成功并刷新列表
- [x] 前端 `CodeSlots.tsx` 页面“导出代码位”按钮点击后，浏览器成功下载 CSV 文件
- [x] 前端 `CodeSlots.tsx` 页面“批量导入”按钮点击并选择文件后，导入成功并刷新列表
- [x] 单元测试验证 CSV 数据解析准确性，且导入逻辑具备基础的容错处理（如空字段处理）
