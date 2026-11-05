import { useMemo, useState } from 'react';
import { Alert, Button, Descriptions, Empty, Form, Select, Space, Table, Tabs, Tag, Typography, message } from 'antd';
import { ArrowLeftOutlined, ApiOutlined, CodeOutlined, LinkOutlined, PlusOutlined } from '@ant-design/icons';
import { useEditorStore } from '../stores/useEditorStore.js';
import { CustomServiceEditor, QosEditor, RuntimeSettings } from './DesignDetails.jsx';
import { TypeWorkbench } from './TypeWorkbench.jsx';
import { ContractGraph } from './ContractGraph.jsx';
import { IcdFlowView } from './IcdFlowView.jsx';
import { QosUsageDiagram } from './QosUsageDiagram.jsx';
import { SERVICE_CATEGORIES, categoryForService, categoryLabel, flowLabel } from '../model/icdConcepts.js';
const {Text}=Typography;
const actionLabel={publish:'DDS Publish',subscribe:'DDS Subscribe',dispose:'DDS Dispose'};
export function ServiceWorkbench({serviceId}) {
  const s=useEditorStore(x=>x.snapshot);const select=useEditorStore(x=>x.select);const updateCategory=useEditorStore(x=>x.updateServiceCategory);
  const [tab,setTab]=useState('graph');
  const service=s?.services.find(v=>v.id===serviceId);
  const operations=useMemo(()=>s?.operations.filter(o=>o.serviceId===serviceId).map(op=>{
    const topic=s.topics.find(t=>t.id===op.topicId);
    const type=s.messages.find(m=>m.id===topic?.messageTypeId);
    return {...op,topicName:topic?.name??'—',typeName:type?.name??'—',typeId:type?.id};
  })??[],[s,serviceId]);
  if(!service)return <Empty description="Service를 선택하세요"/>;
  const isCustom=service.source==='custom';
  const topics=[...new Map(operations.filter(o=>o.topicId).map(o=>[o.topicId,{id:o.topicId,name:o.topicName,type:o.typeName,typeId:o.typeId}])).values()];
  const bindings=s.bindings.filter(b=>b.serviceId===service.id);
  const actionStats=['publish','subscribe','dispose'].map(action=>({action,count:operations.filter(op=>op.action===action).length}));
  return <div className="center-workbench">
    <div className="editor-heading"><div><Text className="editor-eyebrow" type="secondary">SERVICE CONTRACT EDITOR</Text><h2><ApiOutlined/> {service.name}</h2><Space wrap><Tag color={isCustom?'purple':'blue'}>{isCustom?'CUSTOM / EDITABLE':'UMAA STANDARD / READ ONLY'}</Tag><Tag>{service.functionalArea}</Tag><Tag>{flowLabel(service.flowControl)}</Tag><Tag color="cyan">{categoryLabel(service)}</Tag></Space></div></div>
    <Text type="secondary">{service.namespace} · {service.description}</Text>
    {isCustom&&<div style={{maxWidth:400,margin:'12px 0'}}><Text type="secondary">Service Category · ICD §3.4 명명 분류 (Flow Control과 별개)</Text><Select style={{width:'100%'}} size="small" value={categoryForService(service)} onChange={v=>updateCategory(service.id,v)} options={SERVICE_CATEGORIES}/></div>}
    <Tabs activeKey={tab} onChange={setTab} items={[
      {key:'graph',label:'Service Interface Diagram',children:<ContractGraph serviceId={serviceId}/>},
      {key:'flow',label:'Flow Control / Report',children:<IcdFlowView serviceId={serviceId}/>},
      {key:'contract',label:'Operations / DDS Actions',children:<>
        <Alert type="info" showIcon message="통신 패턴은 Service의 계약입니다." description="실제 DDS 동작은 Operation별 Publish / Subscribe / Dispose 매핑으로 결정됩니다. Component는 같은 계약을 Provider/Consumer로 사용합니다. 일부 Query와 Cancel에는 독립 Topic이 없습니다." style={{marginBottom:14}}/>
        <Space wrap style={{marginBottom:14}}>{actionStats.map(x=><Tag key={x.action}>{x.action.toUpperCase()} {x.count}</Tag>)}</Space>
        <Table size="small" rowKey="id" pagination={false} scroll={{x:720}} dataSource={operations} columns={[
          {title:'Operation',dataIndex:'name',width:240,render:(v,r)=><Button type="link" size="small" style={{padding:0}} onClick={()=>select({kind:'operation',id:r.id})}>{v}</Button>},
          {title:'Actor',dataIndex:'actor',width:100,render:v=><Tag color={v==='provider'?'blue':'orange'}>{v}</Tag>},
          {title:'DDS Action',dataIndex:'action',width:115,render:v=><Tag>{actionLabel[v]??v}</Tag>},
          {title:'Topic → Data Type',render:(_,r)=><div><Button type="link" size="small" style={{padding:0}} onClick={()=>select({kind:'topic',id:r.topicId})}>{r.topicName}</Button><div><Text type="secondary" style={{fontSize:11}}>{r.typeName}</Text></div></div>}
        ]}/>
      </>},
      {key:'topics',label:`Topic / Data Type (${topics.length})`,children:<>
        <Table rowKey="id" size="small" pagination={false} dataSource={topics} columns={[
          {title:'Topic',dataIndex:'name',render:(v,r)=><Button size="small" type="link" onClick={()=>select({kind:'topic',id:r.id})}>{v}</Button>},
          {title:'Data Type',dataIndex:'type',render:(v,r)=><Button size="small" type="link" onClick={()=>r.typeId&&select({kind:'message',id:r.typeId})}>{v}</Button>}
        ]}/>
        <Text className="small-hint">Topic과 Data Type 이름이 같아도 별도 객체입니다. 공식 IDL은 아직 외부 의존성입니다.</Text>
      </>},
      {key:'usage',label:`Component Usage (${bindings.length})`,children:<Table rowKey="id" size="small" dataSource={bindings.map(b=>({...b,componentName:s.components.find(c=>c.id===b.componentId)?.name??'Unknown'}))} pagination={false} columns={[
        {title:'Component',dataIndex:'componentName',render:(v,r)=><Button type="link" onClick={()=>select({kind:'component',id:r.componentId})}>{v}</Button>},
        {title:'Role',dataIndex:'role',render:v=><Tag color={v==='provider'?'blue':'orange'}>{v.toUpperCase()}</Tag>}
      ]}/>},
      ...(isCustom?[{key:'custom',label:'Edit Custom Contract',children:<><Alert style={{marginBottom:12}} type="warning" showIcon message="이 Service는 UMAA 공식 규격이 아닙니다." description="새 MessageType → Topic → Operation 순서로 확장합니다. 패턴 템플릿은 초기 계약만 생성합니다."/><CustomServiceEditor service={service}/></>}]:[])
    ]}/>
  </div>;
}
export function TopicWorkbench({topicId}) {
  const s=useEditorStore(x=>x.snapshot);const select=useEditorStore(x=>x.select);const updateStandalone=useEditorStore(x=>x.updateStandaloneTopicType);const updateCustom=useEditorStore(x=>x.updateCustomTopicType);
  const topic=s?.topics.find(t=>t.id===topicId);
  if(!topic)return <Empty description="Topic을 선택하세요"/>;
  const msgType=s.messages.find(m=>m.id===topic.messageTypeId);
  const ops=s.operations.filter(o=>o.topicId===topic.id);
  const services=[...new Set(ops.map(o=>o.serviceId))].map(id=>s.services.find(svc=>svc.id===id)).filter(Boolean);
  const editable=topic.source==='custom'||(services.length>0&&services.every(svc=>svc.source==='custom')&&msgType?.source==='custom');
  return <div className="center-workbench">
    <div className="editor-heading"><div><Text className="editor-eyebrow" type="secondary">DDS TOPIC DEFINITION</Text><h2>{topic.name}</h2><Space><Tag>{editable?'Project Custom Topic':'UMAA Standard / Read only'}</Tag></Space></div></div>
    <Descriptions size="middle" bordered column={1}>
      <Descriptions.Item label="Topic Name"><Text code>{topic.name}</Text></Descriptions.Item>
      <Descriptions.Item label="Data Type">{editable?
        <Select showSearch optionFilterProp="label" style={{minWidth:265}} value={topic.messageTypeId} onChange={v=>{if(!(topic.source==='custom'?updateStandalone(topic.id,v):updateCustom(topic.id,v)))message.error('Type 변경 실패');}}
          options={s.messages.filter(m=>m.source==='custom'&&m.namespace===msgType?.namespace).map(m=>({label:`${m.namespace}::${m.name}`,value:m.id}))}/>:
        <Button type="link" onClick={()=>msgType&&select({kind:'message',id:msgType.id})}>{msgType?.name??'Unknown'}</Button>}</Descriptions.Item>
      <Descriptions.Item label="Used by Services">{services.map(svc=><Button key={svc.id} size="small" onClick={()=>select({kind:'service',id:svc.id})}>{svc.name}</Button>)}</Descriptions.Item>
    </Descriptions>
    <h3>Bound Operations</h3>
    <Table rowKey="id" size="small" pagination={false} dataSource={ops} columns={[
      {title:'Operation',dataIndex:'name',render:(v,r)=><Button type="link" size="small" onClick={()=>select({kind:'operation',id:r.id})}>{v}</Button>},
      {title:'DDS Action',dataIndex:'action'}, {title:'Role / Actor',dataIndex:'actor'}]}/>
    <Alert type="info" showIcon message="Topic은 Service Interaction의 DDS 데이터 경로입니다." description="Publish와 Subscribe는 같은 Topic과 호환 Type을 사용합니다. Domain·Partition·QoS는 Component Runtime에서 설정합니다."/>
  </div>;
}
export function OperationWorkbench({operationId}) {
  const s=useEditorStore(x=>x.snapshot);const select=useEditorStore(x=>x.select);
  const op=s?.operations.find(o=>o.id===operationId); if(!op)return <Empty/>;
  const svc=s.services.find(v=>v.id===op.serviceId);const topic=s.topics.find(t=>t.id===op.topicId);const type=s.messages.find(t=>t.id===topic?.messageTypeId);
  return <div className="center-workbench"><div className="editor-heading"><div><Text type="secondary" className="editor-eyebrow">DDS ACTION / OPERATION</Text><h2>{op.name}</h2></div><Button icon={<ArrowLeftOutlined/>} onClick={()=>select({kind:'service',id:op.serviceId})}>Service</Button></div>
    <Descriptions bordered column={1}><Descriptions.Item label="Service"><Button type="link" onClick={()=>select({kind:'service',id:svc?.id})}>{svc?.name}</Button></Descriptions.Item><Descriptions.Item label="Actor"><Tag>{op.actor}</Tag></Descriptions.Item><Descriptions.Item label="DDS Action"><Tag>{op.action}</Tag></Descriptions.Item><Descriptions.Item label="Topic"><Button type="link" onClick={()=>topic&&select({kind:'topic',id:topic.id})}>{topic?.name}</Button></Descriptions.Item><Descriptions.Item label="Data Type"><Button type="link" onClick={()=>type&&select({kind:'message',id:type.id})}>{type?.name}</Button></Descriptions.Item></Descriptions>
    <Alert style={{marginTop:16}} type="info" showIcon message="Operation ≠ 새 DDS Topic" description="subscribe는 Topic 구독, dispose는 기존 Command 인스턴스 정리를 의미합니다. 별도 Query/Cancel Topic은 생성하지 않습니다."/>
  </div>;
}
export function FunctionalAreaWorkbench({id}) {
  const s=useEditorStore(x=>x.snapshot),select=useEditorStore(x=>x.select);
  const area=s?.functionalAreas.find(a=>a.id===id); if(!area)return <Empty/>;
  const services=s.services.filter(svc=>svc.functionalArea===id);
  return <div className="center-workbench"><div className="editor-heading"><div><Text className="editor-eyebrow" type="secondary">FUNCTIONAL AREA CATALOG</Text><h2>{area.id} · {area.name}</h2><Tag color={area.source==='custom'?'purple':'blue'}>{area.source==='custom'?'Custom extension':'UMAA classification'}</Tag></div></div>
    <Descriptions bordered size="small" column={1}><Descriptions.Item label="ICD / Source">{area.icd}</Descriptions.Item><Descriptions.Item label="Loaded Services">{services.length} (부분 예제)</Descriptions.Item></Descriptions>
    <h3>Services</h3><Table rowKey="id" size="small" dataSource={services} pagination={false} columns={[{title:'Service',dataIndex:'name',render:(v,r)=><Button type="link" onClick={()=>select({kind:'service',id:r.id})}>{v}</Button>},{title:'Pattern template',dataIndex:'flowControl'}]}/>
    {area.id==='PO'&&<Alert type="info" showIcon message="PO는 8개 Functional Area 분류에 포함되지만, 별도 공개 PO ICD는 확인되지 않았습니다."/>}
  </div>;
}
export function QosWorkbench({id}) {return <div className="center-workbench"><Text className="editor-eyebrow" type="secondary">DDS QOS PROFILE · OMG DDS-JSON 참고</Text><Tabs items={[{key:'policy',label:'QoS Policies',children:<QosEditor profileId={id}/>},{key:'usage',label:'Profile Relationships Diagram',children:<QosUsageDiagram profileId={id}/>}]} /><div className="editor-note">QoS Profile 정의는 프로젝트의 설계 메타데이터입니다. DDS 벤더별 적용 및 Requested/Offered 검증은 아직 구현하지 않았습니다.</div></div>;}
