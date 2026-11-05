# Architecture comparison: ea_react → UMAA

Reference: https://github.com/nssang00/ea_react (main, reviewed 2026-11-05).
Target: https://github.com/nssang00/umaa_dev_studio.

| ea_react | UMAA | Decision |
| --- | --- | --- |
| antd Splitter | StudioShell with persisted widths and keyboard control | Keep shell; no dependency upgrade |
| Config-driven panel registry | Direct App composition | Adopt registry + renderer |
| View/hooks/modelSelectors | ContextProperties mixes rendering and selections | Incrementally extract pure selectors |
| PropertyForm sections | Specialized Inspector and TypeProperties | Reuse only proven shared form parts |
| ReactFlow node primitives | Different Component P/C and generic graph handles | Avoid unsafe node merge; evaluate visual subparts |
| Separate UI/model stores | Existing useEditorStore domain commands and selection | Split selector adapters first; preserve persistence |
| React 19 / antd 6 | React 18 / antd 5 | No unrelated upgrade |
| EA model+DDS JSON mutation | UMAA contract types | Do not import incompatible domain updates |

## Panel contract

StudioShell owns geometry. The registry maps region ID to view component. WorkbenchPanelRenderer resolves a view and passes public viewProps; it has no Zustand dependency. Feature views retain their existing tabs and domain logic. Properties settings composition is extracted into SelectionPropertiesPanel.

## Acceptance

Keep Explorer / Workspace / Properties / Console behavior, keyboard resize and localStorage preference, Component-first editor, Type editing, existing validation and log tabs. Require npm test and npm build in Actions.

## Follow-up

Move ContextProperties selection display calculations to a pure model and hook; then consider shared diagram visual primitives without changing P/C handles. Browser drag / caret E2E remains separate from static tests.

## Checkpoint 2: selection details

`ContextProperties` now consumes `useSelectionDetails`. The hook is the only Zustand bridge; `describeSelection` is a pure, testable projection over an existing snapshot and selected entity. Specialized TypeProperties/Inspector editing and UMAA domain write commands are unchanged.
