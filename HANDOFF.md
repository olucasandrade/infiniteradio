# Signal Space expansion handoff

## Mission

Continue the existing implementation of `PLAN.md` Section 21, "Post-MVP expansion: Signal Space and focus stations." Do not restart the design or replace the existing engines. The seven station implementations and the Three.js scene are already present, but the expansion is not verified or release-ready.

The previous coding agent stopped because its usage window ended. Its last reported activity was fixing failing web tests before browser verification and final documentation.

## Important working-tree warning

The repository already contained substantial uncommitted and staged baseline work before the expansion agent started. Many files appear as `A` or `AM` in `git status`, so the diff is not a clean agent-only changeset.

Do not run `git reset`, `git clean`, broad checkout commands, or otherwise discard existing work. Do not commit or push unless the user explicitly requests it. Preserve all current files and make targeted changes.

## Source of truth

Read these first:

1. This handoff.
2. `PLAN.md`, especially the current expansion directive and Section 21.
3. `docs/architecture.md`, `docs/audio-engine.md`, `docs/station-system.md`, and `docs/design-system.md`.
4. The current implementation and tests named below.

Section 21 remains the acceptance contract. This handoff records implementation and verification state; it does not weaken the acceptance criteria.

## Implementation already present

### Domain, registry, and persistence

- Seven ordered station IDs are defined in `packages/shared/src/types/station.ts`:
  `weightless`, `hip-hop`, `blue-notes`, `neo-soul`, `vaporwave`, `indie`, `after-hours`.
- Existing IDs, including `blue-notes`, are preserved.
- Station accents and visual-profile types have been extended.
- Episode constraints and catalog entries include optional swing, rhythmic-density, and texture traits.
- Shared preference tests pass, including expanded station validation.

### Stations and catalogs

The following definitions exist and are registered:

- `packages/stations/src/definitions/hip-hop.ts`: Low End, instrumental hip-hop.
- `packages/stations/src/definitions/neo-soul.ts`: Velvet, neo-soul.
- `packages/stations/src/definitions/vaporwave.ts`: Vapor Trails, vaporwave.
- `packages/stations/src/definitions/indie.ts`: Open Window, instrumental indie.
- `packages/stations/src/definitions/blue-notes.ts`: refined toward jazz while preserving its ID, moods, and parameter names.
- Existing Weightless and After Hours definitions have episode-trait integration.

Each station has three moods, four customization parameters, artwork, and a reference catalog. New catalogs live in:

- `packages/stations/src/catalog/low-end.ts`
- `packages/stations/src/catalog/velvet.ts`
- `packages/stations/src/catalog/vaporwave.ts`
- `packages/stations/src/catalog/indie.ts`

The catalog tests confirm at least 20 unique entries per station, valid trait ranges, deterministic rotations, and episode propagation. This does not prove that titles, years, keys, modes, or subjective traits are musically accurate; manual catalog review is still required.

### Audio and composition support

- Native guitar-string synthesis exists in `packages/audio-engine/src/instruments/guitar.ts`.
- Pad modulation supports the vaporwave wobble behavior.
- Instrument registration and episode scheduling have been extended.
- New station tests check separate event signatures, deterministic generation, episode traits, and all four controls per new station.
- Shared, composition-engine, audio-engine, and stations test suites pass.

These tests demonstrate musical event behavior, not perceived audio quality. No human listening sign-off has been recorded.

### Signal Space and application integration

- `apps/web/src/features/scene/signalScene.ts` implements the Three.js r186 procedural scene.
- `apps/web/src/features/scene/visualProfiles.ts` defines profiles for all seven stations.
- `apps/web/src/features/scene/SceneCanvas.tsx` handles dynamic loading, settings, initialization failure, context loss, and disposal.
- `apps/web/src/components/layout/AppShell.tsx` mounts the scene and coordinates the 2D fallback.
- `apps/web/src/components/visualizer/Visualizer.tsx` can be suspended while the 3D scene is active.
- Discovery renders seven stations and previous/next navigation uses the expanded order.
- `three` and `@types/three` are pinned to `0.186.0` in `apps/web/package.json`.
- `apps/web/tests/scene.test.tsx` covers mocked scene lifecycle behavior.

