import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
for(const [folder,name] of [
  ['explorer','ProjectModelExplorer'],
  ['dds','DdsConfigurationWorkbench'],
  ['dds','EndpointProperties'],
  ['dds','CommunicationView'],
]) {
  const root=read('../src/components/'+name+'.jsx');
  const feature=read('../src/components/'+folder+'/'+name+'.jsx');
  assert.ok(root.includes("from './"+folder+"/"+name+".jsx'"));
  assert.ok(feature.includes('export function '+name));
}
assert.match(read('../src/components/dds/EndpointProperties.jsx'),/ModelPropertiesPanel/);
assert.match(read('../src/components/dds/CommunicationView.jsx'),/ModelGraphCanvas/);
assert.match(read('../src/components/explorer/ProjectModelExplorer.jsx'),/projectModelTree/);
console.log('PASS grouped Explorer/DDS components with shared graph and Properties');
