import { categoryLabel, flowLabel } from './icdConcepts.js';

import { serviceOperationDirection } from './interfaceDirection.js';
export { serviceOperationDirection } from './interfaceDirection.js';

const item = (key, label, selection = null, children = [], extra = {}) => ({
  key, label, selection, children, ...extra,
});
const ref = (scope, kind, x, extra = {}) =>
  item(scope + ':' + kind + ':' + x.id, x.name, {kind,id:x.id}, [], extra);
const serviceOwnedTypes = (s, svc, ops) => {
  const ids = new Set(ops.map(op=>op.topicId));
  return (s.topics??[]).filter(t=>ids.has(t.id));
};
export function serviceContractTree(s, svc, keyPrefix = 'project') {
  const ops=(s.operations??[]).filter(op=>op.serviceId===svc.id);
  const topics=serviceOwnedTypes(s,svc,ops);
  const groups=(direction)=>ops.filter(op=>serviceOperationDirection(op)===direction)
    .map(op=>item(keyPrefix+':op:'+op.id,op.name+' · '+op.action.toUpperCase(),
      {kind:'operation',id:op.id},[],{badge:op.optionalConsumer?'optional':null}));
  return item(keyPrefix+':service:'+svc.id,svc.name,{kind:'service',id:svc.id},[
    item(keyPrefix+':category:'+svc.id,'Service Type · '+categoryLabel(svc)),
    item(keyPrefix+':flow:'+svc.id,'Flow Control · '+flowLabel(svc.flowControl)),
    item(keyPrefix+':interfaces:'+svc.id,'Interfaces',null,[
      item(keyPrefix+':input:'+svc.id,'INPUT · To Provider',null,groups('input')),
      item(keyPrefix+':output:'+svc.id,'OUTPUT · From Provider',null,groups('output')),
      ...(ops.some(op=>serviceOperationDirection(op)===null)
        ? [item(keyPrefix+':unclassified:'+svc.id,'Direction review required',null,
            ops.filter(op=>!serviceOperationDirection(op)).map(op=>item(
              keyPrefix+':unclassified-op:'+op.id,op.name+' · '+op.action.toUpperCase(),
              {kind:'operation',id:op.id})))]:[]),
    ]),
    item(keyPrefix+':topics:'+svc.id,'DDS Topic / Data Type references',null,
      topics.map(t=>{
        const type=s.messages.find(m=>m.id===t.messageTypeId);
        return item(keyPrefix+':topic:'+t.id,t.name,{kind:'topic',id:t.id},type?
          [item(keyPrefix+':type:'+t.id+':'+type.id,type.name,{kind:'message',id:type.id})]:[]);
      })),
  ], {badge:svc.source==='standard'?'ICD ref':'Custom'});
}
const group=(key,label,children,createKind=null)=>item('group:'+key,label,null,children,{createKind});
const typesFor=(s,source)=>[...(s.messages??[]).map(x=>({...x,treeKind:'message'})),
  ...(s.dataTypes??[]).map(x=>({...x,treeKind:'dataType'}))]
  .filter(x=>source==='standard' ? x.source!=='custom' : x.source==='custom');
