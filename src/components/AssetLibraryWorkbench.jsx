import { useMemo, useState } from 'react';
import { Alert, Button, Card, Input, Space, Table, Tabs, Tag, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useEditorStore } from '../stores/useEditorStore.js';
import { categoryLabel, flowLabel } from '../model/icdConcepts.js';
const {Text}=Typography;
const sections=[
  {key:'services',title:'Services',description:'서비스 계약, Operation, Flow Control 및 Report / Status'},
  {key:'topics',title:'Topics',description:'DDS Topic과 Data Type 연결'},
  {key:'types',title:'Data Types',description:'Struct / Enum 및 ICD Message Definition (UML)'},
  {key:'qos',title:'QoS',description:'재사용할 QoS Profile'},
];
/** Users can create assets without first selecting a Component. */
export function AssetLibraryWorkbench({onCreate,onNewService}){
  const s=useEditorStore(x=>x.snapshot),select=useEditorStore(x=>x.select);
  const [active,setActive]=useState('services'),[query,setQuery]=useState('');
  const q=query.trim().toLowerCase();
  const all=useMemo(()=>({
    services:s.services.map(x=>({...x,displayType:categoryLabel(x),detail:flowLabel(x.flowControl),kind:'service'})),
    topics:s.topics.map(x=>({...x,displayType:'Topic',detail:s.messages.find(m=>m.id===x.messageTypeId)?.name??'미연결',kind:'topic',source:x.source??'standard'})),
    types:[...s.messages.map(x=>({...x,kind:'message',displayType:'Data Type · Message',detail:x.namespace})),...(s.dataTypes??[]).map(x=>({...x,kind:'dataType',displayType:`Data Type · ${x.kind??'struct'}`,detail:x.namespace}))],
    qos:s.qosProfiles.map(x=>({...x,kind:'qos',displayType:x.libraryName??'QoS Profile',detail:`${x.reliability} / ${x.durability}`})),
  }),[s]);
  const rows=all[active].filter(r=>!q||`${r.name} ${r.detail} ${r.displayType}`.toLowerCase().includes(q));
  const create=()=>active==='services'?onNewService():onCreate?.(active==='topics'?'topic':active==='types'?'topicDataType':'qos');
  return <div className="center-workbench asset-library-workbench">
    <div className="editor-heading"><div><Text type="secondary" className="editor-eyebrow">PROJECT REGISTRY / REUSABLE ASSETS</Text><h2>Asset Library</h2><Text type="secondary">Service, Topic, Data Type, QoS를 Component와 관계없이 생성하고 여러 Component에서 재사용합니다.</Text></div><Button icon={<PlusOutlined/>} type="primary" onClick={create}>{sections.find(x=>x.key===active)?.title} 생성</Button></div>
    <div className="asset-summary-cards">{sections.map(section=><Card key={section.key} hoverable className={active===section.key?'active':''} size="small" onClick={()=>{setActive(section.key);setQuery('')}}><strong>{section.title}</strong><Text type="secondary">{all[section.key].length} Assets</Text></Card>)}</div>
    <Tabs activeKey={active} onChange={value=>{setActive(value);setQuery('')}} items={sections.map(s=>({key:s.key,label:s.title}))}/>
    <Space style={{width:'100%',justifyContent:'space-between',marginBottom:12}} wrap><Text type="secondary">{sections.find(x=>x.key===active)?.description}</Text><Input.Search allowClear placeholder="Asset 검색" value={query} onChange={e=>setQuery(e.target.value)} style={{width:220}}/></Space>
    <Table rowKey="id" dataSource={rows} size="small" pagination={{pageSize:12}} columns={[
      {title:'Name',dataIndex:'name',render:(v,r)=><Button size="small" type="link" onClick={()=>select({kind:r.kind,id:r.id})}>{v}</Button>},
      {title:'ICD / DDS 개념',dataIndex:'displayType'},
      {title:'Details',dataIndex:'detail'},
      {title:'Source',dataIndex:'source',render:v=><Tag color={v==='custom'||v==='project'?'purple':'blue'}>{v==='custom'||v==='project'?'Project Custom':'UMAA / ICD Mock'}</Tag>},
    ]}/>
    <Alert type="info" showIcon style={{marginTop:15}} message="ICD 용어 우선" description="Topic / Data Type / Attribute 명칭을 사용합니다. Report / Status는 Service Category 또는 reportXXX Operation이며, Command / Response와 Request / Reply는 별도 Flow Control입니다."/>
  </div>;
}
