import assert from 'node:assert/strict';
import { seedWorkspace } from '../src/model/seed.js';
import { componentNodeHeight, COMPONENT_NODE_WIDTH, ensureComponentPositions, layoutComponentPositions } from '../src/logic/layout.js';

const positions = layoutComponentPositions(seedWorkspace);
assert.deepEqual(Object.keys(positions).sort(), seedWorkspace.components.map(c=>c.id).sort());
for (const p of Object.values(positions)) assert(Number.isFinite(p.x) && Number.isFinite(p.y));
for (let i=0;i<seedWorkspace.components.length;i++) {
  for (let j=i+1;j<seedWorkspace.components.length;j++) {
    const a=seedWorkspace.components[i]; const b=seedWorkspace.components[j];
    const pa=positions[a.id];const pb=positions[b.id];
    const overlaps=pa.x < pb.x + COMPONENT_NODE_WIDTH && pa.x + COMPONENT_NODE_WIDTH > pb.x &&
      pa.y < pb.y + componentNodeHeight(seedWorkspace,b.id) &&
      pa.y + componentNodeHeight(seedWorkspace,a.id) > pb.y;
    assert.equal(overlaps,false,`${a.name} and ${b.name} must not overlap`);
  }
}
const partial=ensureComponentPositions({...seedWorkspace,positions:{nav:{x:12345,y:123}}});
assert.deepEqual(partial.positions.nav,{x:12345,y:123});
assert(partial.positions.autopilot);
assert(layoutComponentPositions({...seedWorkspace,components:[...seedWorkspace.components,{id:'extra',name:'Extra',description:''}]}).extra);
console.log('PASS Dagre layout: all nodes, no overlap, stable manual positions');
