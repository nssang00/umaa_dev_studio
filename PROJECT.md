# UMAA Development Studio — project configuration

- Source of truth: `https://github.com/nssang00/umaa_dev_studio`, default branch `main`.
- Frontend: React 18, Ant Design 5, Zustand 5, esbuild, JavaScript/JSX; do not introduce a second UI framework without a concrete need.
- Architecture: application shell composes feature modules; each module exposes a small public contract and does not import implementation details from sibling modules. Domain models, rendering components and data repository are separate.
- Domain scope: UMAA-inspired Component / Service / Topic / Data Type / QoS design workbench. Do not identify ICD-derived mock models as official standard IDL or working DDS runtime.
- Shell: `src/components/StudioShell.jsx` composes Explorer, Workbench, Properties and Console. `src/logic/studioLayout.js` defines resizable pane constraints. `src/components/BottomPanel.jsx` owns diagnostic output UI, not domain editing.
- Run locally: `npm ci`, `npm test`, `npm run build`. CI (`.github/workflows/ci.yml`) must pass for each merged change.
- Tests: model tests, UI-structure tests, layout constraint tests; run all affected regression tests for each change.
- Environment: Node.js 22, GitHub-hosted Ubuntu runner.
- Credentials: never commit credentials, local browser storage, generated bundles or `node_modules`.

- UI composition: `src/layouts/workbenchPanels.config.js` registers feature views; `WorkbenchPanelRenderer.jsx` instantiates them through public props. `SelectionPropertiesPanel.jsx` owns right-panel composition. Keep StudioShell geometry-only.

- QoS UI: one editable Profile diagram with six nested entity-policy sections, shared with right Properties; project design-time policy values persist but no DDS SDK binding or Requested/Offered validation is implemented.
- Struct Properties: all declared fields, name and UML parent edited in a single draft and committed via one validated `editStructDefinition` transaction; inherited fields remain parent-owned, mock baseline remains unmodified.

- QoS Profiles: six nested policy object sections are editable inside one diagram node. Policy catalog in `src/model/qosPolicies.js` is a limited project-design schema; do not claim OMG DDS-JSON compliance. Legacy flat fields are preserved on import.

- Model navigation: unified ProjectModelExplorer with three roots (curated UMAA ICD Catalog, Project Service Model, System Model). Catalog Interfaces are tool navigation projections, not authoritative model IDs.
- Endpoint configuration: `endpointConfigs` is a design-only QoS override index keyed by Binding ID, Topic ID, DataWriter/DataReader direction. Inherit Component Runtime profile by default. No DDS SDK entity creation or full QoS compatibility assertion.
