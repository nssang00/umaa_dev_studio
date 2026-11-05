import assert from 'node:assert/strict';
import { seedWorkspace } from '../src/model/seed.js';
import { upgradeWorkspace } from '../src/model/workspaceSchema.js';
import { UMAA_COMMON_TYPE_MOCKS, UMAA_MESSAGE_FIELD_MOCKS, effectiveTypeFields } from '../src/model/mockIdlCatalog.js';

const s = seedWorkspace;
const find = name => s.messages.find(m => m.name === name) ?? s.dataTypes.find(t => t.name === name);
assert.equal(s.messages.length, 32);
assert.equal(Object.keys(UMAA_MESSAGE_FIELD_MOCKS).length, 32);
assert.equal(s.dataTypes.length, UMAA_COMMON_TYPE_MOCKS.length);
assert.equal(s.dataTypes.length, 17);
for (const m of s.messages) {
  assert.equal(m.mock, true, `${m.name} must be explicitly a mock`);
  assert.equal(m.source, 'standard');
  assert.ok(m.reference?.includes('ICD 6.0'), `${m.name} source reference missing`);
  assert.ok(Array.isArray(m.fields));
  assert.ok(m.fields.length || m.baseType, `${m.name}: no fields or inherited type`);
  assert.ok(s.topics.some(t => t.messageTypeId === m.id));
  for (const f of effectiveTypeFields(s, m)) {
    assert.ok(f.name && f.type);
    assert.ok(!(f.key && f.optional), `${m.name}.${f.name}: cannot be key + optional`);
  }
}
console.log('PASS 32 read-only ICD-derived mock message types + DDS Topic links');
const pose = find('GlobalPoseReportType');
assert.equal(pose.fields.length, 11);
assert.deepEqual(effectiveTypeFields(s, pose).map(x => x.name).slice(0, 2), ['timeStamp', 'source']);
assert.equal(pose.fields.find(x => x.name === 'altitude')?.optional, true);
assert.equal(pose.fields.find(x => x.name === 'position')?.type, 'GeoPosition2D');
const cmd = find('GlobalVectorCommandType');
assert.equal(cmd.fields.length, 6);
const allCmd = effectiveTypeFields(s, cmd);
assert.deepEqual(allCmd.filter(x=>x.key).map(x=>x.name), ['source','destination','sessionID']);
assert.equal(find('GlobalVectorCommandStatusType').fields.length, 0);
assert.ok(effectiveTypeFields(s, find('GlobalVectorCommandStatusType')).some(x=>x.name==='commandStatus'));
console.log('PASS examples: GlobalPose, GlobalVector Command, inherited key fields & Status');
const lse = find('ConditionalReportTypeConditionalsSetElement');
assert.equal(lse.fields.find(f => f.name === 'elementID')?.key, true);
assert.equal(lse.fields.find(f => f.name === 'element')?.type, 'ConditionalType');
assert.equal(find('ConditionalReportType').fields[0].type, 'LargeSet<ConditionalType>');
assert.ok(s.topicRelations.find(r => r.kind === 'large-set-element'));
console.log('PASS MM LargeSet element mock + distinct topic relationship');

// Migration from already-saved v0.8 workspace should add common catalog and
// hydrate empty standard message fields without duplicating existing custom types.
const older = structuredClone(s);
older.dataTypes = [{id:'my-custom',name:'LocalType',namespace:'ProjectCustom::Types',kind:'struct',source:'custom',fields:[{name:'v',type:'double'}]}];
older.messages.forEach(m=>{m.fields=[];delete m.mock;delete m.baseType;delete m.reference;});
const migrated = upgradeWorkspace(older);
assert.equal(migrated.dataTypes.length, UMAA_COMMON_TYPE_MOCKS.length+1);
assert.equal(migrated.dataTypes.filter(x=>x.id==='my-custom').length, 1);
assert.equal(find('GlobalPoseReportType').fields.length,11);
assert.equal(migrated.messages.find(m=>m.name==='GlobalPoseReportType').fields.length,11);
const upgradedTwice = upgradeWorkspace(migrated);
assert.equal(upgradedTwice.dataTypes.length, migrated.dataTypes.length);
assert.deepEqual(upgradedTwice.dataTypes.find(x=>x.id==='my-custom'),migrated.dataTypes.find(x=>x.id==='my-custom'));
console.log('PASS v0.8 saved-workspace migration is idempotent and preserves project custom types');
