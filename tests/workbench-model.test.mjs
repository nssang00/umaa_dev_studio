import assert from 'node:assert/strict';
import { seedWorkspace } from '../src/model/seed.js';
import { channelGraph, connectionChannels } from '../src/logic/communicationModel.js';

const s=seedWorkspace;
const find=(name)=>s.connections.find(c=>s.bindings.find(b=>b.id===c.providerBindingId)?.serviceId===s.services.find(svc=>svc.name===name)?.id);
const gv=find('GlobalVectorControl');
assert.ok(gv);
const commands=connectionChannels(s,gv.id);
assert.equal(commands.length,4);
const cmd=commands.find(c=>c.topicName==='GlobalVectorCommandType');
assert.deepEqual([cmd.writerRole,cmd.readerRole],['consumer','provider']);
for(const row of commands.filter(c=>c!==cmd)) assert.deepEqual([row.writerRole,row.readerRole],['provider','consumer']);
const dispose=cmd.operations.find(o=>o.action==='dispose');
assert.equal(dispose?.actor,'consumer');
const graph=channelGraph(s,gv.id);
assert.equal(graph.nodes.length,2+commands.length*3, 'two Components + Writer / Topic / Reader per channel');
assert.equal(graph.edges.length,commands.length*4,'four directional edges per channel');
assert.equal(graph.nodes.filter(n=>n.data.endpointKey).length,commands.length*2);
assert.ok(graph.nodes.filter(n=>n.data.endpointKey).every(n=>n.data.endpointKey.includes('|')));
console.log('PASS MO Command/Response → 4 DDS channels, direction, dispose, React Flow nodes/edges');

const gp=find('GlobalPoseStatus');
const pose=connectionChannels(s,gp.id);
assert.equal(pose.length,1);
assert.equal(pose[0].writerRole,'provider');
assert.equal(pose[0].readerRole,'consumer');
assert.ok(pose[0].operations.some(o=>o.action==='subscribe'));
console.log('PASS SA Report/Request-Reply → 1 shared Topic with Provider Writer and Consumer Reader');

assert.deepEqual(connectionChannels(s,'does-not-exist'),[]);
assert.equal(s.functionalAreas.filter(a=>a.source==='standard').length,8);
console.log('PASS Unknown connections and original 8-area standard catalog');
