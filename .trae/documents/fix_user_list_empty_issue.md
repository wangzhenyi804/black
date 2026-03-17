# 修复用户列表显示为空的问题

## 问题分析
用户反馈用户管理模块列表为空，但后端接口有数据。
经过分析，发现可能的原因如下：
1. **数据结构不匹配**：前端代码中使用了 `res.data?.records` 来获取数据。虽然大部分接口返回的是 `IPage` 对象，但如果后端返回的 JSON 结构被包装在了一个 `Result` 对象中（例如 `{ code: 200, data: { records: [...], total: 10 } }`），则需要使用 `res.data.data.records`。
2. **状态更新逻辑**：虽然 `fetchUsers` 被调用，但由于 `records` 获取失败（为 `undefined`），导致 `users` 状态被设置为空数组。
3. **字段命名策略**：后端配置了 `SNAKE_CASE` 策略，这意味着 `isActive` 会被序列化为 `is_active`。虽然这只会导致状态显示错误，但需要一并修正以确保数据准确。

## 解决方案
1. **增强数据解析逻辑**：在 `fetchUsers` 中增加对不同响应结构的兼容性处理，优先尝试 `res.data.records`，如果不存在则尝试 `res.data.data.records`。
2. **修正字段名**：将前端 `User` 接口和模板中的 `isActive` 改回 `is_active`，以匹配后端的 `SNAKE_CASE` 序列化策略。
3. **增加调试日志**：在 `fetchUsers` 中打印完整的 `res.data`，方便在控制台确认实际的数据结构。

## 实施步骤
1. 修改 [Users.tsx](file:///Users/wangzhenyi/MyData/pycode/black-ad/frontend/src/pages/Users.tsx)：
    - 更新 `fetchUsers` 函数，增加对 `res.data.data` 的检查。
    - 将 `User` 接口中的 `isActive` 改为 `is_active`。
    - 更新表格渲染逻辑中的 `u.isActive` 为 `u.is_active`。
    - 更新编辑弹窗中的 `editingUser.isActive` 为 `editingUser.is_active`。
2. 验证修复效果。
