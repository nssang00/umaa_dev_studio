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

// Explorer icons, titles and actions must share a row; long labels should truncate.
const explorer=read('../src/components/explorer/ProjectModelExplorer.jsx');
assert.match(explorer, /<Tree[^>]*showIcon blockNode showLine/s);
const styles=read('../src/styles.css');
const expectTreeStyle=(selector, declaration)=>{
  const rule=styles.split(selector+' {')[1]?.split('}')[0];
  assert.ok(rule, 'Missing CSS rule: '+selector);
  assert.match(rule, declaration, 'Unexpected CSS for '+selector);
};
expectTreeStyle('.project-explorer-tree .ant-tree-node-content-wrapper', /display\s*:\s*flex/);
expectTreeStyle('.project-explorer-tree .ant-tree-node-content-wrapper', /align-items\s*:\s*center/);
expectTreeStyle('.project-explorer-tree .ant-tree-title', /flex\s*:\s*1/);
// Keep the switcher (+) hit box intact; compact only the adjacent icon slot.
expectTreeStyle('.project-explorer-tree .ant-tree-iconEle', /flex\s*:\s*0\s+0\s+18px/);
expectTreeStyle('.project-explorer-tree .ant-tree-iconEle', /width\s*:\s*18px/);
expectTreeStyle('.project-explorer-tree .ant-tree-iconEle', /justify-content\s*:\s*flex-start/);
assert.doesNotMatch(styles, /\.project-explorer-tree \.ant-tree-switcher\s*\{/);
expectTreeStyle('.project-explorer-row', /white-space\s*:\s*nowrap/);
expectTreeStyle('.project-explorer-label', /text-overflow\s*:\s*ellipsis/);

console.log('PASS grouped Explorer/DDS components with shared graph and Properties');
