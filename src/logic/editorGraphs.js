/** Pure diagram projections. React Flow layout is NOT the source of UMAA contracts. */
export function serviceContractGraph(snapshot, serviceId) {
  const service=snapshot.services.find(s=>s.id===serviceId);
  if(!service)return {nodes:[],edges:[]};
  const ops=snapshot.operations.filter(o=>o.serviceId===serviceId);
  const topicIds=[...new Set([...ops.map(o=>o.topicId),...(service.source==='custom'?snapshot.topics.filter(t=>snapshot.messages.some(m=>m.id===t.messageTypeId&&m.source==='custom'&&m.namespace===service.namespace)).map(t=>t.id):[])])];
  const nodes=[{id:`service:${serviceId}`,kind:'service',title:service.name,detail:`${service.functionalArea} · ${service.flowControl}`,position:{x:20,y:-105}}];
  const edges=[];
  ops.forEach((op,i)=>{
    const y=i*100;
    nodes.push({id:`operation:${op.id}`,kind:'operation',title:op.name,detail:`actor: ${op.actor}`,position:{x:20,y}});
    nodes.push({id:`action:${op.id}`,kind:'action',title:op.action.toUpperCase(),detail:op.action==='dispose'?'Existing keyed instance':op.action==='subscribe'?'Query = subscription':'DDS write',position:{x:285,y}});
    edges.push({id:`op-action:${op.id}`,source:`operation:${op.id}`,target:`action:${op.id}`,label:'DDS action'});
    edges.push({id:`action-topic:${op.id}`,source:`action:${op.id}`,target:`topic:${op.topicId}`,label:op.action});
  });
  topicIds.forEach((id,i)=>{
    const t=snapshot.topics.find(t=>t.id===id);
    const type=snapshot.messages.find(m=>m.id===t?.messageTypeId);
    if(!t)return;
    const y=Math.max(0,(i+.3)*Math.max(100,ops.length*100/Math.max(1,topicIds.length)));
    nodes.push({id:`topic:${t.id}`,kind:'topic',title:t.name,detail:'DDS Topic',position:{x:540,y}});
    if(type){const key=`type:${type.id}`;
      if(!nodes.some(n=>n.id===key))nodes.push({id:key,kind:'type',title:type.name,detail:type.source==='custom'?'Custom IDL MessageType':'External UMAA IDL reference',position:{x:800,y}});
      edges.push({id:`topic-type:${t.id}`,source:`topic:${t.id}`,target:key,label:'type'});
    }
  });
  if(service.source==='custom') {
    const owned=snapshot.messages.filter(m=>m.source==='custom'&&m.namespace===service.namespace);
    owned.forEach((m,i)=>{if(!nodes.some(n=>n.id===`type:${m.id}`))nodes.push({id:`type:${m.id}`,kind:'type',title:m.name,detail:'Unbound Custom MessageType',position:{x:800,y:(topicIds.length+i+1)*100}});});
  }
  return {nodes,edges};
}
export function typeDependencyGraph(snapshot, kind, typeId) {
  const root=kind==='message'?snapshot.messages.find(t=>t.id===typeId):snapshot.dataTypes.find(t=>t.id===typeId);
  if(!root)return {nodes:[],edges:[]};
  const nodes=[{id:`root:${typeId}`,kind:'root',title:root.name,detail:`${root.namespace} · ${root.kind??'MessageType'}`,position:{x:12,y:60}}];
  const edges=[];
  const fields=root.kind==='enum'?(root.members??[]).map(name=>({name,type:'enum value'})):(root.fields??[]);
  fields.forEach((f,i)=>{
    nodes.push({id:`field:${f.name}`,kind:'field',title:f.name,detail:`${f.type}${f.key?' · @key':''}${f.optional?' · @optional':''}`,position:{x:285,y:i*82}});
    edges.push({id:`root-field:${f.name}`,source:`root:${typeId}`,target:`field:${f.name}`});
    const dep=[...snapshot.messages,...(snapshot.dataTypes??[])].find(t=>`${t.namespace}::${t.name}`===f.type||t.name===f.type);
    if(dep){
      const id=`dependent:${dep.id}`;
      if(!nodes.some(n=>n.id===id))nodes.push({id,kind:'type',title:dep.name,detail:dep.namespace,position:{x:570,y:i*95}});
      edges.push({id:`field-dep:${f.name}`,source:`field:${f.name}`,target:id,label:'references'});
    }
  });
  return {nodes,edges};
}
export function validateCustomContractLink(snapshot, serviceId, source, target) {
  const service=snapshot.services.find(s=>s.id===serviceId);
  if(!service || service.source!=='custom')return null;
  const [sk,si]=String(source).split(':');const [tk,ti]=String(target).split(':');
  if(sk==='action' && tk==='topic') {
    const op=snapshot.operations.find(o=>o.id===si&&o.serviceId===serviceId);
    const topic=snapshot.topics.find(t=>t.id===ti);
    const type=snapshot.messages.find(m=>m.id===topic?.messageTypeId);
    if(op&&type?.source==='custom'&&type.namespace===service.namespace)return {kind:'operation-topic',operationId:op.id,topicId:topic.id};
  }
  if(sk==='topic'&&tk==='type') {
    const topic=snapshot.topics.find(t=>t.id===si);
    const type=snapshot.messages.find(m=>m.id===ti);
    if(topic&&type?.source==='custom'&&type.namespace===service.namespace )return {kind:'topic-type',topicId:topic.id,typeId:type.id};
  }
  return null;
}
