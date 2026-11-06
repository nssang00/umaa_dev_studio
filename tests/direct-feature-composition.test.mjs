import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const paths={
  'WorkspaceWorkbench':["'./assembly/ComponentJourney.jsx'","'./dds/DdsConfigurationWorkbench.jsx'","'./types/TypeWorkbench.jsx'"],
  'ContextProperties':["'./types/TypeProperties.jsx'","'./qos/QosProperties.jsx'","'./dds/EndpointProperties.jsx'"],
  'ContractWorkbench':["'./service/ContractGraph.jsx'","'./qos/QosProfileDiagram.jsx'"],
  'StudioNavigator':["'./explorer/ProjectModelExplorer.jsx'"],
};
for(const [name,imports] of Object.entries(paths)){
 const file=read('../src/components/'+name+'.jsx');
 for(const phrase of imports)assert.ok(file.includes(phrase),name+' missing direct feature import '+phrase);
}
for(const f of ['service/ContractGraph','types/TypeGraph'])
  assert.match(read('../src/components/'+f+'.jsx'),/shared\/graph\/StudioGraphNode/);
assert.match(read('../src/components/shared/graph/StudioGraphNode.jsx'),/Handle/);
assert.match(read('../src/components/shared/graph/ModelGraphCanvas.jsx'),/ReactFlow/);
console.log('PASS direct feature imports, node presentation and layout-only graph composition');