function filterTree(nodes, q) {
  const needle=String(q??'').toLowerCase().trim();
  if(!needle)return nodes;
  const visit=n=>{
    const children=n.children.map(visit).filter(Boolean);
    return n.label.toLowerCase().includes(needle) || n.badge?.toLowerCase().includes(needle)
      ? n : children.length?{...n,children}:null;
  };
  return nodes.map(visit).filter(Boolean);
}
export function expandedTreeKeys(nodes) {
  const out=[];
  const visit=nodes=>nodes.forEach(n=>{if(n.children.length){out.push(n.key);visit(n.children);}});
  visit(nodes);return out;
}
/** Three logical roots; no duplicated or copied UMAA standard definitions. */
export function projectModelTree(s, query = '') {
  const standardServices=s.services.filter(x=>x.source!=='custom');
  const used=new Set((s.bindings??[]).map(b=>b.serviceId));
  const activeServices=standardServices.filter(svc=>used.has(svc.id));
  const areaServices=(s.functionalAreas??[]).filter(a=>a.source!=='custom').map(a=>
    item('catalog:area:'+a.id,a.id+' · '+a.name,{kind:'functionalArea',id:a.id},
      standardServices.filter(svc=>svc.functionalArea===a.id)
        .map(svc=>serviceContractTree(s,svc,'catalog:'+a.id))));
  const stdOperations=s.operations.filter(o=>standardServices.some(v=>v.id===o.serviceId));
  const stdTopics=new Map(stdOperations.map(op=>[op.topicId,s.topics.find(t=>t.id===op.topicId)]).filter(x=>x[1]));
  const standardTypes=typesFor(s,'standard');
  const catalog=item('root:catalog','UMAA ICD Catalog · Curated reference',null,[
    group('catalog-services','Services',areaServices),
    group('catalog-interfaces','Interfaces',s.interfaces.filter(v=>standardServices.some(svc=>svc.id===v.serviceId))
      .map(i=>ref('catalog','interface',i))),
    group('catalog-operations','Operations',stdOperations.map(op=>ref('catalog','operation',op))),
    group('catalog-topics','Topics',[...stdTopics.values()].map(t=>ref('catalog','topic',t))),
    group('catalog-types','Data Types',standardTypes.map(t=>ref('catalog',t.treeKind,t))),
    group('flow-rules','Flow Control Rules',[
      item('rules:command','Command / Response',{kind:'flowRules',id:'command-response'}),
      item('rules:request','Request / Reply',{kind:'flowRules',id:'request-reply'}),
    ]),
  ],{badge:'Read only · partial'});
  const project=item('root:project','Project Service Model',null,[
    group('project-services','Standard Service References',activeServices.map(svc=>serviceContractTree(s,svc,'project:standard'))),
    group('project-custom','Custom Services',s.services.filter(x=>x.source==='custom')
      .map(svc=>serviceContractTree(s,svc,'project:custom')),'service'),
    group('project-topics','Custom Topics',(s.topics??[]).filter(t=>t.source==='custom')
      .map(t=>ref('project','topic',t)),'topic'),
    group('project-types','Custom Data Types',typesFor(s,'custom')
      .map(t=>ref('project',t.treeKind,t)),'type'),
  ]);
  const componentNodes=s.components.map(c=>{
    const b=s.bindings.filter(x=>x.componentId===c.id);
    const bindings=role=>b.filter(x=>x.role===role).map(x=>{
      const svc=s.services.find(v=>v.id===x.serviceId);
      return item('system:binding:'+x.id,(role==='provider'?'Provides ':'Uses ')+(svc?.name??x.serviceId),
        {kind:'binding',id:x.id});
    });
    return item('system:component:'+c.id,c.name,{kind:'component',id:c.id},[
      item('system:provider:'+c.id,'Provider',null,bindings('provider')),
      item('system:consumer:'+c.id,'Consumer',null,bindings('consumer')),
    ]);
  });
  const system=item('root:system','System Model',null,[
    item('system:assembly','System Assembly',{kind:'diagram',id:'system'}),
    group('system-components','Components',componentNodes,'component'),
    group('system-connections','Service Connections',s.connections.map(c=>
      item('system:connection:'+c.id,
        s.services.find(svc=>svc.id===s.bindings.find(b=>b.id===c.providerBindingId)?.serviceId)?.name??c.id,
        {kind:'connection',id:c.id}))),
    group('system-dds','DDS Configuration',[
      item('system:ddsOverview','Deployment / Topics / Endpoints / Checks',{kind:'ddsConfig',id:'project'}),
      group('system-qos','QoS Profiles',s.qosProfiles.map(q=>ref('system','qos',q)),'qos'),
      item('system:relations','Topic Relationships',{kind:'dataPatterns',id:'project'}),
    ]),
    item('system:build','Code Generation / Outputs',{kind:'build',id:'project'}),
  ]);
  return filterTree([catalog,project,system],query);
}
