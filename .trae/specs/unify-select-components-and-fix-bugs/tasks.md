# Tasks

- [ ] Task 1: Analyze and Fix Select Component Bugs
  - [ ] SubTask 1.1: Review `Select.tsx` code for potential issues (e.g., z-index, click outside logic, value type matching).
  - [ ] SubTask 1.2: Add necessary improvements to `Select.tsx` (e.g., ensure `z-index` is high enough to not be covered by table headers, handle `className` prop merging correctly).
- [ ] Task 2: Refactor DataOverview.tsx
  - [ ] SubTask 2.1: Replace "Terminal Type" native select with `Select` component.
  - [ ] SubTask 2.2: Replace "Display Type" native select with `Select` component.
  - [ ] SubTask 2.3: Update state handlers to accept direct value instead of event object.
- [ ] Task 3: Refactor CodeSlotData.tsx
  - [ ] SubTask 3.1: Replace "Terminal Type" native select with `Select` component.
  - [ ] SubTask 3.2: Replace "Display Type" native select with `Select` component.
  - [ ] SubTask 3.3: Update state handlers to accept direct value.
- [ ] Task 4: Refactor Pagination.tsx
  - [ ] SubTask 4.1: Replace page size native select with `Select` component.
  - [ ] SubTask 4.2: Adjust `Select` component styling or props to fit the compact pagination layout (small size).
- [ ] Task 5: Verification
  - [ ] SubTask 5.1: Verify all dropdowns open/close correctly.
  - [ ] SubTask 5.2: Verify selection triggers the correct data updates (filtering/pagination).
  - [ ] SubTask 5.3: Check for any visual regressions (z-index issues, overflow clipping).
