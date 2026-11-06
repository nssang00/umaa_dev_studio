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
