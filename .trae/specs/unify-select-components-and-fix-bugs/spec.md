# Unify Select Components and Fix Bugs Spec

## Why
目前项目中存在原生 `<select>` 元素和自定义 `Select` 组件混用的情况，导致 UI 风格不统一（尤其是在暗色模式下，原生下拉框样式突兀）。此外，用户反馈现有的自定义下拉框组件存在选择功能的 Bug，需要进行排查和修复，以保证用户体验的一致性和功能的稳定性。

## What Changes
- **组件修复**: 分析并修复 `src/components/Select.tsx` 中的潜在逻辑问题（如类型匹配、事件冒泡、状态同步等）。
- **组件替换**: 将以下文件中的原生 `<select>` 替换为自定义 `src/components/Select.tsx` 组件：
  - `src/pages/DataOverview.tsx` (终端类型、展现形式筛选)
  - `src/pages/CodeSlotData.tsx` (终端类型、展现形式筛选)
  - `src/components/Pagination.tsx` (每页条数选择)
- **样式适配**: 确保 `Select` 组件在不同上下文（如分页栏的小尺寸场景）中样式表现正常。

## Impact
- **UI Consistency**: 全局下拉框样式将统一为暗色磨砂风格，消除原生控件的白色背景违和感。
- **Codebase**: `DataOverview.tsx`, `CodeSlotData.tsx`, `Pagination.tsx` 的代码将会有所调整，主要是 `onChange` 事件处理逻辑（从 `event.target.value` 变为直接接收 `value`）。
- **Functionality**: 筛选和分页功能将保持不变，但交互体验更佳。

## ADDED Requirements
### Requirement: Consistent Dropdown UI
系统中的所有下拉选择交互 SHALL 使用统一的 `Select` 组件，不再保留原生 `<select>` 标签。

### Requirement: Bug-free Selection
自定义 `Select` 组件 SHALL 正确响应点击事件，更新选中值，并在点击外部时正确关闭下拉菜单。

## MODIFIED Requirements
### Requirement: Data Overview & Code Slot Data Filtering
筛选栏中的"终端类型"和"展现形式" SHALL 使用自定义下拉框，且保持原有的筛选逻辑。

### Requirement: Pagination Size Selector
分页组件中的"每页条数"选择器 SHALL 使用自定义下拉框，并适配较小的布局空间。
