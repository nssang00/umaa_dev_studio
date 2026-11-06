import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { seedWorkspace } from '../src/model/seed.js';
import { ddsDesignPreflight } from '../src/logic/ddsDesignPreflight.js';
import { connectionChannels } from '../src/logic/communicationModel.js';
import { editEndpointQosProfile } from '../src/model/endpointConfiguration.js';
import { validateWorkspace } from '../src/logic/validation.js';
const read=p=>readFileSync(new URL(p,import.meta.url),'utf8');
const s=structuredClone(seedWorkspace);
assert.equal(ddsDesignPreflight(s).length,0,'seed has no simple static DDS preflight mismatch');
const connection=s.connections.find(c=>connectionChannels(s,c.id).length>0);
assert.ok(connection);
const ch=connectionChannels(s,connection.id)[0];
assert.ok(ch.writerEndpointKey&&ch.readerEndpointKey);
const wp=s.qosProfiles[0];
const alternative={...structuredClone(wp),id:'qos-best-effort-test',name:'Best Effort Test',
  datawriter_qos:{...structuredClone(wp.datawriter_qos),reliability:{kind:'best_effort'},
    durability:{kind:'volatile'},deadline:{period_ms:2000}}};
const snapshot={...s,qosProfiles:[...s.qosProfiles,alternative]};
const writer=ch.writerComponentId;
const changed=editEndpointQosProfile(snapshot,writer,ch.writerEndpointKey,alternative.id);
assert.ok(changed);
assert.ok(ddsDesignPreflight(changed).some(i=>i.code==='DDS_RELIABILITY_MISMATCH'));
assert.ok(validateWorkspace(changed).some(i=>i.code==='DDS_RELIABILITY_MISMATCH'));
const upgraded={...structuredClone(changed),qosProfiles:changed.qosProfiles.map(p=>p.id===wp.id?
  {...p,datareader_qos:{...p.datareader_qos,durability:{kind:'transient_local'},deadline:{period_ms:1000}}}:p)};
assert.ok(ddsDesignPreflight(upgraded).some(i=>i.code==='DDS_DURABILITY_MISMATCH'));
assert.ok(ddsDesignPreflight(upgraded).some(i=>i.code==='DDS_DEADLINE_MISMATCH'));
const mismatch=structuredClone(s);
mismatch.componentRuntime[ch.writerComponentId].domainId=7;
assert.ok(ddsDesignPreflight(mismatch).some(i=>i.code==='DDS_DOMAIN_MISMATCH'));
mismatch.componentRuntime[ch.readerComponentId].partition='Other';
assert.ok(ddsDesignPreflight(mismatch).some(i=>i.code==='DDS_PARTITION_MISMATCH'));
assert.ok(ddsDesignPreflight(s).every(i=>i.severity==='warning'));
const dds=read('../src/components/DdsConfigurationWorkbench.jsx');
for(const p of ['deployment','topics','endpoints','preflight','RuntimeSettings','ddsDesignPreflight'])
  assert.ok(dds.includes(p),'missing central DDS section '+p);
const journey=read('../src/components/ComponentJourney.jsx');
assert.match(journey,/자동 DDS Endpoint 미리보기/);
assert.match(journey,/kind:'ddsConfig',id:'project',componentId:component.id/);
assert.doesNotMatch(journey,/<RuntimeSettings componentId=/);
const inspector=read('../src/components/Inspector.jsx');
assert.match(inspector,/Auto DDS Mapping/);
assert.doesNotMatch(inspector,/<RuntimeSettings componentId=/);
console.log('PASS limited DDS preflight, central Deployment UI, Component-first advanced-link workflow');
