import { useEffect, useMemo, useState } from 'react';
import { Button, Input, Tabs, Tag, Tree, Typography } from 'antd';
import { ApartmentOutlined, ApiOutlined, CodeOutlined, DeploymentUnitOutlined, FolderOpenOutlined, NodeIndexOutlined, PlusOutlined } from '@ant-design/icons';
import { useEditorStore } from '../stores/useEditorStore.js';

const TABS = ['components','services','types'];
const badge = (label,color) => <Tag className="explorer-tag" color={color}>{label}</Tag>;
export function ProjectExplorer({onCreate}) {
  const snapshot=useEditorStore(s=>s.snapshot);
  const selection=useEditorStore(s=>s.selection);
  const select=useEditorStore(s=>s.select);
  const [tab,setTab]=useState('components');
  const [query,setQuery]=useState('');
  const [expanded,setExpanded]=useState(['components-root','component-providers','component-consumers','areas','area-MO','custom-types','standard-types','standard-message-types','standard-common-types']);
  useEffect(()=>{
    if(!selection)return;
    if(['diagram','component','binding','connection','build'].includes(selection.kind))setTab('components');
    if(['service','interface','operation','functionalArea','topic'].includes(selection.kind))setTab('services');
    if(['message','dataType'].includes(selection.kind))setTab('types');
  },[selection?.kind,selection?.id]);
  const entries=useMemo(()=>{
    if(!snapshot)return [];
    const match=(...values)=>!query||values.join(' ').toLowerCase().includes(query.toLowerCase());
    const node=(kind,id,title,icon,children=[])=>({key:`${kind}:${id}`,title,icon,children});
    if(tab==='components') {
      return [
        node('diagram','system',<b>System Assembly</b>,<NodeIndexOutlined/>),
        {key:'components-root',title:<b>Project Components ({snapshot.components.length})</b>,icon:<FolderOpenOutlined/>,children:snapshot.components.filter(c=>match(c.name,...snapshot.bindings.filter(b=>b.componentId===c.id).map(b=>snapshot.services.find(s=>s.id===b.serviceId)?.name??''))).map(c=>{
          const bindings=snapshot.bindings.filter(b=>b.componentId===c.id);
          return node('component',c.id,<b>{c.name}</b>,<ApartmentOutlined/>,['provider','consumer'].map(role=>({
            key:`group-${role}:${c.id}`,title:<span>{role==='provider'?'Provided Services':'Consumed Services'} {badge(bindings.filter(b=>b.role===role).length)}</span>,
            children:bindings.filter(b=>b.role===role && match(c.name,snapshot.services.find(s=>s.id===b.serviceId)?.name??'')).map(b=>node('binding',b.id,<>{snapshot.services.find(s=>s.id===b.serviceId)?.name??'?'} {badge(role==='provider'?'P':'C',role==='provider'?'blue':'orange')}</>,<ApiOutlined/>))
          })));
        })},
        {key:'connections-root',title:`Service Connections (${snapshot.connections.length})`,icon:<NodeIndexOutlined/>,children:snapshot.connections.map(c=>{
          const bind=snapshot.bindings.find(b=>b.id===c.providerBindingId);const svc=snapshot.services.find(s=>s.id===bind?.serviceId);
          return node('connection',c.id,svc?.name??'Connection',<NodeIndexOutlined/>);
        })}
      ];
    }
    if(tab==='services') {
      return [
        {key:'areas',title:<b>UMAA 6.0 · Functional Areas {badge('STANDARD')}</b>,icon:<FolderOpenOutlined/>,children:snapshot.functionalAreas.filter(a=>a.source!=='custom').map(a=>{
          const all=snapshot.services.filter(s=>s.functionalArea===a.id&&s.source==='standard');
          return node('functionalArea',a.id,<>{a.id} · {a.name} {badge(all.length)}</>,<DeploymentUnitOutlined/>,all.filter(s=>match(s.name,a.name,a.id)).map(s=>node('service',s.id,s.name,<ApiOutlined/>)));
        })},
        {key:'custom-services',title:<b>Project Extensions</b>,icon:<FolderOpenOutlined/>,children:[
          ...snapshot.functionalAreas.filter(a=>a.source==='custom').map(a=>node('functionalArea',a.id,`${a.id} · ${a.name}`,<DeploymentUnitOutlined/>)),
          ...snapshot.services.filter(s=>s.source==='custom'&&match(s.name)).map(s=>node('service',s.id,<>{s.name} {badge('CUSTOM','purple')}</>,<ApiOutlined/>)),
        ]}
      ];
    }
    const types=[...snapshot.messages.map(m=>({...m,treeKind:'message'})),...(snapshot.dataTypes??[]).map(t=>({...t,treeKind:'dataType'}))];
    return [{key:'custom-types',title:<b>Project Types · Editable</b>,icon:<FolderOpenOutlined/>,children:types.filter(t=>t.source==='custom'&&match(t.name)).map(t=>node(t.treeKind,t.id,`${t.name}${t.kind?' · '+t.kind:''}`,<CodeOutlined/>))},
      {key:'standard-types',title:<b>UMAA 6.0 · ICD Mock Data Types {badge('READ ONLY')}</b>,icon:<FolderOpenOutlined/>,children:[
        {key:'standard-message-types',title:`Topic Data Types (${snapshot.messages.filter(t=>t.source!=='custom').length})`,icon:<FolderOpenOutlined/>,children:types.filter(t=>t.source!=='custom'&&t.treeKind==='message'&&match(t.name,t.namespace)).map(t=>node(t.treeKind,t.id,t.name,<CodeOutlined/>))},
        {key:'standard-common-types',title:`Common Data Types (${(snapshot.dataTypes??[]).filter(t=>t.source!=='custom').length})`,icon:<FolderOpenOutlined/>,children:types.filter(t=>t.source!=='custom'&&t.treeKind==='dataType'&&match(t.name,t.namespace)).map(t=>node(t.treeKind,t.id,t.name,<CodeOutlined/>))},
      ]}];
  },[snapshot,tab,query]);
  const chosen=selection?`${selection.kind}:${selection.id}`:null;
  const allKeys=useMemo(()=>{const a=[];const visit=nodes=>nodes.forEach(n=>{if(n.children?.length){a.push(n.key);visit(n.children);}});visit(entries);return a;},[entries]);
  return <div className="sidebar-section explorer-tabbed">
    <Tabs activeKey={tab} onChange={setTab} size="small" centered items={TABS.map(t=>({key:t,label:t[0].toUpperCase()+t.slice(1)}))}/>
    <div className="explorer-controls">
      <Input.Search size="small" value={query} onChange={e=>setQuery(e.target.value)} allowClear placeholder={`${tab==='components'?'Component / Binding':tab==='services'?'FA / Service':'IDL Type'} 검색`}/>
      <Button size="small" type="primary" icon={<PlusOutlined/>} onClick={()=>onCreate?.(tab==='components'?'component':tab==='services'?'service':'type')}>
        {tab==='components'?'Component':tab==='services'?'Service':'Type'}
      </Button>
    </div>
    <Tree showLine showIcon blockNode treeData={entries} selectedKeys={chosen?[chosen]:[]} expandedKeys={query?allKeys:expanded} onExpand={setExpanded}
      onSelect={keys=>{const key=String(keys[0]??'');const i=key.indexOf(':');if(i<0)return;const kind=key.slice(0,i);if(['diagram','component','binding','connection','service','functionalArea','message','dataType'].includes(kind))select({kind,id:key.slice(i+1)});}}/>
    <div className="explorer-guidance"><Typography.Text type="secondary">
      {tab==='components'?'Component → P/C Service Binding → 연결선 선택 → DDS 채널':tab==='services'?'표준 Service 계약은 보호됩니다. Custom Service만 편집할 수 있습니다.':'UMAA ICD 목 Type은 읽기 전용입니다. Custom Type만 수정할 수 있습니다.'}
    </Typography.Text></div>
  </div>;
}
