import { deriveEndpoints } from './endpoints.js';
import { endpointKey } from '../model/endpointConfiguration.js';
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
      topicId:writer.topicId,messageTypeId:writer.messageTypeId,
      writerRole:writer.role,readerRole:reader.role,
      writerEndpointKey:endpointKey(writer),readerEndpointKey:endpointKey(reader),
      writerComponentId:writer.componentId,readerComponentId:reader.componentId,
      optional:Boolean(reader.optional),
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
  const midY=Math.max(50,channels.length*76);
  const sideStyle=(background,border,width=175)=>({
    width,whiteSpace:'pre-line',fontSize:11,background,border:'1px solid '+border,borderRadius:8,
  });
  const nodes=[
    {id:'consumer',position:{x:0,y:midY},data:{label:'Consumer\n'+(consumer?.name??'Unknown')},
      type:'default',draggable:false,style:sideStyle('#fff7e6','#dfaa54')},
    {id:'provider',position:{x:1120,y:midY},data:{label:'Provider\n'+(provider?.name??'Unknown')},
      type:'default',draggable:false,style:sideStyle('#eaf4ff','#86b8eb')},
  ];
  const edges=[];
  channels.forEach((ch,i)=>{
    const topicId='ch'+i, y=20+i*135;
    const consumerDirection=ch.writerRole==='consumer'?'writer':'reader';
    const providerDirection=ch.writerRole==='provider'?'writer':'reader';
    const consumerKey=ch.writerRole==='consumer'?ch.writerEndpointKey:ch.readerEndpointKey;
    const providerKey=ch.writerRole==='provider'?ch.writerEndpointKey:ch.readerEndpointKey;
    const consumerEndpointId='ep:consumer:'+i, providerEndpointId='ep:provider:'+i;
    nodes.push({
      id:consumerEndpointId,type:'default',position:{x:225,y},draggable:false,
      data:{label:'Data'+(consumerDirection==='writer'?'Writer':'Reader')+'\n'+ch.topicName,endpointKey:consumerKey},
      style:sideStyle('#fffdf7','#e1c78f',205),
    });
    nodes.push({
      id:topicId,type:'default',position:{x:522,y},draggable:false,
      data:{label:'DDS Topic\n'+ch.topicName+'\nType: '+ch.typeName},
      style:sideStyle('#f3f7fc','#b6c9df',255),
    });
    nodes.push({
      id:providerEndpointId,type:'default',position:{x:847,y},draggable:false,
      data:{label:'Data'+(providerDirection==='writer'?'Writer':'Reader')+'\n'+ch.topicName,endpointKey:providerKey},
      style:sideStyle('#f3fbff','#a1cfe2',205),
    });
    const path=ch.writerRole==='consumer'
      ? ['consumer',consumerEndpointId,topicId,providerEndpointId,'provider']
      : ['provider',providerEndpointId,topicId,consumerEndpointId,'consumer'];
    path.slice(0,-1).forEach((id,k)=>{
      const from=path[k],to=path[k+1];
      edges.push({
        id:topicId+':'+k,source:from,target:to,type:'smoothstep',animated:false,
        label:k===1?'write':k===2?'read':undefined,
        style:{stroke:ch.writerRole==='consumer'?'#3267ad':'#268681',strokeWidth:1.8},
      });
    });
  });
  return {channels,nodes,edges,provider,consumer};
}
