import { deriveEndpoints } from './endpoints.js';
/** Design-time DDS channel projection. Connections are NOT network links. */
export function connectionChannels(snapshot, connectionId) {
  const connection = snapshot.connections.find(c => c.id === connectionId);
  if (!connection) return [];
  const provider = snapshot.bindings.find(b => b.id === connection.providerBindingId);
  const consumer = snapshot.bindings.find(b => b.id === connection.consumerBindingId);
  if (!provider || !consumer || provider.serviceId !== consumer.serviceId) return [];
  const service = snapshot.services.find(s => s.id === provider.serviceId);
  if (!service) return [];
  const pe = deriveEndpoints(snapshot, provider.componentId).filter(e => e.bindingId === provider.id);
  const ce = deriveEndpoints(snapshot, consumer.componentId).filter(e => e.bindingId === consumer.id);
  const rows=[];
  const keys = new Set([...pe,...ce].map(e=>`${e.topicName}|${e.typeName}`));
  for (const key of keys) {
    const p = pe.filter(e=>`${e.topicName}|${e.typeName}`===key);
    const c = ce.filter(e=>`${e.topicName}|${e.typeName}`===key);
    const writer=p.find(e=>e.direction==='writer')??c.find(e=>e.direction==='writer');
    const reader=p.find(e=>e.direction==='reader')??c.find(e=>e.direction==='reader');
    if (!writer || !reader || writer.role===reader.role) continue;
    const operations=snapshot.operations.filter(o=>o.serviceId===service.id && snapshot.topics.find(t=>t.id===o.topicId)?.name===writer.topicName);
    rows.push({id:`${service.id}:${key}`, serviceName:service.name,topicName:writer.topicName,typeName:writer.typeName,
      writerRole:writer.role,readerRole:reader.role,optional:Boolean(reader.optional),
      operations:operations.map(o=>({name:o.name,action:o.action,actor:o.actor,optionalConsumer:Boolean(o.optionalConsumer)})),
      dataRule:writer.relatedRule??reader.relatedRule??null});
  }
  return rows;
}

export function channelGraph(snapshot, connectionId) {
  const connection=snapshot.connections.find(c=>c.id===connectionId);
  const pb=snapshot.bindings.find(b=>b.id===connection?.providerBindingId);
  const cb=snapshot.bindings.find(b=>b.id===connection?.consumerBindingId);
  const provider=snapshot.components.find(c=>c.id===pb?.componentId);
  const consumer=snapshot.components.find(c=>c.id===cb?.componentId);
  const channels=connectionChannels(snapshot,connectionId);
  const nodes=[
    {id:'consumer',position:{x:0,y:Math.max(40,channels.length*55)},data:{label:`Consumer\n${consumer?.name??'Unknown'}`},type:'default',draggable:false,style:{width:165,whiteSpace:'pre-line',background:'#fff7e6',border:'1px solid #dfaa54',borderRadius:8}},
    {id:'provider',position:{x:710,y:Math.max(40,channels.length*55)},data:{label:`Provider\n${provider?.name??'Unknown'}`},type:'default',draggable:false,style:{width:165,whiteSpace:'pre-line',background:'#eaf4ff',border:'1px solid #86b8eb',borderRadius:8}},
  ];
  const edges=[];
  channels.forEach((ch,i)=>{
    const topicId=`ch${i}`;
    nodes.push({id:topicId,type:'default',position:{x:330,y:20+i*110},draggable:false,
      data:{label:`${ch.topicName}\n${ch.typeName}`},style:{width:245,whiteSpace:'pre-line',fontSize:11,background:'#f3f7fc',border:'1px solid #b6c9df',borderRadius:8}});
    const from=ch.writerRole==='consumer'?'consumer':'provider';
    const to=ch.readerRole==='consumer'?'consumer':'provider';
    edges.push({id:`${topicId}-writer`,source:from,target:topicId,type:'smoothstep',animated:false,label:'write',style:{stroke:'#3267ad',strokeWidth:2}});
    edges.push({id:`${topicId}-reader`,source:topicId,target:to,type:'smoothstep',animated:false,label:'read',style:{stroke:'#268681',strokeWidth:2}});
  });
  return {channels,nodes,edges,provider,consumer};
}
