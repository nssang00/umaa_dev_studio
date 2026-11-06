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
- Final PR checkpoint CI [42034839632](https://github.com/nssang00/umaa_dev_studio/actions/runs/42034839632): **SUCCESS** (`npm ci`, full regression suite including `test:panels` and `test:selection`, React build, artifact upload).
- Browser interaction E2E for dragging panes and clicking Console carets remains unverified. No domain schema, DDS runtime or persistence behavior changes intended.

## 2026-11-05 — merged UI modularization

- PR [#1](https://github.com/nssang00/umaa_dev_studio/pull/1) squash-merged into `main` at [baef58f](https://github.com/nssang00/umaa_dev_studio/commit/baef58f92fb4060c0ac747035920b6b2f0d885e0).
- Post-merge `main` GitHub Actions [42034950825](https://github.com/nssang00/umaa_dev_studio/actions/runs/42034950825): **SUCCESS** (`npm ci`, full `npm test`, `npm run build`, upload artifact).
- Next: browser-based drag / keyboard / caret E2E. Existing graph node component (`StudioGraphNode`) is already reused by TypeGraph and ContractGraph; avoid adding a redundant node abstraction. Separate domain editors only as shared UI behavior is verified.

## 2026-11-05 — QoS entity concept graph (checkpoint 1)

- New pure `qosDiagram` projection expresses six DDS entity QoS sections and containment/Topic usage topology. Unlike profile references, this graph is explicitly conceptual.
- Keeps true Profile base references and Component Runtime selections in a separate read-only diagram; does not imply per-entity policy assignment or DDS runtime support.
- Regression added: `test:qos-diagram`; CI verification pending.

## 2026-11-05 — Struct-wide Properties (checkpoint 2)

- `StructPropertiesEditor` is a self-contained editable draft of Struct identity, optional parent, and all declared fields; one save dispatches one validated model mutation.
- `editStructDefinition` applies metadata + fields atomically, prevents duplicate/inherited field IDs, invalid annotations and inheritance cycles, and preserves ICD Mock baseline/Project Override.
- Existing enum member editor is unchanged; UML field selection still highlights the row, not a distinct Properties editor.
- Added `test:struct-batch` and `test:struct-panel`; CI verification pending.

## CI checkpoints — QoS and Struct refactor

- QoS concept diagram: [Actions 42038816335](https://github.com/nssang00/umaa_dev_studio/actions/runs/42038816335) **SUCCESS**.
- Struct-wide Properties: [Actions 42039583847](https://github.com/nssang00/umaa_dev_studio/actions/runs/42039583847) **SUCCESS** (all tests including new QoS and Struct checks, React build and artifact upload).
- Added design/limitations record in `docs/QOS_ENTITY_AND_STRUCT_PROPERTIES.md`. Documentation-only final CI to follow.

## 2026-11-05 — QoS / Struct editor merged and verified

- [PR #2](https://github.com/nssang00/umaa_dev_studio/pull/2) squash-merged at [81d6d6f](https://github.com/nssang00/umaa_dev_studio/commit/81d6d6fff7d5e317ff8ce6ee9e4e1e9e4952ab4f).
- Last PR-head GitHub Actions [42039952234](https://github.com/nssang00/umaa_dev_studio/actions/runs/42039952234): **SUCCESS**.
- Post-merge `main` GitHub Actions [42040084458](https://github.com/nssang00/umaa_dev_studio/actions/runs/42040084458): **SUCCESS** for `npm ci`, complete `npm test` (including QoS concept and Struct-wide tests), `npm run build` and artifact upload.
- Known limitations: no actual DDS per-entity QoS persistence/application or Requested/Offered validator; browser E2E interactions not yet exercised on runner.

## 2026-11-05 — QoS nested editor checkpoint

- Replaced separate QoS policy and concept/reference tabs with one React Flow `QosProfileDiagram` node. It contains six open/close entity sections, each with nested policy accordion and editable typed fields.
- Added pure `qosPolicies` design catalog and independent `editQosEntityField` store command; migration preserves existing profile properties and seeds entity sections from legacy values without overwriting existing nested edits.
- QoS per-entity values are saved in profile JSON, not DDS runtime. `test:qos-editor` covers default sections, migration, typed field validation, persistence, no-op, and UI wiring.
- CI pending; old conceptual graph remains as unused source/history, no longer primary UI.

## 2026-11-05 — Struct field accordion checkpoint

- Added `StructFieldAccordionList.jsx` and `StructFieldEditor.jsx` as nested presentation-only blocks inside the Struct Properties Form.List draft.
- Every field row can expand/collapse; all declared field values remain in a single draft and save together. Selected UML field expands automatically; add and remove remain available.
- Added editable design-only `description` and `defaultValue` field metadata; `editStructDefinition` validates input, persists metadata and preserves original ICD Mock baseline. Default value is a text annotation, not compiled IDL.
- New `test:struct-accordion`; CI pending.

## 2026-11-05 — nested QoS and Struct accordion polish

- Added fixed-height QoS ReactFlow canvas / scrollable inner Profile node, responsive typed inputs and consistent narrow Properties layout.
- Validation now reports `QOS_POLICY_VALUE` for imported invalid nested policy settings.
- Ensured selection-driven field opening does not continually reopen a manually collapsed row while typing.
- Added `docs/NESTED_QOS_STRUCT_ACCORDION.md`; full CI pending.

## 2026-11-05 — merged nested QoS / Struct accordion UI

- PR [#3](https://github.com/nssang00/umaa_dev_studio/pull/3) squash-merged into `main` as [e7294d5](https://github.com/nssang00/umaa_dev_studio/commit/e7294d51720adbb47a59fe1d48e1f74658aba1a2).
- [Post-merge Actions 42047357561](https://github.com/nssang00/umaa_dev_studio/actions/runs/42047357561): **SUCCESS**; `npm ci`, full `npm test` including nested QoS and Struct accordion regression tests, `npm run build`, and artifact upload.
- Not yet covered by browser automation: actual nested accordion clicks, typing in a React Flow node, and save/reload through browser UI. Full DDS QoS policy/compatibility validation is not implemented.

## 2026-11-06 — Struct / QoS editor density cleanup

- Styling only: retained a single outer border per Struct field and per QoS entity; changed nested QoS policy cards into thin dividers with no individual outline.
- Removed Ant Design Collapse root frame on these editors and reduced nested padding 15–25%. Kept input field borders, label readability, focus/keyboard behavior, and data/update logic unchanged.
- Added `test:editor-density` CSS hierarchy regression. Browser visual inspection is still pending (static tests and build do not prove appearance).

## 2026-11-06 — editor border cleanup verified

- [PR #4](https://github.com/nssang00/umaa_dev_studio/pull/4) squash-merged to `main` at [1927ccf](https://github.com/nssang00/umaa_dev_studio/commit/1927ccf7f5eaec1d05415fb9cfe6ee3fb2e68189).
- [Post-merge Actions 42053476761](https://github.com/nssang00/umaa_dev_studio/actions/runs/42053476761): **SUCCESS**, including full `npm test` (new CSS hierarchy test), `npm run build`, and artifact upload.
- Visual appearance and interaction of expanded panels in an actual browser were not E2E-tested; this was a scoped CSS-only adjustment.

## 2026-11-06 — QoS node interaction and Properties editing

- Identified a React Flow v12 pointer-event issue: when QoS nodes are neither draggable nor selectable, NodeWrapper applies `pointer-events:none`; this blocks embedded Ant Design Collapse and form controls. Explicitly override `pointerEvents:'all'` on the QoS node's wrapper style, retain read-only node positions, disable panning/double-click zoom and suppress node keyboard selection.
- Reused `QosEntitySections` and new shared `QosProfileFields` in both React Flow node and `QosProperties` sidebar, routed through `ContextProperties` and pure selection projection's `qos` field. Both views use existing narrow Zustand actions to update the same persisted profile.
- QoS sidebar is single-column for narrow Properties widths; no DDS data schema, policy saving semantics, or Struct model changes.
- Added regression `test:qos-interaction`; CI and browser E2E pending.

## 2026-11-06 — QoS click support and Properties merged

- [PR #5](https://github.com/nssang00/umaa_dev_studio/pull/5) squash-merged to `main` at [d9da836](https://github.com/nssang00/umaa_dev_studio/commit/d9da836ceed78cb2db014f671fbab8c5d9d371eb).
- [PR head Actions 42054966263](https://github.com/nssang00/umaa_dev_studio/actions/runs/42054966263): **SUCCESS**.
- [Post-merge Actions 42055125678](https://github.com/nssang00/umaa_dev_studio/actions/runs/42055125678): **SUCCESS**, complete `npm test` (including new `test:qos-interaction`), `npm run build` and artifact upload.
- Browser-level direct click / input E2E is not run; pointer-event cause identified from React Flow source and regression statically checked against explicit wrapper-style override. Both QoS views share Zustand update actions and model.

## 2026-11-06 — Model-workspace consolidation (checkpoint 1)

- Unified default explorer into three independently scoped roots: curated read-only UMAA ICD Catalog; Project Service Model (custom and actively referenced standard Services); System Model (Components, Service Connections, DDS Configuration).
- Pure `projectNavigation` builds tree, classifies Provider-facing INPUT/OUTPUT operations, and maps requested direction + DDS action to canonical actor without changing normative source data.
- ContractGraph shows separate INPUT/OUTPUT interface headers while retaining operation→action→topic→type links; Custom Service creation now accepts Service Type and Flow Control as separate values.
- Built-in Flow Control Rules view labels the curated reference as partial. Legacy Asset Library views are retained for old selections but not duplicated in normal navigation.
- Test `test:project-model`; full CI pending.

- Checkpoint 1 repair: updated existing selection label regression to `Topic Relationships` and completed both Custom Operation modals' explicit INPUT/OUTPUT direction controls; Service Type and Flow selection are now distinct in the create dialog.

## 2026-11-06 — DDS Endpoint mapping (checkpoint 2)

- Persist `endpointConfigs` as a backward-compatible optional project-design override keyed by Binding ID + Topic ID + writer/reader direction. QoS Profile is inherited from Component Runtime unless explicitly selected per Endpoint; null removes an override. Removing the Binding prunes endpoint overrides.
- Enriched derived Endpoints with actual Topic IDs. DDS Communication Graph now shows Consumer/Provider, both DataWriter/DataReader endpoint nodes and Topic/Type reference. Selecting an Endpoint opens the same global Properties pane without leaving the connection view.
- New DDS Configuration overview workbench lists all derived endpoints and offers direct inspector selection and per-Component Runtime editing.
- Explicit validation for malformed QoS refs and orphaned Endpoint configs; JSON import/export round-trips, and design-only metadata `contracts/endpoint-qos-design.json` in generated scaffold.
- New `test:endpoint-config`; full Actions CI pending, browser interaction E2E not run. No DDS SDK application or Requested/Offered check.

- DDS checkpoint regression update: existing channel graph expectation now checks 3 nodes and 4 edges per Topic, including both endpoints; the old 1 Topic-node + 2 edges check no longer described the new projection.
