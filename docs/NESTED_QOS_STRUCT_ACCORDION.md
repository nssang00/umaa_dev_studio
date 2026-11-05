# Nested QoS Profile & Struct Field Accordions — 2026-11-05

## User interaction

The previous QoS concept/usage diagrams were not the requested editor. QoSWorkbench now has one ReactFlow canvas, with one editable \`qos_profile\` node. Inside it, six entity sections expand/collapse:

- \`domain_participant_qos\`
- \`topic_qos\`
- \`publisher_qos\`
- \`subscriber_qos\`
- \`datawriter_qos\`
- \`datareader_qos\`

Each section has individual expandable policies. Policy fields support typed controls (Select, Checkbox, InputNumber, Input) and update only the appropriate entity/policy path. Accordion state is transient UI state; the values persist in the project's \`qosProfiles[]\`. Diagram contents scroll inside the node to avoid shrinking the canvas when expanded.

## Architecture

- \`src/model/qosPolicies.js\`: curated policy/field catalog, validation, migration from legacy flat fields, immutable updates.
- \`QosProfileDiagram.jsx\`: ReactFlow canvas and profile node composition, wired to existing store command methods.
- \`QosEntitySections.jsx\` → \`QosPolicyAccordion.jsx\` → \`QosPolicyFieldControl.jsx\`: independent nested UI blocks.
- \`useEditorStore.updateQosEntityField(...)\`: a narrow validated action; the StudioShell and other editors do not import QoS internals.

The catalog is a deliberately limited design schema and **is not a complete OMG DDS-JSON/DDS XML standard implementation**. Legacy flat settings remain in the JSON for compatibility; where a nested value already exists it is not overwritten. Base Profile remains a reference (policy merge/inheritance not executed). No DDS vendor integration or Offered/Requested validator is implemented.

## Struct

The right Properties panel still owns the single Struct draft and single atomic \`Struct 전체 저장\` action. \`StructFieldAccordionList\` shows all declared fields as collapsible rows. \`StructFieldEditor\` edits name, IDL type, @key, @optional, description and optional default value **as design text**, not compiled IDL defaults. Selecting a UML field expands its row. Inherited fields remain parent-owned. Core model validates complete fields before saving, preserves the Mock baseline and adds no compiled official IDL.

## Validation

- \`npm run test:qos-editor\`: six sections, migration, independent edits, validation, persistence and wiring.
- \`npm run test:struct-accordion\`: field accordion wiring, metadata editing, no-op and atomic save.
- Full \`npm test\` and \`npm run build\`: GitHub Actions required checks.
- Browser E2E of nested form/diagram interactions is not yet provided and should not be represented as verified.

Reference design approach from \`ea_react\`: nested section and policy composition with explicit model and view boundaries; the reference's visual styling and DDS JSON storage are not copied.
