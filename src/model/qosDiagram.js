/**
 * DDS QoS entity topology is conceptual, separate from stored Profile assignments.
 * These six section keys follow the EA React reference naming; no runtime entity
 * or per-entity DDS QoS policy is fabricated by this projection.
 */
export const QOS_ENTITY_SECTIONS = Object.freeze([
  { key: 'domain_participant_qos', label: 'DomainParticipant QoS', x: 0, y: 150 },
  { key: 'publisher_qos', label: 'Publisher QoS', x: 300, y: 45 },
  { key: 'subscriber_qos', label: 'Subscriber QoS', x: 300, y: 255 },
  { key: 'datawriter_qos', label: 'DataWriter QoS', x: 600, y: 45 },
  { key: 'datareader_qos', label: 'DataReader QoS', x: 600, y: 255 },
  { key: 'topic_qos', label: 'Topic QoS', x: 900, y: 150 },
]);

const DDS_RELATIONS = Object.freeze([
  ['domain_participant_qos', 'publisher_qos', 'creates'],
  ['domain_participant_qos', 'subscriber_qos', 'creates'],
  ['publisher_qos', 'datawriter_qos', 'contains'],
  ['subscriber_qos', 'datareader_qos', 'contains'],
  ['datawriter_qos', 'topic_qos', 'writes to topic'],
  ['datareader_qos', 'topic_qos', 'reads from topic'],
]);

export function buildQosEntityGraph() {
  return {
    nodes: QOS_ENTITY_SECTIONS.map(entity => ({
      id: 'entity:' + entity.key,
      position: { x: entity.x, y: entity.y },
      data: { key: entity.key, label: entity.label, concept: true },
    })),
    edges: DDS_RELATIONS.map(([from, to, relation]) => ({
      id: from + ':' + to,
      source: 'entity:' + from,
      target: 'entity:' + to,
      label: relation,
    })),
  };
}

/** Reads only actual workspace references. No per-entity policy is inferred. */
export function buildQosProfileGraph(workspace, profileId) {
  const profile = workspace?.qosProfiles?.find(item => item.id === profileId);
  if (!profile) return { nodes: [], edges: [], uses: [], profile: null };
  const base = workspace.qosProfiles.find(item => item.id === profile.baseProfileId);
  const uses = (workspace.components ?? []).filter(
    component => workspace.componentRuntime?.[component.id]?.qosProfileId === profileId,
  );
  const baseRef = profile.baseProfileId
    ? { id: 'base:' + profile.baseProfileId, label: base ? 'Base: ' + base.name : 'Missing base: ' + profile.baseProfileId }
    : null;
  const nodes = [
    ...(baseRef ? [{
      id: baseRef.id, position: { x: 20, y: 40 },
      data: { label: baseRef.label, reference: true },
    }] : []),
    { id: 'profile:' + profile.id, position: { x: baseRef ? 325 : 20, y: 40 },
      data: { label: 'QoS Profile: ' + profile.name, reference: true } },
    ...uses.map((component, index) => ({
      id: 'component:' + component.id,
      position: { x: baseRef ? 640 : 335, y: 20 + 90 * index },
      data: { label: 'Component: ' + component.name, reference: true },
    })),
  ];
  const edges = [
    ...(baseRef ? [{
      id: 'base-link', source: baseRef.id, target: 'profile:' + profile.id,
      label: 'baseProfileId (reference)',
    }] : []),
    ...uses.map(component => ({
      id: 'used:' + component.id, source: 'profile:' + profile.id,
      target: 'component:' + component.id,
      label: 'componentRuntime.qosProfileId',
    })),
  ];
  return { nodes, edges, uses, profile };
}
