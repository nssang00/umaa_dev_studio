import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { seedWorkspace } from '../src/model/seed.js';
import { upgradeWorkspace } from '../src/model/workspaceSchema.js';
import { parseWorkspaceImport } from '../src/model/validateImport.js';
import { validateWorkspace } from '../src/logic/validation.js';
import { legacyDirectionFromName, serviceOperationDirection } from '../src/model/interfaceDirection.js';
import { serviceContractTree } from '../src/model/projectNavigation.js';
const read=x=>readFileSync(new URL(x,import.meta.url),'utf8');
const s=structuredClone(seedWorkspace);
const query=s.operations.find(op=>op.action==='subscribe' && op.actor==='consumer');
assert.ok(query);
assert.equal(serviceOperationDirection(query),'input','Query is INPUT even when Consumer subscribes');
assert.equal(legacyDirectionFromName('queryAnchorCommandAck'),'input');
assert.equal(legacyDirectionFromName('reportAnchorCommandStatus'),'output');
assert.equal(legacyDirectionFromName('customMethod'),null);
assert.equal(serviceOperationDirection({actor:'consumer',action:'subscribe'}),null,
  'must not derive Interface direction from DDS actor/action');
assert.equal(serviceOperationDirection({interfaceDirection:'output',actor:'consumer',action:'subscribe'}),'output',
  'explicit contract direction wins');
const copy=structuredClone(s);
const idx=copy.operations.findIndex(op=>op.id===query.id);
delete copy.operations[idx].interfaceDirection;
delete copy.operations[idx].interfaceDirectionSource;
const migrated=upgradeWorkspace(copy);
const old=migrated.operations.find(op=>op.id===query.id);
assert.equal(old.interfaceDirection,'input');
assert.equal(old.interfaceDirectionSource,'legacy-name');
assert.equal(query.interfaceDirectionSource,'curated-seed');
assert.equal(parseWorkspaceImport(JSON.parse(JSON.stringify(migrated))).operations[idx].interfaceDirection,'input');
const unknown={...query,id:'unknown-op',name:'pulseSignal',interfaceDirection:null,interfaceDirectionSource:'unspecified'};
const svc=s.services.find(x=>x.id===query.serviceId);
const incomplete={...s,operations:[...s.operations,unknown]};
assert.ok(validateWorkspace(incomplete).some(e=>e.code==='INTERFACE_DIRECTION_UNSPECIFIED'&&e.entityId==='unknown-op'));
const invalid={...s,operations:[...s.operations,{...unknown,interfaceDirection:'sideways'}]};
assert.ok(validateWorkspace(invalid).some(e=>e.code==='INVALID_INTERFACE_DIRECTION'));
const tree=serviceContractTree(incomplete,svc);
assert.equal(tree.children.find(x=>x.label==='Interfaces').children.at(-1).label,'Direction review required');
assert.ok(tree.children.find(x=>x.label==='Interfaces').children.at(-1).children.some(x=>x.selection.id==='unknown-op'));
const store=read('../src/stores/useEditorStore.js');
assert.match(store,/interfaceDirection:direction/);
assert.match(store,/interfaceDirection:legacyDirectionFromName\(op.name\)/);
for (const path of ['../src/components/ContractGraph.jsx','../src/components/DesignDetails.jsx']) {
  const ui=read(path);
  assert.match(ui,/name="direction"/);
  assert.match(ui,/name="actor"/);
  assert.doesNotMatch(ui,/actorForOperation/);
}
console.log('PASS independent Interface INPUT/OUTPUT, Query INPUT, migration, persistence and UI actor separation');

import { useEditorStore } from '../src/stores/useEditorStore.js';
const customService={...svc,id:'service-custom-dir',name:'CustomDirectionTest',source:'custom'};
const customOp={...query,id:'operation-custom-dir',serviceId:customService.id,name:'queryCustomSignal',
  interfaceDirection:null,interfaceDirectionSource:'unspecified'};
const customSnapshot={...structuredClone(s),services:[...s.services,customService],
  operations:[...s.operations,customOp]};
useEditorStore.setState({snapshot:customSnapshot,dirty:false});
assert.equal(useEditorStore.getState().updateCustomOperationDirection(customOp.id,'sideways'),false);
assert.equal(useEditorStore.getState().updateCustomOperationDirection(query.id,'output'),false,'standard cannot be mutated');
assert.equal(useEditorStore.getState().updateCustomOperationDirection(customOp.id,'input'),true);
assert.equal(useEditorStore.getState().snapshot.operations.find(x=>x.id===customOp.id).interfaceDirection,'input');
assert.equal(useEditorStore.getState().snapshot.operations.find(x=>x.id===customOp.id).interfaceDirectionSource,'user');
assert.equal(useEditorStore.getState().dirty,true);
assert.equal(useEditorStore.getState().updateCustomOperationDirection(customOp.id,'input'),true,'no-op is allowed');
assert.equal(customSnapshot.operations.find(x=>x.id===customOp.id).interfaceDirection,null,'original immutable');
for(const path of ['../src/components/ContractWorkbench.jsx','../src/components/ContextProperties.jsx']){
  const ui=read(path);
  assert.match(ui,/updateCustomOperationDirection/);
  assert.match(ui,/INPUT\/OUTPUT|INPUT · To Provider/);
}

import { generateComponentFiles } from '../src/logic/codegen.js';
const generated=generateComponentFiles(s,'autopilot');
const contract=JSON.parse(generated.find(f=>f.path==='contracts/service-operations.json').content);
const emittedQuery=contract.contract.flatMap(row=>row.operations).find(op=>op.name===query.name);
assert.ok(emittedQuery && emittedQuery.interfaceDirection==='input');
assert.equal(emittedQuery.action,'subscribe','wire action remains separate');
