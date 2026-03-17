# Tasks

- [x] Task 1: Refactor User Interface and Data Handling
  - [x] SubTask 1.1: Update `User` and `EditUserForm` interfaces in `Users.tsx` to use `isActive` instead of `is_active`.
  - [x] SubTask 1.2: Update mapping logic in `handleEdit` to use `isActive`.
- [x] Task 2: Optimize Role and Status Rendering in Table
  - [x] SubTask 2.1: Replace hardcoded role labels with a mapping function that handles `'admin'`, `'user'`, and fallback values.
  - [x] SubTask 2.2: Update account status rendering to use `u.isActive`.
- [x] Task 3: Verification
  - [x] SubTask 3.1: Verify role column shows correct Chinese labels for admin/user and raw values for others.
  - [x] SubTask 3.2: Verify status column correctly reflects `isActive` boolean from backend.
