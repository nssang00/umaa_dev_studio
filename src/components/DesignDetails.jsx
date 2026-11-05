import { useMemo, useState } from 'react';
import { Alert, Button, Divider, Form, Input, InputNumber, Modal, Select, Space, Table, Tag, Typography, message, Descriptions } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useEditorStore } from '../stores/useEditorStore.js';
import { deriveEndpoints } from '../logic/endpoints.js';
const { Text, Title } = Typography;
const FIELD_TYPES = ['boolean','long','unsigned long','double','float','string'];
export function RuntimeSettings({ componentId }) {
  const snapshot = useEditorStore(s=>s.snapshot);
  const update = useEditorStore(s=>s.updateComponentRuntime);
  if (!snapshot) return null;
  const cfg = snapshot.componentRuntime?.[componentId] ?? {};
  const change = key => value => update(componentId,{[key]:value});
  return <>
    <Divider orientation="left">DDS Runtime Configuration</Divider>
    <Text type="secondary" className="small-hint">논리 Service 계약을 변경하지 않고 Component 인스턴스의 DDS 설정을 변경합니다. 실행 DDS 적용은 아직 미구현입니다.</Text>
    <div className="design-form-grid">
      <label>Domain ID <InputNumber min={0} max={232} size="small" value={cfg.domainId??0} onChange={change('domainId')} style={{width:'100%'}} /></label>
      <label>Partition <Input size="small" value={cfg.partition??''} onChange={e=>change('partition')(e.target.value)} placeholder="default partition" /></label>
      <label>QoS Profile <Select size="small" value={cfg.qosProfileId} onChange={change('qosProfileId')} style={{width:'100%'}} options={snapshot.qosProfiles.map(q=>({label:q.name,value:q.id}))} /></label>
      <label>Command Arbitration <Select size="small" value={cfg.commandArbitration} onChange={change('commandArbitration')} style={{width:'100%'}} options={[
        {label:'User implementation (required)',value:'user-implementation'},
        {label:'Priority — design proposal',value:'priority'},
        {label:'Reject conflicting commands',value:'reject-conflicts'},
      ]}/></label>
      <label>Source GUID <Input size="small" value={cfg.sourceGuid??''} onChange={e=>change('sourceGuid')(e.target.value)} placeholder="assigned at deployment" /></label>
      <label>Destination GUID <Input size="small" value={cfg.destinationGuid??''} onChange={e=>change('destinationGuid')(e.target.value)} placeholder="assigned at deployment" /></label>
      <label>Host Mode <Select size="small" value={cfg.hostMode} onChange={change('hostMode')} style={{width:'100%'}} options={[{label:'Shared process',value:'shared-process'},{label:'Isolated process',value:'isolated-process'}]}/></label>
    </div>
    <Alert style={{marginTop:12}} type="info" showIcon message="컴파일 산출물은 DLL/SO 골격" description="ABI/Manifest/JSON 생성만 지원합니다. DDS 미들웨어 연결과 Command Arbitration 실제 알고리즘은 구현자가 완성해야 합니다."/>
  </>;
}
export function ConnectionProtocol({ connection }) {
  const s=useEditorStore(v=>v.snapshot);
  if (!s||!connection) return null;
  const provider=s.bindings.find(b=>b.id===connection.providerBindingId);
  const consumer=s.bindings.find(b=>b.id===connection.consumerBindingId);
  const svc=s.services.find(v=>v.id===provider?.serviceId);
  const ops=s.operations.filter(op=>op.serviceId===svc?.id);
  const rows=ops.map(op=>{
    const topic=s.topics.find(t=>t.id===op.topicId), mt=s.messages.find(m=>m.id===topic?.messageTypeId);
    const from = op.actor === 'consumer' ? 'Consumer' : 'Provider';
    const to=from === 'Consumer' ? 'Provider' : 'Consumer';
    return {...op, topic:topic?.name??'—', type:mt?.name??'—', flow:op.action==='dispose'?`${from} · Dispose`:op.action==='subscribe'?`${from} · Subscribe`:`${from} → ${to}`};
  });
  const pEndpoints=deriveEndpoints(s,provider?.componentId).filter(e=>e.bindingId===provider?.id);
  const cEndpoints=deriveEndpoints(s,consumer?.componentId).filter(e=>e.bindingId===consumer?.id);
  return <>
    <Divider orientation="left">DDS Pattern Expansion</Divider>
    <Space wrap size="small"><Tag color="blue">{svc?.flowControl}</Tag><Tag>{ops.length} Operations</Tag><Tag>{pEndpoints.length} Provider Endpoints</Tag><Tag>{cEndpoints.length} Consumer Endpoints</Tag></Space>
    <Text type="secondary" className="small-hint">React Flow의 선은 논리적 Service 사용 관계입니다. 실제 DDS는 Topic 기반 Pub/Sub이고, Query는 대부분 구독, Cancel은 dispose를 사용합니다.</Text>
    <Table size="small" pagination={false} rowKey="id" scroll={{x:475}} dataSource={rows} columns={[
      {title:'Operation',dataIndex:'name',width:180},
      {title:'DDS Action',dataIndex:'flow',width:138,render:(v,r)=><><Tag>{r.action}</Tag><div style={{fontSize:10}}>{v}</div></>},
      {title:'Topic → Data Type',dataIndex:'topic',render:(v,r)=><><div>{v}</div><Text type="secondary" style={{fontSize:10}}>{r.type}</Text></>},
    ]}/>
    {svc?.flowControl==='command-response' && <Alert type="warning" showIcon message="Command Flow Control 요구" description="sessionID, destination GUID, 상태 전이, Command update/cancel/cleanup 및 기존 명령 복구를 구현해야 합니다. Wrapper는 아직 골격입니다."/>}
  </>;
}
export function QosEditor({profileId}) {
  const s=useEditorStore(v=>v.snapshot);
  const update=useEditorStore(v=>v.updateQosProfile);
  const p=s?.qosProfiles.find(x=>x.id===profileId);
  if(!p) return null;
  return <>
    <Title level={5}>{p.name}</Title>
    <Tag color="purple">Project QoS Profile</Tag>
    <div className="design-form-grid">
      <label>Reliability<Select size="small" style={{width:'100%'}} value={p.reliability} onChange={v=>update(p.id,{reliability:v})} options={[{value:'reliable',label:'RELIABLE'},{value:'best_effort',label:'BEST_EFFORT'}]}/></label>
      <label>Durability<Select size="small" style={{width:'100%'}} value={p.durability} onChange={v=>update(p.id,{durability:v})} options={[{value:'volatile',label:'VOLATILE'},{value:'transient_local',label:'TRANSIENT_LOCAL'},{value:'transient',label:'TRANSIENT'},{value:'persistent',label:'PERSISTENT'}]}/></label>
      <label>History<Select size="small" style={{width:'100%'}} value={p.historyKind} onChange={v=>update(p.id,{historyKind:v})} options={[{value:'keep_last',label:'KEEP_LAST'},{value:'keep_all',label:'KEEP_ALL'}]}/></label>
      <label>History depth<InputNumber size="small" min={1} value={p.historyDepth} onChange={v=>update(p.id,{historyDepth:v})} style={{width:'100%'}}/></label>
      <label>QoS Library<Input size="small" value={p.libraryName??'Project QoS'} onChange={e=>update(p.id,{libraryName:e.target.value})}/></label>
      <label>Base QoS Profile<Select allowClear size="small" value={p.baseProfileId??undefined} onChange={v=>update(p.id,{baseProfileId:v??null})} style={{width:'100%'}} options={s.qosProfiles.filter(q=>q.id!==p.id).map(q=>({label:q.name,value:q.id}))}/></label>
      <label>Presentation Access Scope<Select size="small" value={p.presentationAccessScope??'topic'} onChange={v=>update(p.id,{presentationAccessScope:v})} style={{width:'100%'}} options={[{value:'instance',label:'INSTANCE'},{value:'topic',label:'TOPIC'},{value:'group',label:'GROUP'}]}/></label>
      <label>Ordered Access<Select size="small" value={p.orderedAccess?'true':'false'} onChange={v=>update(p.id,{orderedAccess:v==='true'})} style={{width:'100%'}} options={[{value:'false',label:'false'},{value:'true',label:'true'}]}/></label>
      <label>Coherent Access<Select size="small" value={p.coherentAccess?'true':'false'} onChange={v=>update(p.id,{coherentAccess:v==='true'})} style={{width:'100%'}} options={[{value:'false',label:'false'},{value:'true',label:'true'}]}/></label>
    </div>
    {p.baseProfileId&&<Alert style={{marginTop:12}} showIcon type="info" message="Profile 참조 관계" description={`${p.name} → ${s.qosProfiles.find(q=>q.id===p.baseProfileId)?.name??'Missing'} (참조 정보만 저장; Runtime 정책 상속/병합 구현 필요)`}/>}
    <Alert style={{marginTop:16}} showIcon type="warning" message="실행 호환성 검증 필요" description="QoS 요구조건은 Topic/Writer/Reader/Publisher/Subscriber에 따라 다릅니다. 이 기본 Profile은 ICD별 QoS 제약의 완전한 구현이 아닙니다."/>
  </>;
}
export function CustomTypeEditor({typeId}) {
  const s=useEditorStore(v=>v.snapshot);
  const addField=useEditorStore(v=>v.addDataTypeField);
  const addMember=useEditorStore(v=>v.addEnumMember);
  const [open,setOpen]=useState(false);
  const [form]=Form.useForm();
  const t=s?.dataTypes.find(t=>t.id===typeId);
  if(!t) return null;
  return <>
    <Title level={5}>{t.name}</Title>
    <Tag color="purple">Custom {t.kind==='enum'?'Enum':'Struct'} · IDL</Tag>
    <p><Text code>{t.namespace}::{t.name}</Text></p>
    <Table size="small" pagination={false} rowKey={r=>r.name??r} dataSource={t.kind==='enum' ? t.members.map(name=>({name,type:'enum member'})) : t.fields} columns={[{title:t.kind==='enum'?'Enumerator':'Field',dataIndex:'name'},{title:'Data Type',dataIndex:'type'}]}/>
    <Button size="small" block icon={<PlusOutlined/>} style={{marginTop:10}} onClick={()=>setOpen(true)}>{t.kind==='enum'?'Enumerator 추가':'Field 추가'}</Button>
    <Modal title={t.kind==='enum'?'Enumerator 추가':'Struct Field 추가'} open={open} onCancel={()=>setOpen(false)} okText="추가" onOk={async()=>{
      try{const v=await form.validateFields();if(t.kind==='enum'?addMember(t.id,v.name):addField(t.id,v.name,v.type)){message.success('추가했습니다.');setOpen(false);form.resetFields();}else message.error('이름 중복 또는 잘못된 식별자');}catch{}
    }}>
      <Form form={form} layout="vertical" initialValues={{type:'double'}}><Form.Item name="name" label="이름" rules={[{required:true},{pattern:/^[A-Za-z_][A-Za-z0-9_]*$/}]}><Input/></Form.Item>
        {t.kind==='struct'&&<Form.Item name="type" label="Data Type" rules={[{required:true}]}><Select showSearch options={[...FIELD_TYPES,...(s?.dataTypes??[]).filter(x=>x.id!==t.id).map(x=>`${x.namespace}::${x.name}`)].map(v=>({label:v,value:v}))}/></Form.Item>}
      </Form>
    </Modal>
  </>;
}
export function CustomServiceEditor({service}) {
  const s=useEditorStore(v=>v.snapshot);
  const addType=useEditorStore(v=>v.addCustomMessageType);
  const addTopic=useEditorStore(v=>v.addCustomTopic);
  const addOp=useEditorStore(v=>v.addCustomOperation);
  const [editing,setEditing]=useState(null);
  const [form]=Form.useForm();
  const ownedTopics=useMemo(()=>s?.topics.filter(t=>s.operations.some(o=>o.serviceId===service.id&&o.topicId===t.id))??[],[s,service]);
  const ownMessageTypes=s?.messages.filter(m=>m.source==='custom')??[];
  return <>
    <Divider orientation="left">Custom Contract Editor</Divider>
    <Text type="secondary" className="small-hint">패턴 템플릿은 최초 Operation 세트를 생성합니다. 이후 Data Type → Topic → Operation을 추가하여 계약을 확장할 수 있습니다.</Text>
    <Space wrap><Button size="small" icon={<PlusOutlined/>} onClick={()=>{form.resetFields();setEditing('message')}}>Data Type</Button>
      <Button size="small" icon={<PlusOutlined/>} onClick={()=>{form.resetFields();setEditing('topic')}}>Topic</Button>
      <Button size="small" icon={<PlusOutlined/>} onClick={()=>{form.resetFields();setEditing('operation')}}>Operation</Button></Space>
    <Modal title={`Custom ${editing??''} 추가`} open={!!editing} onCancel={()=>setEditing(null)} okText="추가" onOk={async()=>{
      try{const v=await form.validateFields();let ok=false;
        if(editing==='message')ok=addType(service.id,v.name);
        if(editing==='topic')ok=addTopic(service.id,v.name,v.typeId);
        if(editing==='operation')ok=addOp(service.id,v.name,v.topicId,v.action,v.actor,v.optionalConsumer);
        if(ok){setEditing(null);form.resetFields();message.success('Custom Contract를 확장했습니다.');}else message.error('중복 또는 잘못된 정의입니다.');
      }catch{}
    }}>
      <Form form={form} layout="vertical" key={`${service.id}-${editing}`} initialValues={{action:'publish',actor:'provider',optionalConsumer:false}}>
        <Form.Item name="name" label={editing==='message'?'IDL Data Type 이름':editing==='topic'?'Topic 이름':'Operation 이름'} rules={[{required:true},{pattern:/^[A-Za-z_][A-Za-z0-9_]*$/}]}><Input placeholder={editing==='message'?'CustomSensorReportType':editing==='topic'?'CustomSensorReportType':'reportCustomSensor'}/></Form.Item>
        {editing==='topic'&&<Form.Item name="typeId" label="Topic에서 전달할 Data Type" rules={[{required:true}]}><Select showSearch optionFilterProp="label" options={ownMessageTypes.map(m=>({label:m.name,value:m.id}))}/></Form.Item>}
        {editing==='operation'&&<>
          <Form.Item name="topicId" label="DDS Topic" rules={[{required:true}]}><Select showSearch optionFilterProp="label" options={ownedTopics.map(t=>({label:t.name,value:t.id})).concat(s.topics.filter(t=>!ownedTopics.includes(t)&&ownMessageTypes.some(m=>m.id===t.messageTypeId)).map(t=>({label:t.name,value:t.id})))}/></Form.Item>
          <Form.Item name="action" label="DDS Action"><Select options={['publish','subscribe','dispose'].map(x=>({label:x,value:x}))}/></Form.Item>
          <Form.Item name="actor" label="Actor (Provider 기준 방향)"><Select options={['provider','consumer'].map(x=>({label:x,value:x}))}/></Form.Item>
        </>}
      </Form>
    </Modal>
  </>;
}
