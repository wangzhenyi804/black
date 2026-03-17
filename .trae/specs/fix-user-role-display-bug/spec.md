# Fix User Role Display Bug Spec

## Why
用户反馈在用户管理模块的分页列表中，角色信息显示不全或有误。经排查，前端代码在显示角色时使用了硬编码的逻辑，仅判断了 `'admin'` 角色并显示为“管理员”，其余所有情况（包括 `'user'` 角色或其他可能存在的角色）均默认显示为“普通用户”。此外，由于前后端字段命名不一致（`is_active` vs `isActive`），账号状态显示也存在潜在 Bug。

## What Changes
- **角色显示逻辑优化**: 修改 `src/pages/Users.tsx` 中的角色显示逻辑，增加对 `'user'` 角色显式映射为“普通用户”，并对其他未知角色直接显示其原始值。
- **字段命名一致性修复**: 修改 `src/pages/Users.tsx` 中的 `User` 接口和数据读取逻辑，使其适配后端返回的 `isActive` (camelCase) 字段，确保账号状态正确显示。
- **角色映射统一**: 统一角色标签的样式和显示名称。

## Impact
- **UI Consistency**: 角色列将准确反映数据库中的真实角色信息。
- **Data Accuracy**: 账号状态（正常运行/已禁用）将基于真实的后端数据进行显示。
- **Codebase**: 涉及 `src/pages/Users.tsx` 的接口定义和表格渲染部分。

## ADDED Requirements
### Requirement: Dynamic Role Display
系统 SHALL 根据后端返回的角色字符串动态显示标签。
#### Scenario: Known Roles
- **WHEN** 角色为 `'admin'`
- **THEN** 显示“管理员”
- **WHEN** 角色为 `'user'`
- **THEN** 显示“普通用户”
#### Scenario: Unknown Roles
- **WHEN** 角色为其他值（如 `'agent'`)
- **THEN** 直接显示该原始值

### Requirement: Account Status Synchronization
账号状态 SHALL 与后端 `isActive` 字段同步。

## MODIFIED Requirements
N/A
