# UMAA Development Studio v0.9.1 — ICD-oriented Asset Model

## Scope

This is an integration **on top of the v0.9 Component-First source**. It keeps the Component Journey, System Assembly, code scaffold export, and existing curated UMAA 6.0 seed. It integrates the v0.8.3 editable UML mock-type functionality and introduces a project Asset Library and ICD pattern views.

### Terms used in UI

| Studio term | Meaning | ICD provenance |
| --- | --- | --- |
| Component | Software unit that provides and/or consumes services | Component Definitions v1.0 |
| Service | Contract providing an autonomous capability | UMAA ICD §6.1 |
| Service Category | **UI classification**, e.g. Control / Config / Specs / Status / Report; **not** an official mandatory enum | ICD §3.4 naming conventions |
| Flow Control | Command / Response or Request / Reply | ICD §5.1 / §5.2 |
| Operation | `setXXX`, `queryXXX`, `reportXXX`, `cancelXXX`, etc. | ICD §6.1 |
| Topic | DDS topic named by the ICD | ICD §6.1 `Topic` |
| Data Type | Topic data structure and ICD Message Definition | ICD §6.1 `Data Type` / `Message Definition` |
| Attribute | Data Type field | ICD §6.1 Attribute Name / Type |
| Data Patterns | Large Collections or Generalization / Specialization | ICD §3.8 / §3.9 |
| QoS Profile | Project DDS QoS configuration / reuse definition | DDS-JSON QoS concepts, project editor subset |

The two kinds of *Report / Status* usage are distinguished:

1. `GlobalPoseStatus` / `HealthReport` are Service names classified as **Status / Report**, often with **Request / Reply** Flow Control.
2. `reportGlobalVectorCommandStatus` is a **Report Operation** of the `GlobalVectorControl` Service, which has **Command / Response** Flow Control.

`Report / Status` is **not** a third Flow Control pattern. `Operation` and `Topic` are not 1:1; `queryXXX` usually subscribes, while `cancelXXX` uses DDS Dispose on the relevant existing Topic.

## Navigational UI

- **My Components**: Component definition → Service Bindings (Provider / Consumer) → runtime → code scaffold.
- **Asset Library**: independent creation and discovery of custom Service, standalone Topic, Topic Data Type, common Data Type, and QoS Profile. Standard assets are references, never edited as normative UMAA definitions.
- **Service → Flow Control / Report**: reports/query/cancel/command operations and a **schematic** Consumer–Provider data-flow diagram.
- **Data Patterns**: Topic relationship diagram for Large Set/List and Generalization/Specialization, editable for user-defined Topics.
- **QoS → Profile Relationships Diagram**: Base-Profile reference and Component usage diagram; policy editor adds Presentation fields, and stores QoS Library name. This is **not** a conformant DDS-JSON serializer or Requested/Offered compatibility engine.
- **Data Type**: v0.8.3 UML generalization viewer and field/enum editing. ICD-derived *mock* type changes are stored as project overrides; official IDL remains external and unchanged.

## Reference-model rules

```
Project
├── Components → Service Bindings → Service references
├── Asset Library
│   ├── Services → Operations → DDS mappings → Topics
│   ├── Topics → Topic Data Types
│   ├── Data Types → Attributes / UML type references
│   └── QoS Profiles → optional Base Profile
└── Data Patterns → Topic Relations
    ├── Large Set / Large List: metadata topic ↔ element topic
    └── Generalization / Specialization: general topic ↔ special topic
```

Nodes/edges are derived from Domain Model arrays, not persisted as the authoritative contract. New user-defined Topic/Data Type assets do not create DDS endpoints until referenced by a custom Service Operation and then bound to a Component.

### Pattern requirements not automated by this release

- **Command / Response**: `sessionID`, destination GUID, legal CommandStatus state machine, cancellation, cleanup, recovery.
- **Request / Reply**: many `queryXXX` are DDS Subscribe, not a separate request Topic; request with query data not implemented.
- **Large Collections**: Set/List metadata and element types, ID/timestamp synchronization, exact Presentation QoS, sample ordering and assembly logic.
- **Generalization / Specialization**: generalization & specialization types and separate Topics must share specialization ID, Topic, timestamp, buffering, update/dispose rules.
- **QoS**: complete DDS-JSON profile/policy mapping, policy inheritance composition, vendor application, DDS Requested/Offered compatibility.

The new `topicRelations` in the project are **design references**. `validateWorkspace()` issues warnings for missing runtime pattern implementation, not false proof of DDS conformance.

## Project schema / migration

- Existing `schemaVersion: 3` workspaces remain loadable. Additional optional properties are upgraded by `upgradeWorkspace()` (`qosProfiles[].libraryName`, `baseProfileId`, Presentation fields).
- Newly created custom Topic Data Type is stored in `messages[]` for backward compatibility with the current Topic foreign key `messageTypeId`; the UI calls it **Data Type**. Generic custom common types remain in `dataTypes[]`.
- `topicRelations[]` gains project records with kinds `large-set-element`, `large-list-element` and `specialization`.
- `ServiceDefinition.serviceCategory` is optional (derived from the ICD naming convention if absent). Users may explicitly edit it only on project Custom Services.
- Import/export uses the existing project JSON; new codegen metadata files are `contracts/icd-patterns.json`, `contracts/project-assets.json`, `contracts/type-overrides.json`.
- **Current code generation is a C++ shared-library SKELETON, not a DDS-enabled UMAA component.** No official IDL files are invented.

## OMG reference schemas

- [DDS-JSON Types 2019-06-01](https://www.omg.org/spec/DDS-JSON/20190601/dds-json_types.schema.json)
- [DDS-JSON QoS 2019-06-01](https://www.omg.org/spec/DDS-JSON/20190601/dds-json_qos.schema.json)

These are used as design references only, not as a claim of import/export/schema compatibility in v0.9.1. The Studio model also contains UMAA-specific Service / Flow / Component semantics not defined by DDS-JSON.

## Validation performed

- Node syntax checks for `.js` files.
- TypeScript parser checks for `.jsx` files (no bundle dependencies required).
- Existing pure core tests and newly added `tests/icd-assets.test.mjs`, `tests/type-override.test.mjs`.
- `npm install --offline` did not succeed (missing npm cache), so full React build, browser interaction and live DLL/SO compilation **remain unverified**. Run `npm install && npm run build && npm test` in a dependency-enabled development environment.
