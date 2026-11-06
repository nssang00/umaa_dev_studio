import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const names=['QosEntitySections','QosPolicyAccordion','QosPolicyFieldControl','QosProfileFields','QosProperties'];
for(const name of names){
 const proxy=read('../src/components/'+name+'.jsx');
 const feature=read('../src/components/qos/'+name+'.jsx');
 assert.ok(proxy.includes("from './qos/"+name+".jsx'"));
 assert.ok(feature.includes('export function '+name));
}
assert.match(read('../src/components/qos/QosProperties.jsx'),/ModelPropertiesPanel/);
assert.match(read('../src/components/shared/display/ModelPropertiesPanel.jsx'),/children/);
assert.match(read('../src/components/qos/QosProfileDiagram.jsx'),/from '.\/QosEntitySections.jsx'/);
console.log('PASS organized QoS feature parts and reusable Properties frame');
