import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { seedWorkspace } from '../src/model/seed.js';
import { upgradeWorkspace } from '../src/model/workspaceSchema.js';
import { parseWorkspaceImport } from '../src/model/validateImport.js';
import { validateWorkspace } from '../src/logic/validation.js';
import { channelGraph, connectionChannels } from '../src/logic/communicationModel.js';
import { generateComponentFiles } from '../src/logic/codegen.js';
import { endpointKey, configuredEndpoints, findConfiguredEndpoint,
  editEndpointQosProfile, removeBindingEndpointConfigs } from '../src/model/endpointConfiguration.js';
const read = path=>readFileSync(new URL(path, import.meta.url),'utf8');
const s=structuredClone(seedWorkspace);
const component=s.components.find(c=>s.bindings.some(b=>b.componentId===c.id));
assert.ok(component);
const eps=configuredEndpoints(s,component.id);
assert.ok(eps.length>0 && eps.every(e=>e.topicId && e.key.includes(e.topicId)));
const chosen=eps[0];
const otherProfile={...s.qosProfiles[0],id:'qos-override',name:'Alternative',baseProfileId:null};
const withOther={...s,qosProfiles:[...s.qosProfiles,otherProfile]};
const changed=editEndpointQosProfile(withOther,component.id,chosen.key,otherProfile.id);
assert.ok(changed!==withOther);
assert.equal(findConfiguredEndpoint(changed,chosen.key).qosSource,'endpoint');
assert.equal(findConfiguredEndpoint(changed,chosen.key).qosProfileId,otherProfile.id);
assert.equal(changed.componentRuntime[component.id].qosProfileId,s.componentRuntime[component.id].qosProfileId,'Component default unchanged');
assert.equal(editEndpointQosProfile(changed,component.id,chosen.key,otherProfile.id),changed,'no-op');
assert.equal(editEndpointQosProfile(changed,component.id,chosen.key,'missing'),null);
assert.equal(editEndpointQosProfile(changed,'missing',chosen.key,otherProfile.id),null);
assert.equal(editEndpointQosProfile(changed,component.id,'nonexistent',otherProfile.id),null);
const reverted=editEndpointQosProfile(changed,component.id,chosen.key,null);
assert.equal(reverted.endpointConfigs?.[chosen.key],undefined);
assert.equal(findConfiguredEndpoint(reverted,chosen.key).qosSource,'component');
const reimported=parseWorkspaceImport(JSON.parse(JSON.stringify(changed)));
assert.equal(findConfiguredEndpoint(reimported,chosen.key).qosProfileId,otherProfile.id);
assert.ok(upgradeWorkspace(s).endpointConfigs && Object.keys(upgradeWorkspace(s).endpointConfigs).length===0);
const broken={...changed,endpointConfigs:{...changed.endpointConfigs,[chosen.key]:{qosProfileId:'bad'}}};
assert.ok(validateWorkspace(broken).some(issue=>issue.code==='ENDPOINT_QOS_MISSING'));
const stale={...changed,endpointConfigs:{...changed.endpointConfigs,ghost:{qosProfileId:otherProfile.id}}};
assert.ok(validateWorkspace(stale).some(issue=>issue.code==='ORPHAN_ENDPOINT_CONFIG'));
assert.equal(removeBindingEndpointConfigs(changed.endpointConfigs,chosen.bindingId)[chosen.key],undefined);
assert.ok(changed.endpointConfigs[chosen.key],'pruning does not mutate input');
assert.deepEqual(s,structuredClone(seedWorkspace),'new endpoint edit does not mutate original');
const conn=s.connections[0];
const channels=connectionChannels(s,conn.id);
const graph=channelGraph(s,conn.id);
assert.equal(graph.nodes.filter(n=>n.id.startsWith('ep:')).length,channels.length*2);
assert.equal(graph.edges.length,channels.length*4);
assert.ok(channels.every(ch=>ch.writerEndpointKey && ch.readerEndpointKey));
assert.ok(graph.nodes.filter(n=>n.data.endpointKey).every(n=>findConfiguredEndpoint(s,n.data.endpointKey)));
const files=generateComponentFiles(changed,component.id);
const manifest=files.find(f=>f.path==='contracts/endpoint-qos-design.json');
assert.ok(manifest);
const parsed=JSON.parse(manifest.content);
assert.equal(parsed.implementation,'design-metadata-only');
assert.equal(parsed.endpoints.find(e=>e.endpointKey===chosen.key).profileId,otherProfile.id);
const ui=[
  read('../src/components/DdsConfigurationWorkbench.jsx'),
  read('../src/components/EndpointProperties.jsx'),
  read('../src/components/CommunicationView.jsx'),
  read('../src/components/ContextProperties.jsx'),
  read('../src/components/WorkspaceWorkbench.jsx'),
].join('\n');
for(const marker of ['configuredEndpoints','updateEndpointQosProfile','endpointKey','EndpointProperties','DdsConfigurationWorkbench'])
  assert.ok(ui.includes(marker),'missing Endpoint UI: '+marker);
console.log('PASS logical DDS Writer/Reader graph, endpoint QoS override, migration, validation and codegen metadata');
