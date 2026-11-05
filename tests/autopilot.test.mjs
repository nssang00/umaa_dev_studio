import assert from 'node:assert/strict';
import { seedWorkspace as s } from '../src/model/seed.js';
import { deriveEndpoints } from '../src/logic/endpoints.js';
import { validateWorkspace } from '../src/logic/validation.js';
import { generateComponentFiles } from '../src/logic/codegen.js';
import { parseWorkspaceImport } from '../src/model/validateImport.js';

const expectedProvider = [
  'PrimitiveDriverControl','GlobalVectorControl','UVPlatformSpecs','LogReport',
  'GlobalHoverControl','HealthReport','ActiveConstraintsControl',
];
const expectedConsumer = [
  'GlobalPoseStatus','VelocityStatus','SpeedStatus','WindStatus',
  'WaterCurrentStatus','MissionPlanConstraintControl','ConditionalReport',
];
const auto = s.bindings.filter(b => b.componentId === 'autopilot');
const byRole = role => auto.filter(b => b.role === role).map(b => s.services.find(svc => svc.id === b.serviceId)?.name).sort();
assert.deepEqual(byRole('provider'), expectedProvider.sort());
assert.deepEqual(byRole('consumer'), expectedConsumer.sort());
assert.equal(s.services.length, 14);
assert.equal(s.functionalAreas.length, 8);
assert.equal(s.components.length, 7);
assert.equal(s.interfaces.length, 14);
assert.equal(s.operations.length, 56);
assert.equal(s.topics.length, 32);
assert.equal(auto.length, 14);
assert.equal(s.bindings.length, 44);
assert.equal(s.connections.length, 28);
const errors = validateWorkspace(s).filter(e => e.severity === 'error');
assert.deepEqual(errors, [], JSON.stringify(errors));
for (const service of s.services) {
  const ops=s.operations.filter(o => o.serviceId === service.id);
  const interfaces=s.interfaces.filter(i => i.serviceId === service.id);
  assert.equal(interfaces.length,1,`${service.name} interface count`);
  assert.equal(interfaces[0].operationIds.length,ops.length,`${service.name} all operations`);
  assert(ops.every(o=>s.topics.some(t=>t.id===o.topicId)), `${service.name} topic mapping`);
  assert(ops.every(o=>s.messages.some(m=>m.id===s.topics.find(t=>t.id===o.topicId).messageTypeId)),`${service.name} IDL mapping`);
}
const matchOp=(name,op,topic,action)=> {
  const svc=s.services.find(x=>x.name===name);
  const found=s.operations.find(o=>o.serviceId===svc.id && o.name===op && o.action===action);
  assert(found,`${name}/${op}/${action}`);
  assert.equal(s.topics.find(t=>t.id===found.topicId)?.name,topic);
};
matchOp('ActiveConstraintsControl','setActiveConstraints','ActiveConstraintsCommandType','publish');
matchOp('ActiveConstraintsControl','cancelActiveConstraintsCommand','ActiveConstraintsCommandType','dispose');
matchOp('PrimitiveDriverControl','reportPrimitiveDriverExecutionStatus','PrimitiveDriverExecutionStatusReportType','publish');
matchOp('PrimitiveDriverControl','queryPrimitiveDriverCommandAck','PrimitiveDriverCommandAckReportType','subscribe');
for(const suffix of ['Add','Delete']) {
  matchOp('MissionPlanConstraintControl',`setMissionPlanConstraint${suffix}`,`MissionPlanConstraint${suffix}CommandType`,'publish');
  matchOp('MissionPlanConstraintControl',`queryMissionPlanConstraint${suffix}CommandAck`,`MissionPlanConstraint${suffix}CommandAckReportType`,'subscribe');
  matchOp('MissionPlanConstraintControl',`cancelMissionPlanConstraint${suffix}Command`,`MissionPlanConstraint${suffix}CommandType`,'dispose');
}
assert.equal(s.operations.filter(o=>o.serviceId==='svc-ActiveConstraintsControl').length,5);
assert.equal(s.operations.filter(o=>o.serviceId==='svc-PrimitiveDriverControl').length,7);
assert.equal(s.operations.filter(o=>o.serviceId==='svc-MissionPlanConstraintControl').length,10);
assert.equal(s.operations.some(o=>o.serviceId==='svc-ActiveConstraintsControl' && o.name.includes('ExecutionStatus')),false);
assert.equal(s.operations.some(o=>o.serviceId==='svc-MissionPlanConstraintControl' && o.name==='setMissionPlanConstraint'),false);
const ends=deriveEndpoints(s,'autopilot');
assert.equal(ends.length,32);
assert(ends.some(e=>e.serviceName==='PrimitiveDriverControl' && e.topicName==='PrimitiveDriverCommandType' && e.direction==='reader'));
assert(ends.some(e=>e.serviceName==='ActiveConstraintsControl' && e.topicName==='ActiveConstraintsCommandType' && e.direction==='reader'));
assert(ends.some(e=>e.serviceName==='MissionPlanConstraintControl' && e.topicName==='MissionPlanConstraintAddCommandType' && e.direction==='writer'));
assert(ends.some(e=>e.serviceName==='MissionPlanConstraintControl' && e.topicName==='MissionPlanConstraintDeleteCommandStatusType' && e.direction==='reader'));
assert(ends.some(e=>e.serviceName==='ConditionalReport' && e.topicName==='ConditionalReportTypeConditionalsSetElement' && e.direction==='reader'));
assert(!ends.some(e=>e.serviceName==='GlobalPoseStatus' && e.topicName.includes('Query')));
const generated=generateComponentFiles(s,'autopilot');
const get=path=>generated.find(f=>f.path===path)?.content;
const manifest=JSON.parse(get('component.manifest.json'));
const contract=JSON.parse(get('contracts/service-operations.json'));
assert.equal(contract.serviceCount,14);
assert.equal(contract.contract.length,14);
assert.equal(contract.contract.find(r=>r.service==='MissionPlanConstraintControl').operations.length,10);
assert.equal(manifest.endpoints.length,32);
assert.equal(manifest.generationLevel,'mock-scaffold');
assert.equal(manifest.requiredStandardIDL.length,32); // every Endpoint's Topic type is official; deduplicated
assert(get('contracts/topic-endpoints.csv').split('\n').length>=33);
assert(get('CMakeLists.txt').includes('add_library(Autopilot SHARED'));
assert(!generated.some(f=>f.path.startsWith('idl/standard/') && f.path.endsWith('.idl')));
// Backward compatible import of an older workspace schema.
const old=structuredClone(s);delete old.interfaces;delete old.topicRelations;delete old.functionalAreas;
const parsed=parseWorkspaceImport(old);
assert.equal(parsed.interfaces.length,14);
assert.equal(parsed.functionalAreas.length,8);
console.log(`PASS 14 Autopilot Service Bindings (7P+7C), ${s.operations.length} Operations, ${s.topics.length} Topics, ${ends.length} endpoints`);
console.log('PASS Exact MM/MO command topics and DDS actions (subscribe/dispose)');
console.log('PASS CMake shared-library scaffold, contracts, official IDL references, import migration');
