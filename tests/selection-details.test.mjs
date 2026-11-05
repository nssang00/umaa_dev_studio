import assert from 'node:assert/strict';
import { describeSelection } from '../src/model/selectionDetails.js';

const component = { id: 'c1', name: 'Autopilot' };
const snapshot = {
  components: [component], bindings: [
    { id: 'b1', componentId: 'c1', role: 'provider' },
    { id: 'b2', componentId: 'c1', role: 'consumer' },
  ],
  services: [{ id: 's1', name: 'Navigation' }],
  operations: [{ id: 'o1', name: 'publishFix' }],
  topics: [{ id: 't1', name: 'Position' }],
  messages: [{ id: 'm1', name: 'PositionType' }],
  dataTypes: [{ id: 'd1', name: 'Identifier' }],
  qosProfiles: [{ id: 'q1', name: 'Reliable' }],
  functionalAreas: [{ id: 'f1', name: 'Motion' }],
};
const before = JSON.stringify(snapshot);
assert.equal(describeSelection(null, null), null);
assert.equal(describeSelection(snapshot, null).name, 'System Diagram');
const focused = describeSelection(snapshot, { kind: 'diagram', id: 'system' }, 'c1');
assert.equal(focused.focusedComponent, component);
assert.deepEqual(focused.focusedBindings.map(item => item.id), ['b1', 'b2']);
assert.equal(describeSelection(snapshot, { kind: 'service', id: 's1' }, 'c1').focusedComponent, null);
for (const [kind, id, name] of [
  ['service', 's1', 'Navigation'], ['operation', 'o1', 'publishFix'],
  ['topic', 't1', 'Position'], ['message', 'm1', 'PositionType'],
  ['dataType', 'd1', 'Identifier'], ['qos', 'q1', 'Reliable'],
  ['functionalArea', 'f1', 'Motion'], ['connection', 'x', 'DDS Communication'],
  ['assetLibrary', 'project', 'Asset Library'], ['dataPatterns', 'project', 'Data Patterns'],
]) {
  assert.equal(describeSelection(snapshot, { kind, id }).name, name, kind);
}
assert.equal(describeSelection(snapshot, { kind: 'message', id: 'missing' }).type, null);
assert.strictEqual(describeSelection(snapshot, {kind:'qos',id:'q1'}).qos,snapshot.qosProfiles[0]);
assert.equal(describeSelection(snapshot, {kind:'qos',id:'missing'}).qos,null);
assert.equal(describeSelection(snapshot, { kind: 'diagram' }, 'missing').focusedComponent, null);
assert.equal(JSON.stringify(snapshot), before, 'Selection projection must not mutate domain state');
console.log('PASS: pure selection details, types, focused component and missing IDs');
