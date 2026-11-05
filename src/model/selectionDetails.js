/**
 * Pure selection projection shared by Properties panel, diagrams and tests.
 * This is read-only: never derive or mutate UMAA domain relationships here.
 */
const NAMES = Object.freeze({
  connection: 'DDS Communication',
  assetLibrary: 'Asset Library',
  dataPatterns: 'Data Patterns',
});

export function describeSelection(snapshot, selection, highlightedComponentId = null) {
  if (!snapshot) return null;
  const kind = selection?.kind ?? 'diagram';
  const id = selection?.id;
  const find = list => (list ?? []).find(item => item.id === id) ?? null;
  const svc = kind === 'service' ? find(snapshot.services) : null;
  const op = kind === 'operation' ? find(snapshot.operations) : null;
  const topic = kind === 'topic' ? find(snapshot.topics) : null;
  const type = kind === 'message' ? find(snapshot.messages)
    : kind === 'dataType' ? find(snapshot.dataTypes) : null;
  const qos = kind === 'qos' ? find(snapshot.qosProfiles) : null;
  const area = kind === 'functionalArea' ? find(snapshot.functionalAreas) : null;
  const focusedComponent = kind === 'diagram' && highlightedComponentId
    ? (snapshot.components ?? []).find(item => item.id === highlightedComponentId) ?? null
    : null;
  const focusedBindings = focusedComponent
    ? (snapshot.bindings ?? []).filter(item => item.componentId === focusedComponent.id)
    : [];
  const name = svc?.name ?? op?.name ?? topic?.name ?? type?.name ?? qos?.name
    ?? area?.name ?? NAMES[kind] ?? 'System Diagram';
  return { kind, id, name, svc, op, topic, type, qos, focusedComponent, focusedBindings };
}