The scene code uses `THREE.Timer`, `setAnimationLoop`, damped profile changes, direct analyser sampling, reusable buffers, resize handling, reduced motion, pause settling, visibility handling, and resource disposal. Real WebGL quality, performance, and lifecycle behavior still need browser verification.

## Verification results from this handoff audit

### `pnpm test`

Failed. Package suites pass:

- Shared: 10 tests passed.
- Audio engine: 40 tests passed.
- Composition engine: 37 tests passed.
- Stations: 50 tests passed.

Web: 52 passed, 2 failed.

Known failures:

1. `apps/web/tests/app-flow.test.tsx:163` expects the station after Weightless to be `blue-notes`. The expanded registry correctly places `hip-hop` next. Update the test for the approved seven-station order rather than reverting the registry.
2. `apps/web/tests/scene.test.tsx:108` installs an incomplete fake engine. `setEngineForTesting()` calls `onStatusChange`, but the mock only supplies `getAnalyser`. Supply a complete enough engine mock, including an unsubscribe-returning `onStatusChange`, and restore test state cleanly. Do not weaken production engine wiring to accommodate the incomplete mock.

Additional test hygiene:

- Rename the app-flow test that still says "all three stations" and assert all seven station headings.
- jsdom emits repeated `HTMLCanvasElement.prototype.getContext` not-implemented errors from the 2D visualizer. Add a narrow canvas mock in test setup or mock the visualizer in application tests. Do not add a native canvas dependency solely to silence these tests.

### `pnpm typecheck`

Failed in `packages/stations/test/expansion.test.ts:77`:

- `Object is possibly 'undefined'` for the optional `wobble` event parameter.

Assert or narrow the value before comparing it. Shared, audio-engine, composition-engine, and design-system type checks completed successfully before the recursive command stopped. The web production build separately passes its TypeScript check.

### `pnpm lint`

Failed with one error:

- `apps/web/tests/scene.test.tsx:1`: imported `act` is unused.

Remove the unused import and rerun lint.

### `pnpm format:check`

Failed across 66 files. The list includes expansion files and pre-existing files, so do not interpret the count as 66 expansion regressions. Format expansion-owned changes consistently, avoid unrelated churn where practical, and report any pre-existing formatting failures that remain.

### `pnpm build`

Passed. Vite produced the application and lazy-loaded scene successfully.

Warning:

- The lazy `signalScene` chunk is 527.61 kB minified, 132.71 kB gzip, exceeding Vite's 500 kB warning threshold.
- Dynamic import is working. Assess the warning and confirm lazy network loading in the browser. Do not hide it by raising the warning limit without a reason.

### `pnpm --filter @infinite-radio/web e2e`

Failed: 13 failed, 5 passed across chromium, chromium-mobile, and webkit. The run took approximately 7.1 minutes with four workers.

Passed:

- chromium-mobile favorites/volume persistence.
- chromium-mobile settings.
- webkit initial station/brand load.
- webkit settings.
- webkit sustained playback.

Failed tests were predominantly timeouts, including initial load, playback, customization, persistence, settings, and sustained playback. Several failure snapshots show the expected UI already present, including "Now playing" and all seven stations. Browser teardown and truncated trace errors also occurred under the four-worker run.

Treat extreme rendering or test-runner resource contention as a hypothesis, not a confirmed root cause. Software WebGL plus multiple audio engines under four parallel workers may be contributing, but this must be isolated.

Next diagnostic steps:

1. Run one chromium smoke test with one worker.
2. Compare a non-scene test with visuals disabled or reduced motion against the normal scene-enabled path.
3. Inspect browser console errors and real frame/main-thread behavior.
4. Separate scene-specific browser tests from unrelated audio-flow tests if parallel WebGL instances are the cause.
5. Do not fix these failures by only increasing timeouts, weakening assertions, disabling browser coverage, or skipping chromium.
6. Update the E2E test title and assertions that still describe three stations. Add explicit coverage for all seven stations and the new visual lifecycle states.

