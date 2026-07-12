# Task 2 Report: Split textbook and legacy catalogs

## Status

Implemented. The commit contains only the Task 2 owned production, dependency, and test files. The ignored report is intentionally not staged.

## Implementation

- Added `TextbookPhysicsCatalog` with curriculum filters, a directory rail, compact controls, four-column results, Lucide icons, available lab links, and non-navigating scheduled cards.
- Extracted the complete legacy catalog, including cover artwork, filters, and `/physics/:slug` links, into `LegacyPhysicsCatalog`.
- Replaced `PhysicsHome` with URL-backed `catalog=textbook|extended` tabs; textbook is the default.
- Added `lucide-react@^1.24.0` and updated the source assertions that intentionally moved into the legacy component.

## RED Evidence

Inherited handoff evidence: `src/physicsCatalog.test.ts` failed because `src/physics/TextbookPhysicsCatalog.tsx` did not exist. This was the required failing-test state before the handoff implementation.

## GREEN Evidence

- `node.exe .\\node_modules\\vitest\\vitest.mjs run src/physicsCatalog.test.ts src/physics/curriculum/catalog.test.ts src/physicsIntegration.test.ts --maxWorkers=1`: 3 files, 9 tests passed.
- `node.exe .\\node_modules\\typescript\\bin\\tsc -b`: passed after removing one unused `useMemo` import from the handed-off component.
- The asset-localization test passes alone in 0.8 seconds and in the serial focused run in 0.4 seconds; no timeout adjustment was made.

## Full Suite

`pnpm.cmd test -- --maxWorkers=1` completed with 67 of 68 tests passing. The sole failure is `src/catalogCoverStyle.test.ts`, which still reads `PhysicsHome.tsx` and expects `PhysicsCover` and `PhysicsCoverArtwork` there. The extraction correctly moved those functions to `LegacyPhysicsCatalog.tsx`; that test is outside the Task 2 ownership list and was not modified.

## Self-Review

- `git diff --check` passed.
- The focused integration test retains all 133 legacy experiment assertions and passes.
- No unrelated files were staged or changed.

## Follow-up Regression Fix

- Updated `client/src/catalogCoverStyle.test.ts` to read `physics/LegacyPhysicsCatalog.tsx`, the intentional owner of the moved physics cover functions. All visual-card assertions are unchanged.
- Verification commands and results:
  - `node.exe .\\node_modules\\vitest\\vitest.mjs run src/catalogCoverStyle.test.ts src/physicsCatalog.test.ts src/physics/curriculum/catalog.test.ts src/physicsIntegration.test.ts --maxWorkers=1`
    - Passed: 4 files, 11 tests.
  - `node.exe .\\node_modules\\typescript\\bin\\tsc -b`
    - Passed with exit code 0.
  - `pnpm.cmd test -- --maxWorkers=1`
    - Passed: 17 files, 68 tests.

## Review Follow-up: Behavior Regression Coverage

- Verified the Task 1 data boundary before changing production code: all 65 textbook records are `scheduled`, so no card currently exposes the future `/physics/labs/:id` destination. Task 3 remains responsible for registering that route and rendering its detail page.
- Replaced the source-string-only catalog test with four behavior tests covering:
  - default textbook mode and `catalog=extended` URL serialization;
  - the current 65 scheduled cards having no navigation target;
  - the future available-card target convention (`/physics/labs/:id`) without asserting route registration;
  - volume selection resetting the chapter and deriving chapter options from the selected volume.
- Added `physics/catalogState.ts` as shared UI state/navigation logic used by `PhysicsHome` and `TextbookPhysicsCatalog`; it is not a test-only API.

## Review Follow-up Verification

### RED

- `& 'C:\Program Files\Adobe\Adobe Creative Cloud Experience\libs\node.exe' .\node_modules\vitest\vitest.mjs run src\physicsCatalog.test.ts --maxWorkers=1`
  - Failed as intended before production changes: `Cannot find module './physics/catalogState' imported from src/physicsCatalog.test.ts`.

### GREEN

- `& 'C:\Program Files\Adobe\Adobe Creative Cloud Experience\libs\node.exe' .\node_modules\vitest\vitest.mjs run src\physicsCatalog.test.ts --maxWorkers=1`
  - Passed: 1 file, 4 tests.
- `& 'C:\Program Files\Adobe\Adobe Creative Cloud Experience\libs\node.exe' .\node_modules\vitest\vitest.mjs run src\physicsCatalog.test.ts src\physics\curriculum\catalog.test.ts src\physicsIntegration.test.ts src\catalogCoverStyle.test.ts --maxWorkers=1`
  - Passed: 4 files, 14 tests.
- `& 'C:\Program Files\Adobe\Adobe Creative Cloud Experience\libs\node.exe' .\node_modules\typescript\bin\tsc -b`
  - Passed with exit code 0 in 101.7 seconds.
- `& 'C:\Program Files\Adobe\Adobe Creative Cloud Experience\libs\node.exe' .\node_modules\vitest\vitest.mjs run --maxWorkers=1`
  - Passed: 17 files, 71 tests in 56.32 seconds.
