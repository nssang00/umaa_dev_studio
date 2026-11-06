import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const folders=['assembly','service','types','qos','shared/graph'];
const graph=read('../src/components/shared/graph/ModelGraphCanvas.jsx');
for(const marker of ['ReactFlow','Background','Controls','MiniMap','children','nodes','edges','nodeTypes'])
  assert.ok(graph.includes(marker),'missing graph composition: '+marker);
for(const path of [
  '../src/components/service/ContractGraph.jsx',
  '../src/components/types/TypeGraph.jsx',
  '../src/components/qos/QosProfileDiagram.jsx',
])assert.match(read(path),/ModelGraphCanvas/);
for(const [file,target] of [
  ['ComponentJourney','assembly/ComponentJourney'],
  ['ContractGraph','service/ContractGraph'],
  ['TypeGraph','types/TypeGraph'],
  ['QosProfileDiagram','qos/QosProfileDiagram'],
])assert.ok(read('../src/components/'+file+'.jsx').includes("from './"+target+".jsx'"),'compatibility '+file);
const form=read('../src/components/service/OperationFields.jsx');
assert.match(form,/interfaceDirection|INPUT\/OUTPUT/);
for(const marker of ['name="topicId"','name="action"','name="direction"','name="actor"'])
  assert.ok(form.includes(marker),'shared operation field '+marker);
for(const path of ['../src/components/service/ContractGraph.jsx','../src/components/DesignDetails.jsx'])
  assert.match(read(path),/OperationFields/);
const assembly=read('../src/components/assembly/ComponentJourney.jsx');
assert.match(assembly,/ServiceBindingSection/);
assert.match(assembly,/ServiceAddModal/);
const section=read('../src/components/assembly/ServiceBindingSection.jsx');
assert.match(section,/role==='provider'/);
assert.match(section,/onAdd/);
assert.match(section,/onRemove/);
assert.match(section,/onContract/);
assert.ok(folders.length===5);
console.log('PASS: feature Assembly and shared Service Operation + ReactFlow graph composition');