Generated test artifacts are not required for the next run; the results and failure evidence are captured here.

## Remaining work, in execution order

### 1. Restore a green static and unit baseline

- Fix the two web test failures.
- Fix the station-test TypeScript error.
- Remove the lint error.
- Add appropriate canvas mocking and test cleanup.
- Update stale three-station component-test wording and assertions.
- Run `pnpm test`, `pnpm typecheck`, and `pnpm lint` until they pass.

### 2. Stabilize real browser flows

- Reproduce and isolate the E2E timeouts with one worker.
- Check whether scene rendering blocks or slows input, audio state updates, page reload, or teardown.
- Verify actual station playback, pause, previous/next order, favorites, volume persistence, settings, and customization.
- Verify seven-station discovery at desktop, tablet, and mobile sizes.
- Do not declare the scene successful based only on mocked component tests.

### 3. Complete Signal Space browser validation

Exercise the real scene in a browser:

- Confirm the lazy chunk loads only when visuals are enabled.
- Confirm actual analyser data produces visible but restrained responses.
- Switch across all seven profiles without reconstructing the renderer.
- Confirm reduced motion renders a static scene.
- Confirm disabling visuals releases WebGL and restores appropriate fallback behavior.
- Confirm WebGL initialization failure and context loss retain usable audio and controls.
- Confirm hidden tabs stop rendering and resume without a large delta.
- Confirm pause keeps the ambient scene animating with the audio response settled to zero.
- Check text contrast, pointer independence, mobile layout, and keyboard operation.
- Profile repeated station switches and a 30-minute playback session for resource growth and audio stability.

Add browser tests for the lifecycle states that can be automated reliably. Use manual inspection for visual quality and GPU behavior.

### 4. Review station quality and catalog accuracy

- Listen to each new station for at least 10 minutes, or explicitly leave this as a human-required item.
- Verify that Low End, Velvet, Vapor Trails, and Open Window are perceptibly distinct and not metadata variations of one generator.
- Verify that every mood and customization control makes an audible difference without clicks or abrupt interruption.
- Review new catalog titles, artists, years, keys, modes, and assigned traits. Automated range checks are not factual verification.
- Confirm reference copy continues to state that the app generates original audio and never plays the referenced recordings.

### 5. Finish documentation

The following files still describe old behavior and must be updated:

- `README.md`: says three stations and does not document Signal Space.
- `docs/architecture.md`: says three station definitions and omits the scene architecture.
- `docs/station-system.md`: still says all three stations, omits the four new stations, and describes Blue Notes as jazz/neo-soul.
- `docs/audio-engine.md`: omits guitar-string synthesis, pad modulation, and the new analyser consumer.
- `docs/design-system.md`: has partial expansion changes; review it against the final tokens and scene behavior.

Sweep code comments and test names for stale three-station behavior. Keep `PLAN.md` Section 21 aligned with any intentional implementation refinement.

### 6. Run final verification

Run from the repository root:

```sh
pnpm test
pnpm typecheck
pnpm lint
pnpm format:check
pnpm build
pnpm --filter @infinite-radio/web e2e
```

For browser isolation while diagnosing:

```sh
pnpm --filter @infinite-radio/web exec playwright test --workers=1 --project=chromium
```

Do not mark the expansion complete while any standard check is red. If manual listening, factual catalog review, device testing, or long-running profiling cannot be performed, state exactly what remains instead of claiming completion.

## Final report required from the next agent

Report:

1. Changes made since this handoff.
2. Root causes of the web and E2E failures.
3. Exact test, typecheck, lint, format, build, and browser results.
4. Scene lifecycle and performance evidence.
5. Documentation updated.
6. Manual listening and catalog-verification status.
7. Any remaining limitations or blocked acceptance criteria.

Do not deploy, commit, push, or add unrelated features. The task is complete only when `PLAN.md` Section 21 is satisfied or any remaining human-only validation is clearly identified.
