# Plan: Implement Media Edit and Delete Functionality

## Goal
Enable "Edit" and "Delete" functionality for Media in the frontend, restricted strictly to Administrator users.

## Current State Analysis
-   **Frontend (`Media.tsx`)**:
    -   The "More" (`MoreVertical`) button exists in the UI but has no `onClick` handler.
    -   Admin status (`isAdmin`) is available via `useAuth()`.
    -   There is an existing `isModalOpen` state and `formData` state used for creating new media.
-   **Backend**:
    -   `MediaController` has `updateMedia` (`PUT /media/{id}`) but lacks `deleteMedia` (`DELETE /media/{id}`).
    -   `updateMedia` is protected with `@PreAuthorize("hasRole('ADMIN')")`.

## Proposed Changes

### 1. Backend: Add Delete Endpoint
-   **File**: `MediaController.java`
-   **Change**: Add `deleteMedia` method.
    -   `@DeleteMapping("/{id}")`
    -   `@PreAuthorize("hasRole('ADMIN')")`
    -   Logic: Check existence, delete via service.

### 2. Frontend: Add Logic for Edit/Delete (Admin Only)
-   **File**: `Media.tsx`
-   **UI Changes**:
    -   Replace the static `MoreVertical` button with action buttons (Edit/Delete) visible only to admins.
    -   Or keep `MoreVertical` but make it a functional dropdown (requires more UI work), or simply replace it with direct icons like `CodeSlots.tsx` for consistency. **Decision**: Use direct icons (Settings2, Trash2) for consistency with `CodeSlots.tsx`.
-   **Logic Changes**:
    -   **Edit**:
        -   Create `handleEdit(media: Media)` function.
        -   Populate `formData` with the media's data.
        -   Open the modal (`setIsModalOpen(true)`).
        -   **Crucial**: Update `handleSubmit` to handle **Update** (PUT) vs **Create** (POST). Add `editingId` state.
    -   **Delete**:
        -   Create `handleDelete(id: number)` function.
        -   Show a confirmation prompt.
        -   Call `api.delete('/media/' + id)`.
        -   Refresh the list (`fetchMedia`).

### 3. Frontend: Refactor Modal/Form Handling
-   **State**: Add `editingId` state (number | null).
-   **Submit**:
    -   If `editingId` is set: Call `api.put`.
    -   If `editingId` is null: Call `api.post`.
    -   Reset `editingId` on close.

## Implementation Steps
1.  **Backend**: Add `deleteMedia` to `MediaController`.
2.  **Frontend (`Media.tsx`)**:
    -   Add `editingId` state.
    -   Implement `handleEdit`, `handleDelete`.
    -   Modify `handleSubmit` to switch between POST and PUT.
    -   Update the table row rendering to show Edit/Delete buttons only for `isAdmin`.

## Verification
-   **Admin**:
    -   Can see Edit/Delete buttons.
    -   Clicking Edit opens modal with data; saving updates the record.
    -   Clicking Delete removes the record.
-   **Normal User**:
    -   **Cannot** see Edit/Delete buttons.
