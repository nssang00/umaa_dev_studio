# QoS entity concepts and Struct-wide Properties (2026-11-05)

## Reference and decision

Compared `ea_react` `qosSchemaCatalog`, `QosEntitySections`, `QosNode`, `QosEditor`, and View/Hook/Model separation with current UMAA.

- Adopt six explicit entity scope names and pure diagram projections, **not** EA React's visual design or DDS-JSON storage schema.
- Preserve UMAA's `qosProfiles[]`, `baseProfileId` and `componentRuntime[id].qosProfileId` semantics.
- Do not create artificial DDS Topic / Reader / Writer assignments or imply Requested/Offered matching.
- Preserve React 18 / Ant Design 5 and existing StudioShell and component-first views.

## Diagram model

`src/model/qosDiagram.js` provides two distinct read-only projections.

1. **DDS entity concept graph**: `domain_participant_qos`, `topic_qos`, `publisher_qos`, `subscriber_qos`, `datawriter_qos`, `datareader_qos`. Arrows describe creation/containment and Topic read/write relationships, *not* QoS inheritance or active assignments.
2. **Stored Profile references graph**: a Project QoS Profile, its optional Base Profile reference, and actual Components where `componentRuntime[componentId].qosProfileId === profileId`. Missing base is indicated explicitly.

A diagram is not a QoS policy model. Editing per-entity DDS policies and applying them to vendor middleware, including Request/Offered compatibility, remain outside this change.

## Struct edit contract

`src/components/StructPropertiesEditor.jsx` owns the **draft** and contains Struct name, parent Struct and a complete list of declared fields. Selection of a field in the UML canvas remains a highlight, but the Properties panel always edits the **whole Struct**. It offers add/remove/rename/type/@key/@optional on each row, and a single `Struct 전체 저장` action.

`editStructDefinition(workspace, kind, id, patch)`:

- validates name and parent constraints with the existing type editor;
- validates every field (IDL identifier, type, uniqueness, inherited names, exclusive key/optional);
- commits metadata and fields in one model transaction or returns `null` without mutation;
- preserves unknown original field metadata by `_originalName`, project Mock baselines, reference updates, and effective inherited fields;
- skips unchanged drafts rather than dirtying the workspace;
- does not change Enum member editing, official IDL, source catalogs or output schema.

## Tests and coverage

- `npm run test:qos-diagram`: six entity keys/edges, real runtime references, no fabricated QoS assignment.
- `npm run test:struct-batch`: batch edit, invalid rollback, field metadata/override preservation, inheritance and IDL validation, no-op.
- `npm run test:struct-panel`: TypeProperties composition, Form.List, store integration, UML field highlight.
- Existing `npm test` covers project migration, code generation, ICD/assets, graphs, UI wiring and layout.
- `npm run build` runs as a separate required GitHub Actions step.

## Not verified / future

- Browser interaction E2E: resizing, caret, Form.List add/reorder interactions, field save/reload; Node/static tests are not equivalent.
- DDS SDK compatibility, per-entity policy data model, QoS XML/JSON serializer and Requested/Offered matching are not implemented.
