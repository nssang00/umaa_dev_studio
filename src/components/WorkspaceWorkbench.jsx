import { useEffect, useState } from 'react';
import { Alert, Button, Descriptions, Empty, Form, Input, Modal, Select, Space, Table, Tabs, Tag, Typography, message } from 'antd';
import { ApartmentOutlined, ArrowLeftOutlined, BuildOutlined, NodeIndexOutlined, PlusOutlined, ThunderboltOutlined } from '@ant-design/icons';
import { useEditorStore } from '../stores/useEditorStore.js';
import { Diagram } from './Diagram.jsx';
import { RuntimeSettings } from './DesignDetails.jsx';
import { CommunicationView } from './CommunicationView.jsx';
import { ServiceWorkbench, TopicWorkbench, OperationWorkbench, FunctionalAreaWorkbench, QosWorkbench } from './ContractWorkbench.jsx';
import { TypeWorkbench } from './TypeWorkbench.jsx';
import { BehaviorGraph } from './BehaviorGraph.jsx';
import { ComponentJourney } from './ComponentJourney.jsx';
import { AssetLibraryWorkbench } from './AssetLibraryWorkbench.jsx';
import { DataPatternsWorkbench } from './DataPatternsWorkbench.jsx';
import { FlowControlRulesWorkbench } from './FlowControlRulesWorkbench.jsx';
import { DdsConfigurationWorkbench } from './DdsConfigurationWorkbench.jsx';
import { deriveEndpoints } from '../logic/endpoints.js';
const {Text}=Typography;

