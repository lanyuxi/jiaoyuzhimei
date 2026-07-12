# Task 4: Versioned Session Persistence

## Files

- `client/src/physics/sessions/types.ts`
- `client/src/physics/sessions/repository.ts`
- `client/src/physics/sessions/repository.test.ts`

## RED

Command:

```powershell
C:\Users\85120\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\vitest\vitest.mjs run src\physics\sessions\repository.test.ts
```

Result: exit code 1. Vitest collected no tests because `repository.test.ts` could not import the absent `./repository` module: `Cannot find module './repository'`.

## GREEN And Verification

Focused repository test command:

```powershell
C:\Users\85120\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\vitest\vitest.mjs run src\physics\sessions\repository.test.ts
```

Result: exit code 0; 1 test file passed, 9 tests passed.

Typecheck command:

```powershell
C:\Users\85120\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\typescript\bin\tsc -b
```

Result: exit code 0 in 89.4 seconds. An earlier run surfaced `TS1294` for a parameter property under `erasableSyntaxOnly`; it was changed to an explicit readonly field before the final passing run.

Full serial suite command:

```powershell
C:\Users\85120\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\vitest\vitest.mjs run --maxWorkers=1 --minWorkers=1
```

Result: exit code 0; 19 test files passed, 83 tests passed, duration 50.96 seconds.

## Self-Review

- Storage loading validates the entire v1 session shape. Invalid JSON and valid-but-invalid shapes are copied to the `-corrupt` key, the live key is removed, and the repository starts empty.
- `create`, append, completion, `get`, and `list` all retain or return cloned session data; tests prove callers cannot mutate repository-owned event or measurement arrays.
- Browser storage access is guarded so importing `browserPhysicsSessionRepository` in Vitest or SSR uses a module-local in-memory fallback rather than touching `window`.
- Storage write errors are intentionally best-effort: the current repository keeps the update in memory and does not throw.

## Concerns

- If browser storage is unavailable or full, current-instance changes cannot survive a new repository instance; this is deliberate resilience rather than a retry mechanism.
- The repository strictly supports version 1. Future migrations should explicitly transform recognized older versions instead of treating them as corrupt.

## Review Follow-up

### RED

Command (from `client`):

```powershell
C:\Users\85120\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\vitest\vitest.mjs run src\physics\sessions\repository.test.ts
```

Result: exit code 1; 1 test file failed, with 8 failing and 7 passing tests. The failures demonstrated the missing typed recovery result, no structured-condition validation, shallow condition cloning, duplicate session acceptance, lack of stale/unavailable state, and live-key deletion when corrupt backup writes fail.

### GREEN

Focused repository test command (from `client`):

```powershell
C:\Users\85120\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\vitest\vitest.mjs run src\physics\sessions\repository.test.ts
```

Result: exit code 0; 1 test file passed, 16 tests passed, duration 7.74 seconds.

Typecheck command (from `client`):

```powershell
C:\Users\85120\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\typescript\bin\tsc -b
```

Result: exit code 0, duration 86.2 seconds.

### Follow-up Scope

- Measurements now require and persist serializable `{ label, value }` experimental conditions. Condition arrays and entries are deep-cloned on append, load, list, and get.
- `recovery` exposes `empty`, `restored`, `malformed`, `stale`, `unavailable`, and `backup-failed` states with explicit backup and live-key retention flags. Task 6 remains responsible for presenting this result in the UI.
- Invalid payloads, including duplicate persisted IDs, are quarantined. The live key is deleted only after the `-corrupt` backup write succeeds; a backup failure preserves the original live key.
- The full serial suite was not used as a completion gate following the user's 2026-07-12 direction to complete after focused tests and typecheck pass; no full-suite command was running.

### Final Classification Regression

RED command (from `client`):

```powershell
C:\Users\85120\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\vitest\vitest.mjs run src\physics\sessions\repository.test.ts
```

Result: exit code 1; 1 test file failed, with 1 failing and 16 passing tests. The new nonnumeric-version test received `stale` instead of the required `malformed` result.

