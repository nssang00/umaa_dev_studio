# Frontend structure — Layout → Views → Components

Updated 2026-11-06.

## Source responsibilities

- **`model/`**: domain structures, catalog samples, schemas, migrations, domain edits and pure rules. E.g. `workspaceSchema.js` handles project evolution, `interfaceDirection.js` owns contractual INPUT/OUTPUT classification, `qosPolicies.js` contains typed policy definitions. No layout code belongs here.
- **`logic/`**: pure operations/use cases over domain data, such as endpoint derivation, service communication projection, validations, code generation and layout calculations. Prefer no React or persistent storage.
- **`repository/`**: persistence boundary. `mockRepository.js` currently loads/saves/resets via browser `localStorage` with an in-memory fallback; `ProjectRepository.js` is an empty placeholder, **not** an implemented database repository.
- **`stores/`**: Zustand state + actions. UI components subscribe to state and call actions; actions may invoke model or logic and then persist through a repository.
- **`components/`**: reusable/feature UI for Explorer, contract graphs, DDS editor, QoS controls, Struct editor, inspector details and logs.
- **`layouts/`**: page geometry, View registration and composition. A Layout assembles Views; each View composes feature components.

## Studio layout tree

```text
src/
├── App.jsx                         # application shell, dialogs, project actions
├── layouts/
│   ├── WorkbenchPanelRenderer.jsx  # generic registered-view renderer
│   ├── workbenchPanels.config.js   # Studio panel -> View registry
│   └── studio/
│       ├── StudioLayout.jsx        # 4 view slots, no store
│       ├── StudioShell.jsx         # pane geometry / resize / local width preference
│       └── views/
│           ├── ExplorerView.jsx    # StudioNavigator + footer
│           ├── WorkbenchView.jsx   # WorkspaceWorkbench contextual editor
│           ├── PropertiesView.jsx  # SelectionPropertiesPanel
│           └── ConsoleView.jsx     # BottomPanel
├── components/                      # reusable feature components
├── model/
├── logic/
├── repository/
└── stores/
```

## Boundaries and data flow

1. `App` passes callbacks and project context into `StudioLayout`.
2. `StudioLayout` chooses the View in each slot using `WorkbenchPanelRenderer`. Geometry-only `StudioShell` provides Explorer and Properties resizers and keeps Output/Console **under Workbench only**.
3. A View renders one or more UI components. E.g. `ExplorerView` renders `StudioNavigator` and status footer; `WorkbenchView` renders `WorkspaceWorkbench` which selects the editing component according to current selection.
4. Feature components call Zustand store actions. Domain rules reside in `model/` or `logic/`; storage stays in `repository/` — do **not** import repository directly from Views.
5. No schema change or duplicated state was introduced by this refactor.

## Adding screens

- **New Layout:** add `layouts/<layout>/` with its own `<Layout>.jsx` and `views/` directory.
- **New View in Studio:** create `layouts/studio/views/<Feature>View.jsx` that composes existing or newly written components, and register its ID in `workbenchPanels.config.js`. Add routing to the owning Workbench View only if the feature changes the central editor.
- **New component:** keep reusable widgets and domain-specific editors in `components/`; move highly specialized view-private components into a local `views/<view>/components/` directory **when they actually become private to one View**, not preemptively.
- **New business rule:** add to `model/` (domain invariants) or `logic/` (cross-model computations). Keep storage integration in `repository/`.

## Backward compatibility

The old `src/components/StudioShell.jsx` path re-exports the layout's `StudioShell` to preserve existing imports. The old flat feature components remain in place while the composition boundary is adopted; feature files can be migrated gradually without risking Service/Struct/QoS behavior.


## Feature components and compositional primitives (2026-11-06)

```text
src/components/
├── assembly/
│   ├── ComponentJourney.jsx       # primary Component workflow
│   ├── ServicePicker.jsx          # Service selection modal
│   └── ServiceBindingSection.jsx  # same UI for Provider / Consumer
├── explorer/
│   └── ProjectModelExplorer.jsx
├── service/
│   ├── ContractGraph.jsx
│   └── OperationFields.jsx        # shared contract fields in 2 creation forms
├── types/
│   ├── TypeGraph.jsx
│   ├── TypeWorkbench.jsx
│   ├── TypeProperties.jsx
│   ├── StructPropertiesEditor.jsx
│   ├── StructFieldAccordionList.jsx
│   └── StructFieldEditor.jsx
├── qos/
│   ├── QosProfileDiagram.jsx
│   ├── QosEntitySections.jsx
│   ├── QosPolicyAccordion.jsx
│   ├── QosPolicyFieldControl.jsx
│   ├── QosProfileFields.jsx
│   └── QosProperties.jsx
├── dds/
│   ├── DdsConfigurationWorkbench.jsx
│   ├── CommunicationView.jsx
│   └── EndpointProperties.jsx
├── shared/
│   ├── graph/
│   │   ├── ModelGraphCanvas.jsx     # React Flow chrome, nodes as props
│   │   └── StudioGraphNode.jsx    # shared graph node rendering
│   └── display/
│       └── ModelPropertiesPanel.jsx # title/eyebrow/frame, children as slot
└── ... top-level compatibility facades and cross-feature coordinators
```

Each logical feature owns its model-specific interactions and store subscriptions, while shared components are **presentation-only**. Do not pass a `modelKind` with many boolean flags into a universal editor.

- **Props reuse:** `ServiceBindingSection({role,rows,snapshot,onAdd,onRemove,onContract})` renders both roles without duplicating UI. `OperationFields({topics,topicLabel,directionLabel,help})` supplies the identical Topic/Action/Direction/Actor controls to both Custom Operation creation dialogs; direction and DDS actor stay independent.
- **Composition reuse:** `ModelGraphCanvas({nodes,edges,nodeTypes,...flowProps})` centralizes React Flow background/controls/optional minimap; feature-level event handling, pointer interactions, graph positions and editing permissions remain in service/type/qos/dds editors. QoS profile node keeps `pointerEvents:'all'` for nested inputs.
- **Properties:** `ModelPropertiesPanel({eyebrow,title,className,children})` supplies the shared inspector frame. Child sections keep their own store actions and validation.

Legacy `src/components/<Feature>.jsx` paths remain small re-export facades so external imports do not break. New/updated internal composition points import directly from feature folders. Remaining multi-feature coordinators (e.g. WorkspaceWorkbench, ContractWorkbench, DesignDetails, ContextProperties) stay at the root until they can be separated without circular imports. Avoid moving them merely to make a folder look tidy.

The refactor has **no changes to domain snapshots, API contracts, Zustand state or repository storage**. Browser visual E2E should still validate modal dialogs, React Flow controls, nested QoS fields and workspace transitions before a production release.
