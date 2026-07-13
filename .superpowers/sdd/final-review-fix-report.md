# Stage A Final Review Fix Report

Date: 2026-07-13
Branch: `codex/physics-curriculum-stage-a`

## Scope

Implemented all five Important final-review findings while preserving the existing responsive, catalog, legacy, and Pages work. No changes were made to `.superpowers/sdd/task-10-report.md` or `.superpowers/sdd/progress.md`.

## TDD Evidence

The first focused RED run covered the session repository, runtime reducer and hook, all three Stage A controllers, and the PhysicsLabShell contract. It failed as expected with 13 failures across 7 files because the new synchronization, hydration, snapshot, report, and hit-target contracts did not exist.

Command:

```powershell
& 'C:\Users\85120\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run 'src\physics\sessions\repository.test.ts' 'src\physics\runtime\reducer.test.ts' 'src\physics\runtime\useLabRuntime.test.ts' 'src\physics\labs\heat-capacity\controller.test.ts' 'src\physics\labs\series-parallel\controller.test.ts' 'src\physics\labs\electromagnetic-induction\controller.test.ts' 'src\physicsLabShell.test.ts' --maxWorkers=1 --no-file-parallelism
```

RED result: 7 failed files, 13 failed tests, 89 passed tests.

After the first implementation pass, the same focused command passed 7 files and 102 tests. Diff review then identified two compatibility and validation risks, so focused RED tests were added for legacy sessions containing repeated appended rows and semantically invalid snapshots in all three controllers.

Second RED result: 4 failed files, 4 failed tests, 69 passed tests.

After those fixes, the focused subset passed 4 files and 73 tests. A final mobile geometry review added a circuit-terminal overlap regression test.

Third RED result: 1 failed file, 1 failed test, 15 passed tests.

The circuit hit areas were changed to one-sided transparent non-scaling stroke segments. Final focused GREEN result: 7 files and 103 tests passed.

## Implementation

- Added backward-compatible optional JSON-safe `runtimeSnapshot` and structured `report` fields to `PhysicsSession`.
- Extended `LabController` with controller-owned `snapshot`, validated `restore`, complete `measurementGroups`, and lab-specific `report` APIs.
- Added runtime hydration and made undo, redo, reset, and hydrate return their next runtime state.
- Added one atomic repository `synchronize` operation that validates and deep-clones a controller-derived snapshot, complete measurement rows, and report before one persistence write.
- Made completion apply the same synchronization payload before setting the session status, preventing empty completed sessions.
- Made PhysicsLabShell synchronize accepted semantic transitions and toolbar next states immediately. Undo and global reset now replace stale rows; explicit recording is idempotent; trial reset can retain prior trials.
- Preserved safe initial-state behavior for legacy sessions without snapshots and kept legacy repeated measurement rows loadable.
- Rendered the fixed report sections for purpose, apparatus, operation log, raw data, calculated results, conclusion, error analysis, and supplement from persisted structured content.
- Added lab-specific calculations and conclusions for heat capacity, series/parallel circuits, and electromagnetic induction.
- Added transparent non-scaling SVG hit targets for the circuit terminals and induction conductor without changing visible geometry. Circuit terminal segments remain at least 40 by 40 CSS pixels at the tested mobile scale and do not overlap.

## Verification

- Focused Stage A suite: 7 files, 103 tests passed.
- Full serial Vitest suite: 29 files, 195 tests passed.
- TypeScript: `tsc -b` passed with no diagnostics.
- Course integrity: 55 course configs complete.
- Standard Vite production build: passed, 3965 modules transformed.
- GitHub Pages Vite production build with `GITHUB_PAGES=true`: passed, 3965 modules transformed.
- Protected SDD files: no diff.

## Concerns

No task-blocking concerns remain. Both Vite builds retain the repository's existing warning about a mixed static/dynamic `BasicArithmetic` import and chunks larger than 1500 kB; this change did not introduce or expand those warnings.