function TypeDesignerPane({kind,id}) {
  return <div className="type-designer-layout"><TypeWorkbench kind={kind} id={id}/></div>;
}
function ComponentWorkbench({component,onNewComponent}) {
  const s=useEditorStore(x=>x.snapshot);
  const select=useEditorStore(x=>x.select);
  const addBinding=useEditorStore(x=>x.addBinding);
  const autoLayout=useEditorStore(x=>x.autoLayout);
  const [tab,setTab]=useState('interfaces');
  const [modal,setModal]=useState(false);
  const [serviceId,setServiceId]=useState(null);
  const [role,setRole]=useState('consumer');
  const bindings=s.bindings.filter(b=>b.componentId===component.id);
  const endpoints=deriveEndpoints(s,component.id);
  return <div className="assembly-workbench">
    <div className="workspace-toolbar"><div><Typography.Title level={5} style={{margin:0}}><ApartmentOutlined/> {component.name}</Typography.Title><Text type="secondary">Component 설계 · Interface 바인딩 → 연결 → Runtime → Build</Text></div>
      <Space><Button size="small" onClick={()=>select({kind:'diagram',id:'system'})}>System Assembly</Button><Button size="small" type="primary" icon={<PlusOutlined/>} onClick={()=>setModal(true)}>Service Binding</Button></Space></div>
    <div className="component-context-tabs"><Tabs activeKey={tab} onChange={setTab} size="small" items={[
      {key:'interfaces',label:`Interfaces (${bindings.length})`},{key:'assembly',label:'Assembly Diagram'},{key:'behavior',label:'Behavior Graph'},{key:'runtime',label:'Runtime / QoS'}
    ]}/></div>
    {tab==='interfaces'&&<div className="center-workbench assembly-details"><h2>{component.name} · Service Interfaces</h2><p>서비스 선택 후 Provider 또는 Consumer로 바인딩합니다. 실제 Reader/Writer는 Service Contract에서 자동 파생됩니다.</p>
      <Table size="small" rowKey="id" pagination={false} dataSource={bindings} columns={[
        {title:'Role',dataIndex:'role',render:v=><Tag color={v==='provider'?'blue':'orange'}>{v==='provider'?'P · Provide':'C · Consume'}</Tag>,width:120},
        {title:'Service',render:(_,r)=><Button type="link" size="small" onClick={()=>select({kind:'binding',id:r.id})}>{s.services.find(x=>x.id===r.serviceId)?.name}</Button>},
        {title:'Pattern',render:(_,r)=>s.services.find(x=>x.id===r.serviceId)?.flowControl,width:160},
        {title:'DDS Endpoints',render:(_,r)=><Button size="small" onClick={()=>select({kind:'binding',id:r.id})}>{endpoints.filter(e=>e.bindingId===r.id).length} 확인</Button>,width:140}
      ]}/>
      <Button type="primary" icon={<PlusOutlined/>} onClick={()=>setModal(true)}>Service Binding 추가</Button>
      <Alert style={{marginTop:14}} showIcon type="info" message="Service Contract와 Component는 분리됩니다." description="공식 UMAA Service 패턴은 수정하지 않습니다. Component는 이를 제공하거나 소비하는 역할과 실행 설정을 선택합니다."/></div>}
    {tab==='assembly'&&<div className="canvas-section"><Diagram/></div>}
    {tab==='behavior'&&<div className="behavior-container"><BehaviorGraph componentId={component.id}/></div>}
    {tab==='runtime'&&<div className="center-workbench assembly-details"><h2>{component.name} · DDS Runtime Configuration</h2><RuntimeSettings componentId={component.id}/></div>}
    <Modal title={`${component.name} · Service Binding 추가`} open={modal} onCancel={()=>setModal(false)} okText="바인딩 추가" onOk={()=>{
      if(!serviceId){message.warning('Service를 선택하세요.');return;}
      if(addBinding(component.id,serviceId,role)){setModal(false);message.success('Service 역할을 추가했습니다.');}else message.warning('이미 존재하는 Binding이거나 유효하지 않습니다.');
    }}>
      <p>Service 계약은 그대로 유지됩니다. Component의 역할만 선택합니다.</p>
      <label>Service</label><Select style={{width:'100%',margin:'6px 0 14px'}} showSearch optionFilterProp="label" value={serviceId} onChange={setServiceId} placeholder="UMAA 또는 Custom Service 검색" options={s.services.map(svc=>({label:`${svc.functionalArea} · ${svc.name}${svc.source==='custom'?' (Custom)':''}`,value:svc.id}))}/>
      <label>Role</label><Select style={{width:'100%',marginTop:6}} value={role} onChange={setRole} options={[{label:'Provider — 구현 및 발행',value:'provider'},{label:'Consumer — 사용 및 수신',value:'consumer'}]}/>
    </Modal>
  </div>;
}
function BindingWorkbench({binding}) {
  const s=useEditorStore(x=>x.snapshot);
  const select=useEditorStore(x=>x.select);
  const removeBinding=useEditorStore(x=>x.removeBinding);
  const svc=s.services.find(v=>v.id===binding.serviceId);
  const comp=s.components.find(c=>c.id===binding.componentId);
  const endpoints=deriveEndpoints(s,binding.componentId).filter(e=>e.bindingId===binding.id);
  const connections=s.connections.filter(c=>c.providerBindingId===binding.id||c.consumerBindingId===binding.id);
  return <div className="center-workbench"><div className="editor-heading"><div><Text className="editor-eyebrow" type="secondary">COMPONENT SERVICE BINDING</Text><h2>{svc?.name}</h2><Space><Tag color={binding.role==='provider'?'blue':'orange'}>{binding.role.toUpperCase()}</Tag><Tag>{comp?.name}</Tag><Tag>{svc?.flowControl}</Tag></Space></div><Space><Button size="small" onClick={()=>select({kind:'component',id:comp.id})}>Component</Button><Button size="small" type="primary" onClick={()=>select({kind:'service',id:svc.id})}>Contract Graph</Button><Button size="small" danger onClick={()=>Modal.confirm({title:'Binding 삭제',content:'연결된 Service Connection도 삭제됩니다.',onOk:()=>removeBinding(binding.id)})}>삭제</Button></Space></div>
    <Alert type="info" showIcon message="Endpoint는 계약과 역할에서 파생됩니다." description="여기서 통신 패턴을 다시 선택하지 않습니다. Reader/Writer는 Service Operation과 DDS Action에 따라 결정됩니다."/>
    <h3>Derived DDS Endpoints ({endpoints.length})</h3><Table size="small" rowKey={r=>`${r.topicName}-${r.direction}`} pagination={false} dataSource={endpoints} columns={[
      {title:'Endpoint',dataIndex:'direction',width:105,render:v=><Tag color={v==='writer'?'blue':'orange'}>{v.toUpperCase()}</Tag>},
      {title:'Topic',dataIndex:'topicName'},
      {title:'Data Type',dataIndex:'typeName',render:(v,r)=><Button type="link" size="small" onClick={()=>select({kind:'message',id:r.messageTypeId})}>{v}</Button>},
      {title:'Operation',dataIndex:'operations',render:v=>v.join(', ')}
    ]}/>
    <h3>Service Connections</h3>{connections.length?connections.map(c=><Button key={c.id} style={{marginRight:8}} onClick={()=>select({kind:'connection',id:c.id})}>DDS Communication · {c.id.slice(0,8)}</Button>):<Text type="secondary">아직 다른 Component와 논리 연결이 없습니다. Assembly Diagram에서 같은 Service의 P/C 포트를 연결하세요.</Text>}
  </div>;
}
export function WorkspaceWorkbench({onNewComponent,onNewService,onGenerate,onCreate}) {
  const snapshot=useEditorStore(s=>s.snapshot);
  const selection=useEditorStore(s=>s.selection);
  const select=useEditorStore(s=>s.select);
  const autoLayout=useEditorStore(s=>s.autoLayout);
  const [advancedComponentId,setAdvancedComponentId]=useState(null);
  useEffect(()=>setAdvancedComponentId(null),[selection?.kind,selection?.id]);
  if(!snapshot)return <Empty/>;
  const kind=selection?.kind??'diagram';
  const component=kind==='component'?snapshot.components.find(c=>c.id===selection.id):null;
  if(kind==='component'&&component)return advancedComponentId===component.id?
    <div className="assembly-workbench"><div className="expert-back-bar"><Button size="small" icon={<ArrowLeftOutlined/>} onClick={()=>setAdvancedComponentId(null)}>간단한 Component 제작 화면</Button><Text type="secondary">고급 편집 · 서비스 계약과 Runtime 세부 구성</Text></div><ComponentWorkbench key={component.id} component={component} onNewComponent={onNewComponent}/></div>:
    <ComponentJourney key={component.id} component={component} onGenerate={onGenerate} onAdvanced={()=>setAdvancedComponentId(component.id)}/>;
  if(kind==='binding'){
    const binding=snapshot.bindings.find(b=>b.id===selection.id);
    return binding?<BindingWorkbench binding={binding}/>:<Empty/>;
  }
  if(kind==='diagram')return <div className="assembly-workbench">
    <div className="workspace-toolbar"><div><Typography.Title level={5} style={{margin:0}}><NodeIndexOutlined/> System Assembly</Typography.Title><Text type="secondary">Service Port를 직접 연결하세요. 연결선 클릭 → DDS 통신 상세</Text></div><Space><Button size="small" onClick={autoLayout}>자동 배치</Button><Button size="small" icon={<PlusOutlined/>} onClick={onNewComponent}>Component</Button><Button size="small" onClick={onNewService}>Custom Service</Button></Space></div>
    <div className="canvas-section"><Diagram/></div></div>;
  if(kind==='assetLibrary')return <AssetLibraryWorkbench onCreate={onCreate} onNewService={onNewService}/>;
  if(kind==='dataPatterns')return <DataPatternsWorkbench/>;
  if(kind==='flowRules')return <FlowControlRulesWorkbench ruleId={selection.id==='catalog'?null:selection.id}/>;
  if(kind==='ddsConfig')return <DdsConfigurationWorkbench/>;
  if(kind==='connection')return <CommunicationView connectionId={selection.id} onBack={()=>select({kind:'diagram',id:'system'})}/>;
  if(kind==='service')return <ServiceWorkbench key={selection.id} serviceId={selection.id}/>;
  if(kind==='interface')return <ServiceWorkbench key={selection.id} serviceId={snapshot.interfaces.find(i=>i.id===selection.id)?.serviceId}/>;
  if(kind==='operation')return <OperationWorkbench operationId={selection.id}/>;
  if(kind==='message'||kind==='dataType')return <TypeDesignerPane key={selection.id} kind={kind} id={selection.id}/>;
  if(kind==='topic')return <TopicWorkbench topicId={selection.id}/>;
  if(kind==='functionalArea')return <FunctionalAreaWorkbench id={selection.id}/>;
  if(kind==='qos')return <QosWorkbench id={selection.id}/>;
  if(kind==='build')return <div className="center-workbench"><div className="editor-heading"><div><Text className="editor-eyebrow" type="secondary">BUILD & DEPLOYMENT</Text><h2><BuildOutlined/> 코드 골격 생성</h2></div><Button type="primary" icon={<ThunderboltOutlined/>} onClick={()=>onGenerate('all')}>코드 골격 생성</Button></div><Alert type="warning" showIcon message="현재 DDS 통신이 없는 Shared Library 골격" description="IDL 계약 연결, DDS SDK Adapter, Component Host, Command 상태 머신 실행 코드는 아직 구현되지 않았습니다."/><Table style={{marginTop:18}} size="small" rowKey="id" pagination={false} dataSource={snapshot.components.map(c=>({...c,endpointCount:deriveEndpoints(snapshot,c.id).length}))} columns={[{title:'Component',dataIndex:'name'}, {title:'Endpoint Spec',dataIndex:'endpointCount'}, {title:'Target',render:()=>snapshot.project.targetPlatform==='windows'?'.dll scaffold':'.so scaffold'}]}/></div>;
  return <Empty description="Explorer에서 Component, Service 또는 Type을 선택하세요"/>;
}
