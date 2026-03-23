# 修复新增/编辑模态框数据串移问题计划 (Fix Modal State Bleed)

## 1. 问题分析 (Current State Analysis)
在 **媒体管理 (`Media.tsx`)** 和 **代码位管理 (`CodeSlots.tsx`)** 中，"新增"和"编辑"操作共用了一个 React 状态 `formData` 来存储表单输入的数据。

目前的逻辑中：
- 当您点击“编辑”时，系统会将当前选中的数据行赋值给 `formData` 并打开弹窗。
- 如果您点击了右上角的“X”或者底部的“取消”按钮，系统仅仅执行了关闭弹窗 (`setIsModalOpen(false)`) 和清空编辑ID (`setEditingId(null)`) 的操作。
- **缺失的环节**：系统并没有清空 `formData` 中的数据。
- 因此，当您再次点击“新增”按钮时，弹窗打开，由于 `formData` 中仍然保留着上一次编辑时加载的数据，这就导致了数据“自动带入”的错误现象。

## 2. 解决方案 (Proposed Changes)

为了彻底解决这个问题，我们需要在关闭弹窗以及点击新增按钮时，确保 `formData` 被重置为初始的空状态。

### 涉及修改的文件
1. `frontend/src/pages/Media.tsx`
2. `frontend/src/pages/CodeSlots.tsx`

### 具体修改步骤
对于上述两个文件，采取相同的修复策略：

1. **统一定义初始表单数据**
   将表单的初始空状态提取出来，避免代码中多处重复编写长串的空对象。
   
2. **新增 `handleCloseModal` 统一关闭处理函数**
   在这个函数中执行三个动作：
   - 关闭弹窗 `setIsModalOpen(false)`
   - 清空编辑状态 `setEditingId(null)`
   - **重置表单数据** `setFormData(初始空状态)`

3. **替换现有的关闭事件**
   将右上角“X”按钮和底部“取消”按钮的 `onClick` 事件统一替换为调用 `handleCloseModal`。

4. **增强“新增”按钮的逻辑**
   在点击“新增”按钮打开弹窗前，主动调用一次 `setFormData(初始空状态)` 并确保 `setEditingId(null)`，作为双重保险，确保每次点开新增都是一张白纸。

## 3. 验证步骤 (Verification)
实施修改后，可以通过以下步骤验证：
1. 进入媒体或代码位列表。
2. 随意点击一个已存在数据的“编辑”按钮，确认表单内有数据。
3. 点击右上角的“X”或底部的“取消”关闭弹窗。
4. 点击顶部栏的“新增”按钮，确认弹窗内的数据已完全清空，不再带有刚才的数据。