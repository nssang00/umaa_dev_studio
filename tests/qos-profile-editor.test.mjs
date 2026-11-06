import assert from 'node:assert/strict';
import { seedWorkspace } from '../src/model/seed.js';
import { upgradeWorkspace } from '../src/model/workspaceSchema.js';
import { parseWorkspaceImport } from '../src/model/validateImport.js';
import {
  QOS_SECTION_KEYS, QOS_SECTION_CATALOG, withQosEntitySections,
  editQosEntityField, findInvalidQosEntityValues,
} from '../src/model/qosPolicies.js';
import { readFileSync } from 'node:fs';
import { validateWorkspace } from '../src/logic/validation.js';
const read = f => readFileSync(new URL(f, import.meta.url), 'utf8');

assert.deepEqual(QOS_SECTION_KEYS, [
  'domain_participant_qos', 'topic_qos', 'publisher_qos',
  'subscriber_qos', 'datawriter_qos', 'datareader_qos',
]);
assert.equal(QOS_SECTION_CATALOG.length, 6);
const legacy = { id:'old',source:'project',reliability:'best_effort',
  durability:'transient_local',historyKind:'keep_all',historyDepth:5,
  presentationAccessScope:'group',orderedAccess:true,coherentAccess:true };
const migrated = withQosEntitySections(legacy);
assert.equal(migrated.topic_qos.reliability.kind, 'best_effort');
assert.equal(migrated.datawriter_qos.history.depth, 5);
assert.equal(migrated.datareader_qos.durability.kind, 'transient_local');
assert.equal(migrated.publisher_qos.presentation.access_scope, 'group');
assert.equal(migrated.subscriber_qos.presentation.coherent_access, true);
assert.equal(migrated.domain_participant_qos.entity_factory.autoenable_created_entities,true);
assert.equal(withQosEntitySections({...legacy,topic_qos:{reliability:{kind:'reliable'}}}).topic_qos.reliability.kind,'reliable');
assert.deepEqual(findInvalidQosEntityValues(migrated),[]);
assert.equal(migrated.reliability, 'best_effort', 'legacy data retained');
const snap=structuredClone(seedWorkspace);
const profile=snap.qosProfiles.find(q=>q.source==='project');
const id=profile.id;
let change=editQosEntityField(snap,id,'topic_qos','reliability','kind','best_effort');
assert.ok(change && change!==snap);
assert.equal(change.qosProfiles.find(q=>q.id===id).topic_qos.reliability.kind,'best_effort');
assert.equal(editQosEntityField(change,id,'topic_qos','reliability','kind','best_effort'),change,'no-op');
change=editQosEntityField(change,id,'publisher_qos','presentation','coherent_access',true);
change=editQosEntityField(change,id,'datareader_qos','deadline','period_ms',250);
change=editQosEntityField(change,id,'domain_participant_qos','entity_factory','autoenable_created_entities',false);
assert.equal(change.qosProfiles.find(q=>q.id===id).subscriber_qos.presentation.coherent_access,false,'sections independent');
assert.equal(change.qosProfiles.find(q=>q.id===id).datareader_qos.deadline.period_ms,250);
assert.equal(editQosEntityField(change,id,'datareader_qos','deadline','period_ms',null)?.qosProfiles[0]?.datareader_qos?.deadline?.period_ms,null);
for(const args of [
 ['topic_qos','reliability','kind','impossible'], ['publisher_qos','presentation','ordered_access','true'],
 ['topic_qos','history','depth',0],['datareader_qos','deadline','period_ms',-1],
 ['nope','reliability','kind','reliable'],['topic_qos','nope','kind','reliable'],
]) assert.equal(editQosEntityField(change,id,...args),null, 'reject invalid '+args.join('.'));
assert.deepEqual(snap,structuredClone(seedWorkspace),'model input immutable');
const invalidSaved=structuredClone(change);
invalidSaved.qosProfiles.find(q=>q.id===id).datawriter_qos.history.depth=0;
assert.ok(validateWorkspace(invalidSaved).some(issue => issue.code === 'QOS_POLICY_VALUE' && issue.entityId === id));
assert.equal(validateWorkspace(change).some(issue => issue.code === 'QOS_POLICY_VALUE'),false);
const persisted=parseWorkspaceImport(JSON.parse(JSON.stringify(change)));
assert.equal(persisted.qosProfiles.find(q=>q.id===id).datareader_qos.deadline.period_ms,250);
const upgraded=upgradeWorkspace({ ...snap,qosProfiles:[legacy] });
assert.equal(upgraded.qosProfiles.find(q=>q.id==='old').topic_qos.reliability.kind,'best_effort');
const diagram=read('../src/components/qos/QosProfileDiagram.jsx');
const acc=read('../src/components/QosEntitySections.jsx');
const nested=read('../src/components/QosPolicyAccordion.jsx');
const controls=read('../src/components/QosPolicyFieldControl.jsx');
const workbench=read('../src/components/ContractWorkbench.jsx');
const store=read('../src/stores/useEditorStore.js');
assert.match(diagram,/ModelGraphCanvas/);
assert.match(read('../src/components/shared/graph/ModelGraphCanvas.jsx'),/ReactFlow/);
assert.match(diagram,/nodeTypes=\{nodeTypes\}/);
assert.match(acc,/QOS_SECTION_CATALOG/);
assert.match(acc,/QosPolicyAccordion/);
assert.match(nested,/QosPolicyFieldControl/);
assert.match(controls,/InputNumber/);
assert.match(workbench,/QosProfileDiagram profileId=\{id\}/);
assert.doesNotMatch(workbench,/QosUsageDiagram/);
assert.match(store,/updateQosEntityField/);
console.log('PASS nested six-section QoS Profile editor, migration, typed atomic policy updates');
