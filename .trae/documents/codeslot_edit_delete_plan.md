# Plan: Implement CodeSlot Edit and Delete Functionality

## Goal
Enable "Edit" and "Delete" functionality for CodeSlots in the frontend, restricted strictly to Administrator users.

## Current State Analysis
-   **Frontend (`CodeSlots.tsx`)**:
    -   The "Edit" (`Settings2`) and "Delete" (`Trash2`) buttons exist in the UI but have no `onClick` handlers.
    -   The "Get Code" (`Code`) button also lacks functionality.
    -   Admin status (`isAdmin`) is available via `useAuth()`.
    -   There is an existing `isModalOpen` state and `formData` state used for creating new slots.
-   **Backend**:
    -   `CodeSlotController` already has `updateCodeSlot` (`PUT /codeslots/{id}`) and `deleteCodeSlot` (`DELETE /codeslots/{id}`).
    -   These endpoints are protected with `@PreAuthorize("hasRole('ADMIN')")`.

## Proposed Changes

### 1. Frontend: Add Logic for Edit/Delete (Admin Only)
-   **File**: `CodeSlots.tsx`
-   **UI Changes**:
    -   **Visibility**: Only show the "Edit" and "Delete" buttons if `isAdmin` is true. (Regular users see nothing or disabled buttons - based on strict requirement, hiding is better).
    -   **Get Code**: Wire up the "Get Code" button for all users (assuming regular users need to see their code).
-   **Logic Changes**:
    -   **Edit**:
        -   Create `handleEdit(slot: CodeSlot)` function.
        -   Populate `formData` with the slot's data.
        -   Open the modal (`setIsModalOpen(true)`).
        -   **Crucial**: Update `handleSubmit` to handle **Update** (PUT) vs **Create** (POST). We need a way to know if we are editing (e.g., check if `formData.id` exists or add an `editingId` state).
    -   **Delete**:
        -   Create `handleDelete(id: number)` function.
        -   Show a confirmation prompt (`window.confirm` or a modal).
        -   Call `api.delete('/codeslots/' + id)`.
        -   Refresh the list (`fetchSlots`).
    -   **Get Code**:
        -   Create `handleGetCode(code: string)` function.
        -   Set `currentCode` and open `isCodeModalOpen`.

### 2. Frontend: Refactor Modal/Form Handling
-   **State**: Add `editingId` state (number | null).
-   **Submit**:
    -   If `editingId` is set: Call `api.put`.
    -   If `editingId` is null: Call `api.post`.
    -   Reset `editingId` on close.

## Implementation Steps
1.  **Update `CodeSlots.tsx`**:
    -   Add `editingId` state.
    -   Implement `handleEdit`, `handleDelete`, `handleGetCode`.
    -   Modify `handleSubmit` to switch between POST and PUT.
    -   Update the table row rendering to conditionally show buttons based on `isAdmin`.
    -   Bind the buttons to the new handlers.

## Verification
-   **Admin**:
    -   Can see Edit/Delete buttons.
    -   Clicking Edit opens modal with data; saving updates the record.
    -   Clicking Delete removes the record (after confirmation).
    -   Clicking Code shows the code.
-   **Normal User**:
    -   **Cannot** see Edit/Delete buttons.
    -   Can see "Get Code" button.
