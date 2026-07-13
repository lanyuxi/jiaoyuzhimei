# Task 7 Snap-Coordinate Report

## Root Cause

`HeatCapacityScene` converted stage-local drag coordinates by the full flex-stage width and height. The SVG paints a 960 by 540 viewBox with `xMidYMid meet`, so controls and centered letterbox margins were treated as part of the experimental workbench. Visible snap zones and drop coordinates therefore diverged.

## Implementation

- Added `mapClientPointToSvgViewBox`, a pure runtime helper that uses the SVG bounding rect, viewBox dimensions, `meet` scale, and centered X/Y letterbox offsets.
- Added an opt-in `positionFor` mapper to `usePointerDrag`. It is applied to start, move, end, and cancel events without changing pointer capture, cancellation, or multi-pointer ownership.
- `HeatCapacityScene` reads the rendered SVG rect and dispatches its already-mapped viewBox position directly to the heat controller. Experiment-specific snap zones remain in the heat controller.

## TDD Evidence

1. Red: `svgCoordinates.test.ts` failed with `Cannot find module './svgCoordinates'` before the helper existed.
2. Red: `usePointerDrag.test.ts` failed the mapper assertion, receiving the former stage coordinates `{ x: 20, y: 30 }` instead of `{ x: 1200, y: 800 }`.
3. Green: the new mapper and pointer tests passed: 2 files, 8 tests.

The geometry tests cover horizontal and vertical letterboxing, no letterboxing, an inclusive visible snap-zone edge, and an adjacent invisible letterbox point that maps outside the zone.

## Focused Verification

Ran serially with the bundled Codex runtime because this shell does not expose `node` on PATH:

```powershell
& 'C:\Users\85120\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' '.\node_modules\vitest\vitest.mjs' run --maxWorkers=1 --minWorkers=1 src/physics/labs/heat-capacity/controller.test.ts src/physics/labs/heat-capacity/timing.test.ts src/physics/runtime/geometry.test.ts src/physics/runtime/reducer.test.ts src/physics/runtime/svgCoordinates.test.ts src/physics/runtime/useLabRuntime.test.ts src/physics/runtime/usePointerDrag.test.ts src/physicsCatalog.test.ts src/physics/curriculum/catalog.test.ts
```

Result: 9 test files passed, 47 tests passed.

## Remaining Verification

- A first `tsc -b` surfaced only two nullability assertions in the new test; those were corrected.
- The replacement `tsc -b` and full serial suite were intentionally not completed after the user requested that broad checks stop. They are not claimed as passing.
