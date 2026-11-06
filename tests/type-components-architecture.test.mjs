import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
for(const name of ['TypeWorkbench','TypeProperties','StructPropertiesEditor','StructFieldAccordionList','StructFieldEditor']) {
 const wrapper=read('../src/components/'+name+'.jsx');
 const impl=read('../src/components/types/'+name+'.jsx');
 assert.ok(wrapper.includes("from './types/"+name+".jsx'"));
 assert.ok(impl.includes('export function '+name));
}
assert.match(read('../src/components/types/TypeWorkbench.jsx'),/renderIdlPreview/);
assert.match(read('../src/components/types/TypeProperties.jsx'),/StructPropertiesEditor/);
assert.match(read('../src/components/types/StructPropertiesEditor.jsx'),/StructFieldAccordionList/);
assert.match(read('../src/components/types/StructFieldAccordionList.jsx'),/StructFieldEditor/);
assert.match(read('../src/components/types/TypeGraph.jsx'),/ModelGraphCanvas/);
console.log('PASS Type/Struct feature editor hierarchy and legacy imports');
