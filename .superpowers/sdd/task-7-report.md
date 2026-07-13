# Task 7 Report: 比较不同物质的吸热能力

## RED Evidence

- Added `client/src/physics/labs/heat-capacity/controller.test.ts` before production files existed.
- Direct Vitest execution failed because `./controller` did not exist.
- After the controller was implemented, the remaining registration/catalog assertion failed as expected because no lab was registered and no catalog item was available.
- The first serial full-suite run then identified the previous all-scheduled catalog assertion in `client/src/physicsCatalog.test.ts`; it was updated to the Task 7 contract and rerun.

## GREEN Evidence

- Focused command:
  `node node_modules/vitest/vitest.mjs run src/physics/labs/heat-capacity/controller.test.ts src/physicsLabShell.test.ts src/physics/curriculum/catalog.test.ts`
  passed 3 files and 21 tests.
- Focused catalog-state command:
  `node node_modules/vitest/vitest.mjs run src/physicsCatalog.test.ts`
  passed 1 file and 4 tests.
- `node node_modules/typescript/bin/tsc -b` passed with exit code 0.

## Full Evidence

- Serial command:
  `node node_modules/vitest/vitest.mjs run --no-file-parallelism`
  passed 25 files and 134 tests in 19.63 seconds.

## Changed Files

- `client/src/physics/labs/heat-capacity/definition.ts`
- `client/src/physics/labs/heat-capacity/controller.ts`
- `client/src/physics/labs/heat-capacity/controller.test.ts`
- `client/src/physics/labs/heat-capacity/HeatCapacityScene.tsx`
- `client/src/physics/labs/registry.ts`
- `client/src/physics/curriculum/catalog.ts`
- `client/src/physicsCatalog.test.ts`

## Self Review

- The controller uses exact `Q = cmΔT` calculations with water `4200 J/(kg·°C)` and cooking oil `2100 J/(kg·°C)`.
- Start, tick, stop, record, and reset-trial operations are guarded; trial values are frozen snapshots and session measurements are only derived from the active recorded trial.
- The scene uses `PhysicsLabShell`, normalized `usePointerDrag` drop actions with cancellation, semantic command actions, accessible numeric mass steppers, and a cleaned-up one-second timer effect.
- Only `heat-capacity-comparison` is available and registered; all other catalog records remain scheduled.

## Concerns

- No remaining automated test or typecheck concern. The available local Node runtime was not on the default PATH, so all verification used its explicit Codex runtime path.
- A hidden Vite process stayed alive but did not accept HTTP connections on `127.0.0.1:5175`; the dev-server endpoint was therefore not used as completion evidence.

## Review Fix Evidence

- RED: `controller.test.ts`, `usePointerDrag.test.ts`, and the new `timing.test.ts` were run before the implementation. They failed for the intended reasons: a stopped, heated trial still accepted a mass change; pointer cancellation emitted `dragEnd`; and the timing helper did not exist.
- Focused command: `C:\Users\85120\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules/vitest/vitest.mjs run src/physics/labs/heat-capacity/controller.test.ts src/physics/labs/heat-capacity/timing.test.ts src/physics/runtime/usePointerDrag.test.ts src/physicsLabShell.test.ts src/physics/curriculum/catalog.test.ts src/physicsCatalog.test.ts` passed 6 files and 31 tests in 3.78 seconds.
- Typecheck: `C:\Users\85120\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules/typescript/bin/tsc -b` passed with exit code 0.
- Full serial suite: `C:\Users\85120\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe node_modules/vitest/vitest.mjs run --no-file-parallelism` passed 26 files and 138 tests in 19.81 seconds.
- Review coverage now includes: locked-until-reset mass integrity plus recording revalidation; distinct `dragCancel` dispatch and no apparatus placement on cancellation; each explicit snap zone's inside/outside drop path; fractional monotonic timestamp deltas; delayed-callback clamping; and stale interval cleanup.
