import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { seedWorkspace } from '../src/model/seed.js';
import { serviceOperationDirection, serviceContractTree,
  projectModelTree, expandedTreeKeys } from '../src/model/projectNavigation.js';
import { serviceContractGraph } from '../src/logic/editorGraphs.js';
const s=structuredClone(seedWorkspace);
const sample=s.services.find(svc=>svc.flowControl==='command-response');
assert.ok(sample);
const ops=s.operations.filter(op=>op.serviceId===sample.id);
assert.ok(ops.some(op=>serviceOperationDirection(op)==='input' && op.action==='publish'));
assert.ok(ops.some(op=>serviceOperationDirection(op)==='output' && op.action==='publish'));
assert.ok(ops.filter(op=>op.action==='subscribe'&&op.actor==='consumer').every(op=>serviceOperationDirection(op)==='input'));
assert.equal(serviceOperationDirection({action:'subscribe',actor:'consumer',interfaceDirection:'input'}),'input');
assert.equal(serviceOperationDirection({action:'subscribe',actor:'consumer'}),null);
assert.equal(serviceOperationDirection({action:'publish',actor:'provider',interfaceDirection:'input'}),'input');
const roots=projectModelTree(s);
assert.deepEqual(roots.map(x=>x.label.split(' · ')[0]),['UMAA ICD Catalog','Project Service Model','System Model']);
const catalog=roots[0],project=roots[1],system=roots[2];
assert.deepEqual(catalog.children.map(x=>x.label),['Services','Interfaces','Operations','Topics','Data Types','Flow Control Rules']);
assert.ok(catalog.badge.includes('Read only'));
assert.ok(project.children.some(x=>x.label==='Standard Service References'));
assert.ok(system.children.some(x=>x.label==='Components'));
assert.ok(system.children.some(x=>x.label==='DDS Configuration'));
const byService=serviceContractTree(s,sample);
const directionGroups=byService.children.find(x=>x.label==='Interfaces').children;
assert.deepEqual(directionGroups.map(x=>x.label),['INPUT · To Provider','OUTPUT · From Provider']);
assert.equal(directionGroups.flatMap(x=>x.children).length,ops.length);
const graph=serviceContractGraph(s,sample.id);
assert.equal(graph.nodes.filter(x=>x.kind==='interface').length,2);
assert.equal(graph.nodes.filter(x=>x.kind==='operation').length,ops.length);
const found=projectModelTree(s,'Command / Response');
assert.ok(expandedTreeKeys(found).length>0);
const allOps=roots[0].children.find(x=>x.label==='Operations').children;
assert.ok(allOps.every(n=>n.selection?.kind==='operation'));
const cssSource=readFileSync(new URL('../src/components/explorer/ProjectModelExplorer.jsx',import.meta.url),'utf8');
assert.match(cssSource,/onCreate/);
assert.match(cssSource,/selectedKeys/);
assert.match(readFileSync(new URL('../src/App.jsx',import.meta.url),'utf8'),/serviceCategory: 'control'/);
console.log('PASS three-model Explorer, ICD references, direction grouping, Service Type creation wiring');

const sourceGraph=readFileSync(new URL('../src/components/service/ContractGraph.jsx',import.meta.url),'utf8');
const sourceDetails=readFileSync(new URL('../src/components/DesignDetails.jsx',import.meta.url),'utf8');
const sharedOperationFields=readFileSync(new URL('../src/components/service/OperationFields.jsx',import.meta.url),'utf8');
for(const source of [sourceGraph,sourceDetails]) {
  assert.match(source,/OperationFields/);
  assert.match(source,/v.actor/);
  assert.match(source,/v.direction/);
}
assert.match(sharedOperationFields,/name="direction"/);
assert.match(sharedOperationFields,/name="actor" label="DDS Actor/);

const operationEditor=readFileSync(new URL('../src/components/ContractWorkbench.jsx',import.meta.url),'utf8');
const inspector=readFileSync(new URL('../src/components/ContextProperties.jsx',import.meta.url),'utf8');
assert.match(operationEditor,/Interface Direction/);
assert.match(operationEditor,/serviceOperationDirection/);
assert.match(inspector,/Service Type/);
assert.match(inspector,/Flow Control/);
assert.match(inspector,/serviceOperationDirection/);
