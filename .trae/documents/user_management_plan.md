# 用户管理与数据隔离方案

## 1. 目标
实现基于角色的用户管理（普通用户与管理员）及相应的数据隔离机制。

## 2. 核心变更点

### 2.1 数据库与实体层变更
为核心业务实体增加 `userId` 字段，建立数据归属关系：
- `Media` 实体：增加 `private Long userId;`
- `CodeSlot` 实体：增加 `private Long userId;`
- `Stats` 实体：增加 `private Long userId;`（便于直接按用户统计数据）

### 2.2 安全配置升级
启用方法级安全注解，以便在 Controller 层精细控制权限。
- `SecurityConfig.java`: 添加 `@EnableMethodSecurity(prePostEnabled = true)` 注解。

### 2.3 用户管理模块 (RBAC)
增强 `UserController`，明确区分管理员与普通用户权限：
- **管理员权限**：
  - `GET /users/`: 查看所有用户（增加 `@PreAuthorize("hasRole('ADMIN')")`）。
  - `POST /users/`: 创建用户（增加 `@PreAuthorize("hasRole('ADMIN')")`）。
  - `PUT /users/{id}`: 编辑用户信息（新增接口，仅限管理员）。
  - `DELETE /users/{id}`: 删除用户（新增接口，仅限管理员）。
  - `PUT /users/{id}/reset-password`: 重置任意用户密码（仅限管理员）。
- **普通用户权限**：
  - `PUT /users/me/password`: 修改自己密码（保持现状，需登录）。

### 2.4 数据隔离逻辑
修改业务 Controller，根据当前登录用户角色过滤数据：
- **通用逻辑**：
  - 获取当前登录用户 ID。
  - 判断是否为管理员。
  - **管理员**：查询时不加 `userId` 过滤条件（查看所有）。
  - **普通用户**：查询时强制追加 `eq("userId", currentUserId)` 条件。
  - **创建数据**：强制设置 `data.setUserId(currentUserId)`。

涉及 Controller：
- `MediaController`: 列表查询、创建、更新。
- `CodeSlotController`: 列表查询、创建。
- `StatsController`: 统计数据查询（需从 mock 改为查库并过滤）。

## 3. 实施步骤

1.  **实体更新**: 修改 `Media.java`, `CodeSlot.java`, `Stats.java` 添加 `userId` 字段。
2.  **安全配置**: 更新 `SecurityConfig.java` 启用方法安全。
3.  **用户管理**: 更新 `UserController.java`，添加权限注解及管理接口。
4.  **数据隔离**:
    - 更新 `MediaController.java` 实现数据过滤与归属。
    - 更新 `CodeSlotController.java` 实现数据过滤与归属。
    - 更新 `StatsController.java` 实现基于用户的统计查询（从数据库获取真实数据）。

## 4. 验证计划
- 验证管理员可访问所有用户及数据。
- 验证普通用户仅能访问自己创建的媒体、广告位及相关统计数据。
- 验证权限拦截是否生效（普通用户访问管理接口应返 403）。
