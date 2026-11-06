# UMAA Studio — ICD Catalog / Service Model / System Model

Updated 2026-11-06; based on the implementation in PR #6.

## Navigation & ownership

The default Explorer has exactly three logical scopes:

1. **UMAA ICD Catalog** — built-in, read-only **curated subset** of UMAA 6.0 reference Service, Interface (tool navigation projection), Operation, Topic, Data Type and Flow Control rules. These bundled ICD-derived *mock* data structures are not official IDL bytes. Do not mutate the standard contract when a user binds it to a Component.
2. **Project Service Model** — user-created Custom Services plus standard Service IDs currently referenced by one or more Component Bindings. A service appears under multiple scopes by **reference**, not duplication. Custom Topics and Data Types are independent reusable project resources.
3. **System Model** — System Assembly, Components with separate Provider/Consumer Service Bindings, Service Connections, DDS Configuration, QoS Profiles, Topic Relationships and code-scaffold output.

The legacy Asset Library / Advanced Model Explorer views are retained internally for old selection states, but they are not separate default navigator entries. The role of the center Workbench remains context-dependent; the right Properties pane edits selected information. Bottom Output/Console stays beneath the Workbench.

## Service contracts

- **Service Type** (Control / Config / Specs / Status·Report / Other) is separate from **Flow Control** (Command / Response or Request / Reply).
- The Custom Service creation dialog captures both. It still seeds an editable project-owned contract template, never an official ICD contract.
- A Provider-facing contract groups Operations into **INPUT / To Provider** and **OUTPUT / From Provider**:
  - \`publish\` and \`dispose\`: a Consumer actor gives INPUT, a Provider actor gives OUTPUT.
  - \`subscribe\`: a Consumer actor is OUTPUT (it subscribes to the Provider report Topic); a Provider actor is INPUT.
- The Custom Operation creation dialog asks for Interface Direction plus DDS Action and derives the stored \`actor\` so the wire semantics stay consistent. The existing Operation data format remains compatible and its Interface direction is a projection.
- Query without request data is normally subscription, not creation of a separate Query DDS Topic. Cancel is Dispose against an existing command instance; these are **not additional Topic resources** by default.
- ContractGraph keeps Operation → Action → Topic → Data Type mappings. It adds labels for INPUT/OUTPUT; no claimed normative Interface identifier is created.

## Component bindings and DDS configuration

A Component **provides** or **uses** an existing Service ID. \`deriveEndpoints()\` projects logical Writer/Reader endpoints from Service Operations and binding role. System Assembly displays logical P/C port connections. Selecting an existing logical Connection opens a distinct five-column Endpoint Topology:

\`Consumer → Consumer Endpoint → DDS Topic → Provider Endpoint → Provider\` for commands, reverse arrows for reports.

Both sides explicitly label DataWriter or DataReader for each Topic. This is a **logical diagram** only. It does not instantiate a DDS Participant/Publisher/Subscriber, send data, or assert matching.

## Endpoint QoS design-time override

\`endpointConfigs\` is an optional dictionary indexed by \`bindingId|topicId|writerOrReader\` and containing \`qosProfileId\`. The key is stable for the lifetime of a Binding, Topic and direction.

- Default: no override entry → effective profile is \`componentRuntime[componentId].qosProfileId\`.
- Selecting a QoS Profile in Endpoint Properties persists a narrow override. Clear selection → delete override and inherit again.
- Domain and Partition are **Component Runtime** settings, not per-Endpoint settings.
- Removing a Binding also removes its endpoint override entries. Orphans in imported snapshots are warned; invalid QoS references are errors.
- Import/export uses the same project JSON; old snapshots migrate with empty \`endpointConfigs\`. Generated scaffolds include \`contracts/endpoint-qos-design.json\` for **design metadata only**, with effective Profile references and inheritance origin.
- QoS Profiles contain six independently editable entity policy sections, but this project editor implements a **limited curated policy subset**. QoS policy inheritance/merging, Requested/Offered compatibility, DDS-JSON compliance and vendor SDK application are not implemented.

## Module boundaries

- \`src/model/projectNavigation.js\`: pure Explorer and Service-direction projections.
- \`src/components/ProjectModelExplorer.jsx\`: Explorer UI; \`StudioNavigator.jsx\` remains a small compatibility entrypoint.
- \`src/logic/editorGraphs.js\`: pure Service Contract graph projection.
- \`src/components/FlowControlRulesWorkbench.jsx\`: partial, read-only rule description.
- \`src/logic/endpoints.js\`: logical Component/Binding/Topic/DDS direction derivation.
- \`src/model/endpointConfiguration.js\`: stable Endpoint keys, inheritance, pure atomic overrides, prune helper.
- \`src/logic/communicationModel.js\`: logical 5-column endpoint topology.
- \`src/components/DdsConfigurationWorkbench.jsx\`: global endpoint list and per-Component Runtime.
- \`src/components/EndpointProperties.jsx\`: selected Endpoint's Topic / Type / QoS links and override.
- \`src/logic/validation.js\`: invalid/orphan Endpoint config checks.

## Verification and explicit limits

The new model and UI wiring tests cover three Explorer roots, source references, INPUT/OUTPUT derivation, graph projections, Endpoint override persistence, invalid reference rejection, migration and emitted metadata. Full \`npm test\` and \`npm run build\` are required to pass on GitHub Actions before merging. Actual browser click/keyboard/accessibility E2E is **not covered** by these tests. DDS middleware, official ICD catalog import, complete schema, code generation of working DDS entities and compatibility checks remain outside the implemented scope.
