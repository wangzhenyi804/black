# Plan: Import Third-Party Ad Platform Stats CSV

## Goal
Implement a feature to batch import statistical data from a specific third-party ad platform CSV file format. The system must map the CSV fields to the internal `Stats` entity, linking records to existing `CodeSlot` entities by name, and calculating revenue based on configured ratios.

## Current State Analysis
- **Backend**:
  - `StatsController` has an `/import` endpoint that expects a specific CSV format matching the internal entity fields (`date`, `codeSlotId`, `impressions`, `clicks`, `income`).
  - `CodeSlot` entity has `name`, `revenueRatio` but no `external_id`.
  - `CsvUtils` provides basic CSV parsing but retains enclosing quotes in values, which is suboptimal for standard CSVs.
- **Frontend**:
  - Admin dashboard likely uses the existing import feature.
- **Data**:
  - CSV Format: `"计费名","代码位ID","代码位","网站ID","媒体(域名)","时间","展现","点击","收入",...`
  - Mapping Requirements:
    - `时间` -> `date`
    - `代码位` (Name) -> Link to `CodeSlot` by `name`.
    - `展现` -> `impressions`
    - `点击` -> `clicks`
    - `收入` -> `preRevenue` (Pre-share income)
    - `CodeSlot.revenueRatio` -> `ratio`
    - `preRevenue * ratio` -> `revenue` (Final income)

## Proposed Changes

### 1. Utility Enhancement: `CsvUtils.java`
- Update `parseCsvLine` method to correctly handle standard CSV quoting:
  - Remove enclosing quotes from values (e.g., `"abc"` -> `abc`).
  - Unescape double quotes (e.g., `""` -> `"`).
  - Trim whitespace around values.
- Add BOM (Byte Order Mark) handling to `parseCsv` to avoid issues with Excel-exported CSVs.

### 2. Service Layer: `CodeSlotService`
- Add a method `CodeSlot getByName(String name)` to facilitate looking up code slots by the name provided in the CSV.
- Implement caching (optional but good for performance) or batch lookup if possible, but simple lookup is fine for now.

### 3. Controller Layer: `StatsController.java`
- Modify `importStats` method to support the new CSV format.
- **Detection Logic**: Check if the CSV header contains specific keywords (e.g., `代码位`, `计费名`) to identify the third-party format.
- **Mapping Logic**:
  - If third-party format is detected:
    - Parse rows.
    - For each row, extract `代码位` (Name).
    - Lookup `CodeSlot` by name.
      - If found: Use its `id`, `userId`, `mediaId`, `revenueRatio`.
      - If not found: Log a warning and skip the row (or track as failure).
    - Map `时间` to `date`.
    - Map `展现` to `impressions`, `点击` to `clicks`.
    - Map `收入` to `preRevenue`.
    - Calculate `revenue = preRevenue * ratio`.
    - Store other fields (`计费名`, `代码位ID`, `网站ID`, `媒体(域名)`, etc.) in `extraData` as JSON.
  - If standard format (existing logic), proceed as before.
- **Response**: Return a summary of successful imports and failures (e.g., "Imported X records, Y failed (CodeSlot not found)").

## Verification Plan
1. **Unit Test**: Create a test CSV file matching the third-party format.
2. **Integration Test**:
   - Create a `CodeSlot` with a specific name (e.g., "dz03信息流_260306_1") and ratio (e.g., 0.5).
   - Call `/stats/import` with the test CSV.
   - Verify `Stats` record is created with:
     - Correct `code_slot_id`.
     - `preRevenue` = CSV Income.
     - `revenue` = CSV Income * 0.5.
     - `extraData` contains the original extra fields.
3. **Manual Verification**: Use the provided CSV file content to test the import via `curl` or UI.
