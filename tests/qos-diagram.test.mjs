import assert from 'node:assert/strict';
import { seedWorkspace } from '../src/model/seed.js';
import { QOS_ENTITY_SECTIONS, buildQosEntityGraph, buildQosProfileGraph } from '../src/model/qosDiagram.js';

const expected = [
  'domain_participant_qos', 'topic_qos', 'publisher_qos',
  'subscriber_qos', 'datawriter_qos', 'datareader_qos',
];
assert.deepEqual([...QOS_ENTITY_SECTIONS.map(x => x.key)].sort(), [...expected].sort());
const diagram = buildQosEntityGraph();
assert.equal(diagram.nodes.length, 6);
assert.equal(diagram.edges.length, 6);
for (const edge of diagram.edges) {
  assert.ok(diagram.nodes.some(node => node.id === edge.source));
  assert.ok(diagram.nodes.some(node => node.id === edge.target));
}
const original = structuredClone(seedWorkspace);
const snapshot = structuredClone(seedWorkspace);
const current = snapshot.qosProfiles[0];
const initial = buildQosProfileGraph(snapshot, current.id);
assert.equal(initial.profile.id, current.id);
assert.equal(initial.uses.length, snapshot.components.filter(c => snapshot.componentRuntime[c.id]?.qosProfileId === current.id).length);
const isolated = { ...snapshot, qosProfiles: [...snapshot.qosProfiles, { ...current, id: 'child', name: 'Child', baseProfileId: current.id }] };
const graph = buildQosProfileGraph(isolated, 'child');
assert.ok(graph.edges.some(e => e.label.startsWith('baseProfileId')));
assert.ok(!graph.edges.some(e => e.label.includes('datawriter_qos')), 'must not invent entity-policy assignments');
assert.deepEqual(buildQosProfileGraph(snapshot, 'missing').nodes, []);
assert.deepEqual(original, snapshot, 'projection must not mutate source data');
console.log('PASS QoS six entity concepts and real reference-only topology');
