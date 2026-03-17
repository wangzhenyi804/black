# Fix Dropdown Z-Index Issue Spec

## Why
用户反馈在数据报表页面的筛选栏中，下拉框展开后的内容被下方的卡片图层遮挡。这是由于筛选栏容器与下方内容容器（均使用了 `backdrop-blur` 属性创建了层叠上下文）的层叠顺序（z-index）配置不当导致的。

## What Changes
- **样式调整**: 提升筛选栏容器的 `z-index` 层级，使其高于下方的数据展示区域。
- **涉及页面**:
  - `src/pages/DataOverview.tsx`: 筛选栏容器添加 `relative z-20`。
  - `src/pages/CodeSlotData.tsx`: 筛选栏容器添加 `relative z-20`。

## Impact
- **UI Display**: 下拉框将能够正确悬浮在下方内容之上，不再被遮挡。
- **Codebase**: 仅涉及 CSS 类名的微调，无逻辑变更。

## ADDED Requirements
### Requirement: Dropdown Visibility
筛选栏中的下拉菜单展开时，SHALL 完整显示在所有下方内容图层之上。

## MODIFIED Requirements
### Requirement: Filter Container Styling
筛选栏容器 SHALL 拥有比后续兄弟元素更高的堆叠上下文（Stacking Context）。
