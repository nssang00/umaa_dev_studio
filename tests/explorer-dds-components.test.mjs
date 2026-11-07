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
// Ant Design reserves 4px switcher margin + 8px content padding by default.
// Narrow both gutters without shrinking the 24px expand/collapse click target.
const switcherSelector='.project-model-explorer .project-explorer-tree .ant-tree-switcher';
const wrapperSelector='.project-model-explorer .project-explorer-tree .ant-tree-node-content-wrapper';
const iconSelector=wrapperSelector+' .ant-tree-iconEle';
expectTreeStyle(switcherSelector, /margin-inline-end\s*:\s*0\b/);
expectTreeStyle(wrapperSelector, /padding-inline-start\s*:\s*0\b/);
expectTreeStyle(iconSelector, /flex\s*:\s*0\s+0\s+18px/);
expectTreeStyle(iconSelector, /width\s*:\s*18px/);
expectTreeStyle(iconSelector, /display\s*:\s*inline-flex/);
expectTreeStyle(iconSelector, /justify-content\s*:\s*flex-start/);
const switcherRule=styles.split(switcherSelector+' {')[1]?.split('}')[0]??'';
assert.doesNotMatch(switcherRule, /(?:^|;)\s*(?:width|flex)\s*:/,
  'Expand control dimensions must stay with Ant Design defaults');
expectTreeStyle('.project-explorer-row', /white-space\s*:\s*nowrap/);
expectTreeStyle('.project-explorer-label', /text-overflow\s*:\s*ellipsis/);

console.log('PASS grouped Explorer/DDS components with shared graph and Properties');
