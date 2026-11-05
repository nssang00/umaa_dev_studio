# Development progress

## 2026-11-05 — resizable studio shell

- Base: UMAA Development Studio v0.9.1, GitHub `main` commit `e3cee94cf5075a2a3e5cf30bc30d61c4b20d3559` (prior CI: success).
- Implemented: decoupled `StudioShell` layout; independently resizable Explorer and Properties; persistence in localStorage; accessibility via keyboard and ARIA.
- Implemented: extracted `BottomPanel` as a standalone Console/Output component with up/down caret toggling.
- Constraints: 210–480px Explorer; 240–540px Properties; 360px minimum workspace; Console 42px collapsed and 210px expanded.
- Verified locally: `npm run test:core`, `npm run test:studio-layout`, `npm run test:struct-ui`, `npm run test:icd-ui`, `npm run check:static`.
- Required CI verification: `npm test`, `npm run build` on GitHub Actions (pending at authoring time).
- Remaining: interactive browser drag/caret E2E testing; not claimed as passed until run.

## GitHub Actions verification

- UI feature commit: [`9165847`](https://github.com/nssang00/umaa_dev_studio/commit/916584741f07ee23595a6553964a9495f90c0f6e).
- 2026-11-05 CI run [`42027679267`](https://github.com/nssang00/umaa_dev_studio/actions/runs/42027679267): **SUCCESS** on `ubuntu-latest` / Node.js 22.
- Runner passed `npm ci`, `npm test` (including `test:struct-ui` and `test:studio-layout`), `npm run build`, and artifact upload.
- Interactive browser drag and console caret E2E remain unverified; static/layout logic tests are not browser E2E.

## 2026-11-05 — composable panel architecture, checkpoint 1

- Compared EA React: config-driven panels, renderer, feature views/hooks/model selectors, property editing, reusable diagram nodes.
- Kept existing accessible/persisted StudioShell rather than replacing it with Splitter; unchanged dependencies and domain model.
- Added a central feature panel registry and moved Properties composition out of App, retaining existing Explorer, Editor, settings and Console UI.
- Added regression wiring tests; CI pending. Next: extract Properties selection details as pure model and hook.

## 2026-11-05 — selection details, checkpoint 2

- Extracted read-only `describeSelection` projection from `ContextProperties` to `src/model/selectionDetails.js` and `src/hooks/useSelectionDetails.js` Zustand adapter.
- Preserved source schema, selection behavior, TypeProperties routing, focused Component overview and existing UI labels.
- Added unit test of all supported selection kinds, focused bindings, missing IDs and non-mutation. Actions verification pending.

## CI verification — EA React comparison refactor

- Checkpoint 1: GitHub Actions run [42034345699](https://github.com/nssang00/umaa_dev_studio/actions/runs/42034345699) **SUCCESS** (`npm ci`, full `npm test`, `npm run build`).
- Checkpoint 2: GitHub Actions run [42034622967](https://github.com/nssang00/umaa_dev_studio/actions/runs/42034622967) **SUCCESS** (full tests including `test:selection`; React build).
- Final import cleanup changes are pending final CI run; do not report final commit verified until CI succeeds.
- Browser interaction E2E for dragging panes and clicking Console carets remains unverified. No domain schema, DDS runtime or persistence behavior changes intended.
