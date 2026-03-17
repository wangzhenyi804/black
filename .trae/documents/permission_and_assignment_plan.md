# Plan: Enhance Permission Control and User Assignment

## Goal
Implement stricter permission controls for normal users and allow administrators to assign code slots to specific users.

1.  **Requirement 1 (Admin Assignment)**: When an admin creates a code slot, they must be able to select the owner (any user in the system) via a dropdown. The default owner is the admin themselves.
2.  **Requirement 2 (Access Control)**: Normal users must NOT have access to "Media Management" (`/media`), "Code Slot Management" (`/codeslots`), or "User Management" (`/users`). They should only access "Dashboard" (`/dashboard`), "Data Overview" (`/data-overview`), and "Code Slot Data" (`/codeslot-data`). This must be enforced on both frontend (menu hiding) and backend (API protection).

## Current State Analysis
-   **Backend**:
    -   `CodeSlotController.createCodeSlot`: Currently assigns `userId` from the logged-in user (`userDetails`). No option to specify another user.
    -   `UserController`: Has endpoints to list users, but `getAllUsers` is restricted to admins.
    -   `MediaController` / `CodeSlotController`: `get` methods filter data by `userId` for normal users, but do not strictly forbid access to the *endpoints* themselves (just return empty/filtered lists).
-   **Frontend**:
    -   `CodeSlots.tsx`: "Add Code Slot" modal does not have a user selection field.
    -   `Layout.tsx`: Displays all menus to everyone except "User Management" (admin only).
    -   `App.tsx`: No role-based route protection, only login authentication.

## Proposed Changes

### 1. Backend: Allow Admin to Assign Code Slot Owner
-   **File**: `CodeSlotController.java`
-   **Change**: Update `createCodeSlot` method.
    -   Check if the request body contains a `userId`.
    -   If the current user is `admin` AND `userId` is provided, use that `userId`.
    -   Verify the target `userId` exists.
    -   If not admin or `userId` is null, default to current user's ID.

### 2. Backend: Enforce API Access Control
-   **File**: `MediaController.java`, `CodeSlotController.java`, `UserController.java`
-   **Change**: Add `@PreAuthorize("hasRole('ADMIN')")` to management endpoints that normal users shouldn't touch *if strict blocking is required*.
    -   *Correction*: The requirement says "Normal users cannot have Media/CodeSlot Management **interfaces**".
    -   For `CodeSlotController` and `MediaController`, normal users *do* need read access to some extent?
        -   Wait, user said "Normal users need to see their own data (Dashboard, Data Overview, Code Slot Data)".
        -   "Code Slot **Data**" (`/codeslot-data`) is different from "Code Slot **Management**" (`/codeslots`).
        -   So, strictly block `/media` and `/codeslots` (management APIs) for normal users?
        -   **Refinement**: If `/codeslot-data` page relies on `/stats/codeslots` API, that's fine. But if it relies on `/codeslots` API, we can't block it entirely.
        -   *Assumption*: "Code Slot Management" = CRUD operations. "Code Slot Data" = Read-only stats.
        -   I will restrict `POST`, `PUT`, `DELETE` on `/media` and `/codeslots` to ADMIN only.
        -   For `GET /media` and `GET /codeslots`, since the user said "Normal users cannot have ... interfaces", I should probably block them or just ensure the frontend doesn't link there.
        -   *Decision*: I will enforce `@PreAuthorize("hasRole('ADMIN')")` on the *entire* `MediaController` and `CodeSlotController` (except perhaps export/import if needed for data view? No, data view usually uses `StatsController`).
        -   *Verification*: Check `CodeSlotData.tsx` (frontend) to see which API it calls. If it calls `StatsController`, then `CodeSlotController` can be admin-only.

### 3. Frontend: "Add Code Slot" User Selection (Admin Only)
-   **File**: `CodeSlots.tsx`
-   **Change**:
    -   Fetch all users (`/users`) if `isAdmin` is true.
    -   Add a "Owner" (归属人) dropdown in the "Add Code Slot" modal.
    -   Pass the selected `userId` to the create API.

### 4. Frontend: Hide Menus & Protect Routes
-   **File**: `Layout.tsx`
-   **Change**: Filter the sidebar menu items.
    -   Hide "Media Management" (`/media`) and "Code Slot Management" (`/codeslots`) for non-admins.
    -   Keep "Dashboard", "Data Overview", "Code Slot Data".
-   **File**: `App.tsx`
-   **Change**: Create an `AdminRoute` component (wrapper around `PrivateRoute` + role check).
    -   Wrap `/media`, `/codeslots`, `/users` with `AdminRoute`.

## Implementation Steps
1.  **Backend API Access**:
    -   Modify `CodeSlotController.java`: Update `createCodeSlot` to handle `userId` assignment (Admin only).
    -   Modify `CodeSlotController.java` & `MediaController.java`: Add permission checks. (Wait, let's verify `CodeSlotData.tsx` dependency first in execution phase. If it depends on `CodeSlotController`, I'll just restrict mutations).
2.  **Frontend Route & Menu**:
    -   Update `Layout.tsx` to hide menus.
    -   Update `App.tsx` to add `AdminRoute`.
3.  **Frontend Code Slot Creation**:
    -   Update `CodeSlots.tsx` to add User Select dropdown.

## Verification
-   **Admin**:
    -   Can see all menus.
    -   Can access `/codeslots`.
    -   Can select a user when creating a code slot.
    -   Created slot belongs to the selected user.
-   **Normal User**:
    -   Cannot see "Media", "Code Slots", "Users" in sidebar.
    -   Direct access to `/media` redirects to dashboard or shows 403.
    -   Can still access Dashboard and Data pages.
