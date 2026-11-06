import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { seedWorkspace } from '../src/model/seed.js';
import { describeSelection } from '../src/model/selectionDetails.js';
import { editQosEntityField } from '../src/model/qosPolicies.js';
const read = path => readFileSync(new URL(path, import.meta.url), 'utf8');

const diagram=read('../src/components/qos/QosProfileDiagram.jsx');
const properties=read('../src/components/QosProperties.jsx');
const metadata=read('../src/components/QosProfileFields.jsx');
const context=read('../src/components/ContextProperties.jsx');
const sections=read('../src/components/QosEntitySections.jsx');
const css=read('../src/styles.css');

// @xyflow/react v12: when selectable AND draggable are both false,
// the node wrapper defaults to pointer-events:none. Node style wins over
// the wrapper's default (spread order in NodeWrapper).
assert.match(diagram,/style:\s*\{\s*pointerEvents:\s*'all'\s*\}/);
assert.match(diagram,/nodesDraggable=\{false\}/);
assert.match(diagram,/elementsSelectable=\{false\}/);
assert.match(diagram,/panOnDrag=\{false\}/);
assert.match(diagram,/zoomOnDoubleClick=\{false\}/);
assert.match(diagram,/nodesFocusable=\{false\}/);
assert.doesNotMatch(diagram,/onPointerDown=\{event => event.stopPropagation\(\)\}/);
assert.match(diagram,/QosProfileFields/);
assert.match(diagram,/QosEntitySections/);

assert.match(context,/kind==='qos'.*QosProperties/);
assert.match(properties,/QosProfileFields/);
assert.match(properties,/QosEntitySections/);
assert.match(properties,/updateQosEntityField/);
assert.match(properties,/updateQosProfile/);
assert.match(metadata,/onMetaChange/);
assert.match(sections,/QosPolicyAccordion/);
assert.match(css,/\.qos-properties \.qos-policy-controls \{ grid-template-columns:minmax\(0,1fr\)/);

const snapshot=structuredClone(seedWorkspace);
const profile=snapshot.qosProfiles[0];
assert.strictEqual(describeSelection(snapshot,{kind:'qos',id:profile.id}).qos,profile);
assert.equal(describeSelection(snapshot,{kind:'qos',id:'missing'}).qos,null);
const changed=editQosEntityField(snapshot,profile.id,'topic_qos','reliability','kind','best_effort');
assert.equal(changed.qosProfiles.find(x=>x.id===profile.id).topic_qos.reliability.kind,'best_effort');
assert.equal(snapshot.qosProfiles.find(x=>x.id===profile.id).topic_qos.reliability.kind,'reliable');
console.log('PASS QoS node pointer interaction, Properties reuse and single Profile model');
