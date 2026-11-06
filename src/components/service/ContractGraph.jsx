import { MarkerType } from '@xyflow/react';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Form, Input, Modal, Segmented, Select, Space, Tag, Typography, message } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { ModelGraphCanvas } from '../shared/graph/ModelGraphCanvas.jsx';
import { OperationFields, OPERATION_DEFAULT_VALUES } from './OperationFields.jsx';
import { useEditorStore } from '../../stores/useEditorStore.js';

import { serviceContractGraph, serviceInterfaceGraph, serviceFlowGraph, validateCustomContractLink } from '../../logic/editorGraphs.js';
import { ServiceContractNode } from './ServiceContractNode.jsx';
import { StudioGraphNode } from '../shared/graph/StudioGraphNode.jsx';
const nodeTypes={studio:StudioGraphNode,contract:ServiceContractNode};
const idRx=/^[A-Za-z_][A-Za-z0-9_]*$/;
export function ContractGraph({serviceId}) {
  const snapshot=useEditorStore(s=>s.snapshot);
  const select=useEditorStore(s=>s.select);
  const addMessage=useEditorStore(s=>s.addCustomMessageType);
  const addTopic=useEditorStore(s=>s.addCustomTopic);
  const addOperation=useEditorStore(s=>s.addCustomOperation);
  const mapOp=useEditorStore(s=>s.updateCustomOperationTopic);
  const mapType=useEditorStore(s=>s.updateCustomTopicType);
  const removeOp=useEditorStore(s=>s.removeCustomOperation);
  const [form]=Form.useForm();
  const [dialog,setDialog]=useState(null);
  const [focus,setFocus]=useState(null);
  const [mode,setMode]=useState('contract');
  useEffect(()=>setFocus(null),[serviceId,mode]);
  const service=snapshot?.services.find(s=>s.id===serviceId);
  const custom=service?.source==='custom';
  const graph=useMemo(()=>{
    if(!snapshot)return {nodes:[],edges:[]};
    if(mode==='contract')return serviceInterfaceGraph(snapshot,serviceId);
    if(mode==='flow')return serviceFlowGraph(snapshot,serviceId);
    return serviceContractGraph(snapshot,serviceId);
  },[snapshot,serviceId,mode]);
  const nodes=useMemo(()=>graph.nodes.map(n=>({
    id:n.id,type:mode==='dds'?'studio':'contract',position:n.position,
    draggable:false,data:{...n},selected:focus===n.id,
  })),[graph,focus,mode]);
  const edges=useMemo(()=>graph.edges.map(e=>({
    ...e,type:'smoothstep',animated:false,
    markerEnd:e.relationship==='illustrative-flow'?{type:MarkerType.ArrowClosed,color:'#379781'}:undefined,
    style:{
      stroke:e.relationship==='illustrative-flow'?'#379781':'#9baec4',
      strokeWidth:e.relationship==='illustrative-flow'?2.2:1.6,
      ...(e.relationship==='illustrative-flow'?{strokeDasharray:'6 4'}:{}),
    },
    labelStyle:{fill:'#698098',fontSize:10},
  })),[graph]);
  const ops=snapshot?.operations.filter(o=>o.serviceId===serviceId)??[];
  const ownedTypes=snapshot?.messages.filter(m=>m.source==='custom'&&m.namespace===service?.namespace)??[];
  const reusableTopics=snapshot?.topics.filter(t=>snapshot.messages.some(m=>m.id===t.messageTypeId&&m.source==='custom'))??[];
  const topics=snapshot?.topics.filter(t=>ownedTypes.some(m=>m.id===t.messageTypeId))??[];
  const open=(kind)=>{setDialog(kind);form.resetFields();};
  const onConnect=(c)=>{
    const link=validateCustomContractLink(snapshot,serviceId,c.source,c.target);
    if(!link){message.warning('Custom Service에서만 Action→Topic 또는 Topic→Type을 연결할 수 있습니다.');return;}
    const ok=link.kind==='operation-topic'?mapOp(link.operationId,link.topicId):mapType(link.topicId,link.typeId);
    if(ok)message.success('서비스 계약에 반영했습니다.');else message.error('연결을 변경하지 못했습니다.');
  };
  const openNode=n=>{
    const [kind,id]=n.id.split(':');
    if(kind==='interface')select({kind:'operation',id});
    if(kind==='service')select({kind:'service',id});
    if(kind==='operation'||kind==='topic')select({kind,id});
    if(kind==='type')select({kind:'message',id});
  };
  const handleSubmit=async()=>{
    try{
      const v=await form.validateFields();
      const ok=dialog==='type'?addMessage(serviceId,v.name):dialog==='topic'?addTopic(serviceId,v.name,v.typeId):addOperation(serviceId,v.name,v.topicId,v.action,v.actor,Boolean(v.optionalConsumer),v.direction);
      if(!ok){message.error('ID 중복, Type/Topic 참조 오류 또는 유효하지 않은 이름입니다.');return;}
      setDialog(null);message.success('Custom Service 계약에 추가했습니다.');select({kind:'service',id:serviceId});
    }catch{}
  };
  return <div className="graph-editor">
    <div className="graph-toolbar">
      <Space wrap><Tag color={custom?'purple':'blue'}>{custom?'CUSTOM · EDITABLE':'UMAA STANDARD · READ ONLY'}</Tag><Tag>{service?.flowControl}</Tag><Typography.Text type="secondary">{ops.length} operations · {ops.filter(op=>op.interfaceDirection==='input').length} INPUT / {ops.filter(op=>op.interfaceDirection==='output').length} OUTPUT</Typography.Text></Space>
      {custom&&<Space size="small">
        {mode==='dds'&&<><Button icon={<PlusOutlined/>} size="small" onClick={()=>open('type')}>Type</Button><Button icon={<PlusOutlined/>} size="small" onClick={()=>open('topic')}>Topic</Button></>}
        <Button icon={<PlusOutlined/>} size="small" type="primary" onClick={()=>open('operation')}>Operation</Button>
      </Space>}
    </div>
    <Segmented className="contract-graph-mode-tabs" block size="middle"
      value={mode} onChange={setMode}
      options={[{label:'Contract',value:'contract'},{label:'Flow',value:'flow'},{label:'DDS Mapping',value:'dds'}]}/>
    <div className="graph-explanation">
      {mode==='contract'?'Service → INPUT / OUTPUT → Operation별 Interface 카드. 연결선은 계약 소속 관계이며 각 카드는 Operation의 화면 투영입니다.':
       mode==='flow'?'Consumer / Provider별 Operation과 개념적 흐름입니다. 점선은 설명용이며 정확한 Command–Status 대응이나 실행 순서를 인증하지 않습니다.':
       'Operation → DDS Action → Topic → Data Type. Query/Cancel의 Topic 참조가 별도의 Query/Cancel 메시지 발행을 뜻하지 않습니다.'}
      {custom?' Custom 계약에서만 편집 가능합니다.':' 표준 계약은 읽기 전용입니다.'}
    </div>
    <div className="contract-graph-legend"><span className="membership">계약 소속 / 역할</span>{mode==='flow'&&<span className="flow">개념 흐름 (실제 DDS 선 아님)</span>}</div>
    <div className="contract-graph-canvas">
      <ModelGraphCanvas graphKey={serviceId+':'+mode} nodes={nodes} edges={edges} nodeTypes={nodeTypes}
        nodesDraggable={false} nodesConnectable={custom&&mode==='dds'} onConnect={onConnect}
        onNodeClick={(_,n)=>setFocus(n.id)} onNodeDoubleClick={(_,n)=>openNode(n)}
        fitView minZoom={.18} maxZoom={1.6} backgroundGap={20} miniMap/>
    </div>
    {focus&&<div className="graph-selected-bar">
      <Typography.Text strong>선택: {graph.nodes.find(n=>n.id===focus)?.title}</Typography.Text>
      <Space>{['service','interface','operation','topic','type'].includes(focus.split(':')[0])&&<Button size="small" onClick={()=>openNode({id:focus})}>상세 열기</Button>}
        {custom&&(focus.startsWith('operation:')||focus.startsWith('interface:'))&&<Button size="small" danger onClick={()=>Modal.confirm({title:'Custom Operation 삭제',content:'이 Operation과 연결된 DDS Action을 제거합니다.',onOk:()=>{removeOp(focus.split(':')[1]);setFocus(null);}})}>Operation 삭제</Button>}
      </Space>
    </div>}
    <Alert type="info" showIcon style={{marginTop:10}} message="Interface 카드와 DDS Topic의 의미는 다릅니다."
      description="표준 seed의 InterfaceBlock은 탐색용 그룹이며 Operation별 Interface 카드는 화면용 투영입니다. Query는 Subscribe, Cancel은 기존 keyed Command의 Dispose이며 Topic 참조가 별도 메시지 송신을 의미하지 않습니다."/>
    <Modal open={!!dialog} title={`Custom ${dialog??''} 생성`} okText="계약에 추가" onOk={handleSubmit} onCancel={()=>setDialog(null)} destroyOnClose>
      <Form form={form} layout="vertical" initialValues={OPERATION_DEFAULT_VALUES}>
        <Form.Item name="name" label="이름" rules={[{required:true},{pattern:idRx,message:'IDL 식별자 형식으로 입력하세요'}]}><Input placeholder={dialog==='type'?'NewSensorReportType':dialog==='topic'?'NewSensorReportTopic':'reportNewSensor'}/></Form.Item>
        {dialog==='topic'&&<Form.Item name="typeId" label="Data Type" rules={[{required:true}]}><Select showSearch optionFilterProp="label" options={ownedTypes.map(m=>({label:m.name,value:m.id}))}/></Form.Item>}
        {dialog==='operation'&&<OperationFields topics={reusableTopics}/>}
      </Form>
    </Modal>
  </div>;
}
