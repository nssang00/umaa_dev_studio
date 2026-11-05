import assert from 'node:assert/strict';
import { seedWorkspace } from '../src/model/seed.js';
import { editStructDefinition } from '../src/model/typeEditing.js';
import { effectiveTypeFields } from '../src/model/mockIdlCatalog.js';
import { upgradeWorkspace } from '../src/model/workspaceSchema.js';

const original = structuredClone(seedWorkspace);
const selected = original.messages.find(x => x.name === 'GlobalPoseReportType');
assert.ok(selected && selected.kind === 'struct');
const fields = structuredClone(selected.fields);
const nextFields = [
  ...fields.map(f => ({ ...f, _originalName:f.name })),
  { name:'qualityScore', type:'double', key:false, optional:true },
];
let next = editStructDefinition(original,'message',selected.id,{
  name:'GlobalPoseReportProjectType', baseType:selected.baseType, fields:nextFields,
});
assert.ok(next, 'batch must commit both name and fields');
const updated = next.messages.find(x=>x.id===selected.id);
assert.equal(updated.name,'GlobalPoseReportProjectType');
assert.equal(updated.fields.length, fields.length+1);
assert.equal(updated.fields.at(-1).optional,true);
assert.ok(updated.projectOverride);
assert.deepEqual(updated.mockBaseline.fields,fields);
assert.equal(original.messages.find(x=>x.id===selected.id).name,selected.name,'must not mutate baseline');
assert.ok(next.topics.some(t=>t.messageTypeId===selected.id),'references by id remain linked');
assert.equal(upgradeWorkspace(JSON.parse(JSON.stringify(next))).messages.find(t=>t.id===selected.id).fields.length,fields.length+1);

const fail = (patch) => assert.equal(editStructDefinition(original,'message',selected.id,patch),null);
const base = {name:'WouldRename',baseType:selected.baseType};
fail({...base,fields:[...fields,{name:fields[0].name,type:'double'}]});
fail({...base,fields:[...fields,{name:'timeStamp',type:'double'}]}); // inherited collision
fail({...base,fields:[...fields,{name:'bad field',type:'double'}]});
fail({...base,fields:[...fields,{name:'newField',type:'double',key:true,optional:true}]});
fail({...base,fields:[...fields,{name:'newField',type:''}]});
fail({...base,fields:[] ,baseType:selected.namespace+'::'+selected.name}); // own parent
fail({...base,fields:null});
assert.equal(editStructDefinition(original,'message',selected.id,{name:selected.name,baseType:selected.baseType,fields:fields}),original,'no-op must not dirty project');

// Rename/delete/multi-change in one transaction and preserve existing metadata.
const changed=fields.map((f,i)=>i===0?{...f,_originalName:f.name,name:'newAltitude'}:{...f,_originalName:f.name});
const renamed=editStructDefinition(original,'message',selected.id,{name:selected.name,baseType:selected.baseType,fields:changed.slice(0,-1)});
assert.ok(renamed);
assert.equal(renamed.messages.find(t=>t.id===selected.id).fields.length,fields.length-1);
assert.equal(renamed.messages.find(t=>t.id===selected.id).fields[0].name,'newAltitude');
assert.equal(effectiveTypeFields(renamed,renamed.messages.find(t=>t.id===selected.id)).some(f=>f.name==='newAltitude'),true);

// Keep Enum out of Struct-only edit path.
const enumType=original.dataTypes.find(t=>t.kind==='enum');
if(enumType) assert.equal(editStructDefinition(original,'dataType',enumType.id,{name:enumType.name,fields:[]}),null);
assert.deepEqual(original,structuredClone(seedWorkspace),'invalid attempts must not mutate input');
console.log('PASS atomic Struct-wide Properties editing, inherited field protection, no-op, enum isolation');
