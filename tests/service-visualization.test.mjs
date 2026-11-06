import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { seedWorkspace } from '../src/model/seed.js';
import { serviceInterfaceGraph, serviceFlowGraph, serviceContractGraph } from '../src/logic/editorGraphs.js';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const s=structuredClone(seedWorkspace);
const svc=s.services.find(x=>x.name==='GlobalVectorControl');
assert.ok(svc);
const ops=s.operations.filter(o=>o.serviceId===svc.id);
const contract=serviceInterfaceGraph(s,svc.id);
assert.equal(contract.nodes.filter(n=>n.kind==='interfaceCard').length,ops.length);
assert.equal(contract.nodes.filter(n=>n.kind==='serviceContract').length,1);
assert.ok(contract.nodes.some(n=>n.id==='lane:input'));
assert.ok(contract.nodes.some(n=>n.id==='lane:output'));
assert.ok(contract.edges.every(e=>e.relationship==='membership'));
assert.deepEqual(ops.map(o=>o.id).sort(),contract.nodes.filter(n=>n.kind==='interfaceCard')
  .map(n=>n.id.slice('interface:'.length)).sort());
const consumerSub=contract.nodes.find(n=>n.action==='subscribe'&&n.actor==='consumer');
assert.equal(consumerSub.direction,'input','Subscribe must not be interpreted as OUTPUT');
const cancel=contract.nodes.find(n=>n.action==='dispose');
assert.ok(cancel && cancel.topicName,'Existing command topic is a reference, not a new cancel message');
const flow=serviceFlowGraph(s,svc.id);
assert.equal(flow.nodes.filter(n=>n.kind==='interfaceCard').length,ops.length);
assert.ok(flow.edges.some(e=>e.relationship==='illustrative-flow'));
assert.ok(flow.edges.filter(e=>e.relationship==='illustrative-flow').every(e=>e.sourceHandle&&e.targetHandle));
assert.equal(contract.nodes.find(n=>n.kind==='serviceContract').category,null);
assert.match(read('../src/components/service/ContractGraph.jsx'),/MarkerType.ArrowClosed/);
assert.ok(flow.edges.every(e=>!e.source.startsWith('interface:')&&!e.target.startsWith('operation:')));
assert.equal(serviceContractGraph(s,svc.id).nodes.filter(n=>n.kind==='topic').length,4);
const unknown={...s,services:[...s.services,{id:'unknown-svc',name:'Unknown',source:'custom'}],
  operations:[...s.operations,{id:'unknown-op',serviceId:'unknown-svc',name:'customAction',actor:'provider',action:'publish'}]};
assert.ok(serviceInterfaceGraph(unknown,'unknown-svc').nodes.some(n=>n.id==='lane:unclassified'));
const explorer=read('../src/components/explorer/ProjectModelExplorer.jsx');
for(const value of ['Services','Components','showIcon','iconForNode','root:catalog','root:project','root:system'])
  assert.ok(explorer.includes(value),'Explorer missing '+value);
const graph=read('../src/components/service/ContractGraph.jsx');
for(const value of ['ServiceContractNode','serviceInterfaceGraph','serviceFlowGraph','DDS Mapping',
 'nodesConnectable={custom&&mode===\'dds\'}'])
  assert.ok(graph.includes(value),'Service Graph missing '+value);
const component=read('../src/components/ComponentNode.jsx');
assert.match(component,/logical links/);
assert.match(component,/derived DDS endpoints/);
const layout=read('../src/logic/layout.js');
assert.match(layout,/SUMMARY_HEIGHT/);
console.log('PASS Service Contract/Flow/DDS projections, Explorer icon tabs and Component port summary');