GREEN command (from `client`):

```powershell
C:\Users\85120\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\vitest\vitest.mjs run src\physics\sessions\repository.test.ts
```

Result: exit code 0; 1 test file passed, 17 tests passed, duration 7.54 seconds.

Final typecheck command (from `client`):

```powershell
C:\Users\85120\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\typescript\bin\tsc -b
```

Result: exit code 0, duration 91.8 seconds.

### Remaining Review Findings

#### RED

Focused repository test command (from `client`):

```powershell
C:\Users\85120\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\vitest\vitest.mjs run src\physics\sessions\repository.test.ts
```

Result: exit code 1; 1 test file failed, with 2 failing and 17 passing tests. The expected failures showed that a normal `storage.setItem` error left recovery at `empty`, and that `appendMeasurement` accepted empty conditions and non-finite numeric values without throwing. The new corrupt-backup/remove-failure regression passed before the production change because the existing quarantine ordering already preserved both live and backup copies with `backupCreated: true` and `liveKeyRetained: true`.

#### GREEN And Verification

Focused repository test command (from `client`):

```powershell
C:\Users\85120\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\vitest\vitest.mjs run src\physics\sessions\repository.test.ts
```

Result: exit code 0; 1 test file passed, 19 tests passed, duration 2.23 seconds.

Typecheck command (from `client`):

```powershell
C:\Users\85120\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\typescript\bin\tsc -b
```

Result: exit code 0, duration 50.9 seconds.

Full serial suite command (from `client`):

```powershell
C:\Users\85120\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe .\node_modules\vitest\vitest.mjs run --maxWorkers=1 --minWorkers=1
```

Result: exit code 0; 19 test files passed, 93 tests passed, Vitest duration 13.98 seconds.

#### Review Resolution

- A normal persistence write failure now exposes the existing typed `unavailable` recovery state, so callers can distinguish memory-only changes from normal storage availability.
- `appendMeasurement` rejects invalid persistence shapes with `TypeError('Measurement does not match the persistence schema')`. The validation requires at least one condition and finite numeric measurement or condition values, matching reload validation.
- The regression coverage now verifies that when a corrupt backup is written but removing the live key fails, both raw copies remain available and recovery reports `backupCreated: true` with `liveKeyRetained: true`.

### Final Task 4 Important Finding: Browser Storage Acquisition

#### RED

Focused repository test command (from `client`):

```powershell
$env:Path='C:\Users\85120\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;'+$env:Path; & .\node_modules\.bin\vitest.cmd run src/physics/sessions/repository.test.ts
```

Result: exit code 1; 1 test failed and 19 passed. The new test reproduced the browser `window.localStorage` getter throwing and received recovery status `empty` instead of the required `unavailable`.

#### GREEN And Verification

Focused repository test command (from `client`):

```powershell
$env:Path='C:\Users\85120\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;'+$env:Path; & .\node_modules\.bin\vitest.cmd run src/physics/sessions/repository.test.ts
```

Result: exit code 0; 1 test file passed, 20 tests passed.

Typecheck command (from `client`):

```powershell
$env:Path='C:\Users\85120\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;'+$env:Path; & .\node_modules\.bin\tsc.cmd -b
```

Result: exit code 0.

Full serial suite command (from `client`):

```powershell
$env:Path='C:\Users\85120\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin;'+$env:Path; & .\node_modules\.bin\vitest.cmd run --maxWorkers=1 --minWorkers=1
```

Result: exit code 0; 19 test files passed, 94 tests passed.

#### Resolution

- Browser `localStorage` acquisition failures now use an in-memory-backed storage whose read throws, allowing the existing repository load path to expose typed `recovery.status: 'unavailable'` while retaining current-instance in-memory behavior.
- SSR/non-browser imports continue using the ordinary in-memory storage fallback.
- The regression test uses Vitest global stubbing and restores globals and modules in `finally`; no global mutation is retained for other tests.
- Task 6 UI work was not implemented.
