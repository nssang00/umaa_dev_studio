import { serviceOperationDirection } from '../model/projectNavigation.js';
/** Pure diagram projections. React Flow layout is NOT the source of UMAA contracts. */
export function serviceContractGraph(snapshot, serviceId) {
  const service=snapshot.services.find(s=>s.id===serviceId);
  if(!service)return {nodes:[],edges:[]};
  const ops=snapshot.operations.filter(o=>o.serviceId===serviceId);
  const topicIds=[...new Set([...ops.map(o=>o.topicId),...(service.source==='custom'?snapshot.topics.filter(t=>snapshot.messages.some(m=>m.id===t.messageTypeId&&m.source==='custom'&&m.namespace===service.namespace)).map(t=>t.id):[])])];
  const nodes=[{id:`service:${serviceId}`,kind:'service',title:service.name,detail:`${service.functionalArea} · ${service.flowControl}`,position:{x:20,y:-150}}];
  const edges=[];
  const orderedOps=[
    ...ops.filter(op=>serviceOperationDirection(op)==='input'),
    ...ops.filter(op=>serviceOperationDirection(op)==='output'),
    ...ops.filter(op=>!serviceOperationDirection(op)),
  ];
  const inputCount=ops.filter(op=>serviceOperationDirection(op)==='input').length;
  nodes.push({id:'interface:input',kind:'interface',title:'INPUT · To Provider',detail:'Requests / Commands (provider-facing)',position:{x:20,y:-90}});
  nodes.push({id:'interface:output',kind:'interface',title:'OUTPUT · From Provider',detail:'Reports / Subscriptions',position:{x:20,y:inputCount*105+15}});
  orderedOps.forEach((op,i)=>{
    const y=i*105 + (i>=inputCount ? 125 : 0);
    nodes.push({id:`operation:${op.id}`,kind:'operation',title:op.name,detail:`${serviceOperationDirection(op)?.toUpperCase()??'UNCLASSIFIED'} · ${op.actor}`,position:{x:20,y}});
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

/**
 * Service-first contract projection. The current seed holds one navigation-only
 * InterfaceBlock per Service; cards below project Operations, NOT independently
 * certified UML/UMAA Interface identities. No mutation or schema migration.
 */
export function serviceInterfaceGraph(snapshot, serviceId) {
  const svc = snapshot.services.find(s => s.id === serviceId);
  if (!svc) return { nodes: [], edges: [] };
  const ops = snapshot.operations.filter(op => op.serviceId === serviceId);
  const lanes = [
    { key: 'input', name: 'INPUT · To Provider' },
    { key: 'output', name: 'OUTPUT · From Provider' },
    { key: 'unclassified', name: 'Direction review required' },
  ];
  const groups = Object.fromEntries(lanes.map(lane => [lane.key, []]));
  for (const op of ops) groups[serviceOperationDirection(op) ?? 'unclassified'].push(op);
  const counts = { input: groups.input.length, output: groups.output.length, unclassified: groups.unclassified.length };
  const nodes = [{
    id: 'service:' + svc.id, kind: 'serviceContract', title: svc.name,
    category: svc.serviceCategory ?? 'other', area: svc.functionalArea, namespace: svc.namespace,
    flowControl: svc.flowControl, source: svc.source, counts,
    position: { x: 350, y: 10 },
  }];
  const edges = [];
  const active = lanes.filter(lane => groups[lane.key].length);
  const positions = { input: 30, output: 720, unclassified: 375 };
  active.forEach(lane => {
    const laneId = 'lane:' + lane.key;
    const x = positions[lane.key];
    nodes.push({
      id: laneId, kind: 'contractLane', title: lane.name, direction: lane.key,
      count: groups[lane.key].length, position: { x, y: 225 },
    });
    edges.push({
      id: 'service-lane:' + lane.key, source: 'service:' + svc.id, target: laneId,
      relationship: 'membership', label: 'contains',
    });
    groups[lane.key].forEach((op, i) => {
      const topic = snapshot.topics.find(t => t.id === op.topicId);
      const type = snapshot.messages.find(t => t.id === topic?.messageTypeId);
      const cardId = 'interface:' + op.id;
      nodes.push({
        id: cardId, kind: 'interfaceCard', title: op.name,
        direction: serviceOperationDirection(op), actor: op.actor, action: op.action,
        topicName: topic?.name ?? null, typeName: type?.name ?? null,
        optional: Boolean(op.optionalConsumer), position: { x, y: 370 + i * 152 },
      });
      edges.push({
        id: 'lane-op:' + lane.key + ':' + op.id, source: laneId, target: cardId,
        relationship: 'membership',
      });
    });
  });
  return { nodes, edges };
}

/**
 * Conceptual actor/flow pattern (not verified Operation-to-Operation causality).
 * Association edges describe which role owns an Operation; only the pattern
 * edges indicate direction and they are explicitly marked illustrative.
 */
export function serviceFlowGraph(snapshot, serviceId) {
  const svc = snapshot.services.find(s => s.id === serviceId);
  if (!svc) return { nodes: [], edges: [] };
  const ops = snapshot.operations.filter(op => op.serviceId === serviceId);
  const nodes = [
    { id: 'actor:consumer', kind: 'flowActor', title: 'Service Consumer', position: { x: 20, y: 145 } },
    { id: 'actor:provider', kind: 'flowActor', title: 'Service Provider', position: { x: 800, y: 145 } },
    { id: 'flow:request', kind: 'flowPattern', title: svc.flowControl === 'command-response' ? 'Command / Request' : 'Query / Subscribe',
      detail: 'Conceptual consumer-to-provider interaction', position: { x: 412, y: 25 } },
    { id: 'flow:report', kind: 'flowPattern', title: svc.flowControl === 'command-response' ? 'Status / Ack / Report' : 'Report / Status',
      detail: 'Conceptual provider-to-consumer interaction', position: { x: 412, y: 270 } },
  ];
  const edges = [
    { id: 'consumer-request', source: 'actor:consumer', target: 'flow:request', relationship: 'illustrative-flow' },
    { id: 'request-provider', source: 'flow:request', target: 'actor:provider', relationship: 'illustrative-flow' },
    { id: 'provider-report', source: 'actor:provider', target: 'flow:report', relationship: 'illustrative-flow' },
    { id: 'report-consumer', source: 'flow:report', target: 'actor:consumer', relationship: 'illustrative-flow' },
  ];
  const counts = { consumer: 0, provider: 0 };
  ops.forEach(op => {
    const actor = op.actor === 'provider' ? 'provider' : 'consumer';
    const index = counts[actor]++;
    const topic = snapshot.topics.find(t => t.id === op.topicId);
    nodes.push({
      id: 'interface:' + op.id, kind: 'interfaceCard', title: op.name,
      direction: serviceOperationDirection(op), actor: op.actor, action: op.action,
      topicName: topic?.name ?? null, optional: Boolean(op.optionalConsumer),
      position: { x: actor === 'consumer' ? 20 : 800, y: 420 + index * 150 },
    });
    edges.push({
      id: 'role-operation:' + op.id, source: 'actor:' + actor, target: 'interface:' + op.id,
      relationship: 'membership',
    });
  });
  return { nodes, edges };
}
