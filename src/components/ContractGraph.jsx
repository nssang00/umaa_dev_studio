import { useMemo, useState } from 'react';
import { Alert, Button, Form, Input, Modal, Select, Space, Tag, Typography, message } from 'antd';
import { PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { ReactFlow, Background, Controls, MiniMap } from '@xyflow/react';
import { useEditorStore } from '../stores/useEditorStore.js';

import { serviceContractGraph, validateCustomContractLink } from '../logic/editorGraphs.js';
import { StudioGraphNode } from './GraphNodes.jsx';
const nodeTypes={studio:StudioGraphNode};
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
  const service=snapshot?.services.find(s=>s.id===serviceId);
  const custom=service?.source==='custom';
  const graph=useMemo(()=>snapshot?serviceContractGraph(snapshot,serviceId):{nodes:[],edges:[]},[snapshot,serviceId]);
  const nodes=useMemo(()=>graph.nodes.map(n=>({id:n.id,type:'studio',position:n.position,draggable:false,data:{...n},selected:focus===n.id})),[graph,focus]);
  const edges=useMemo(()=>graph.edges.map(e=>({...e,type:'smoothstep',animated:false,style:{stroke:'#9baec4',strokeWidth:1.6},labelStyle:{fill:'#698098',fontSize:10}})),[graph]);
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
      <Space wrap><Tag color={custom?'purple':'blue'}>{custom?'CUSTOM · EDITABLE':'UMAA STANDARD · READ ONLY'}</Tag><Tag>{service?.flowControl}</Tag><Typography.Text type="secondary">{ops.length} operations · {graph.nodes.filter(n=>n.kind==='topic').length} topics</Typography.Text></Space>
      {custom&&<Space size="small"><Button icon={<PlusOutlined/>} size="small" onClick={()=>open('type')}>Type</Button><Button icon={<PlusOutlined/>} size="small" onClick={()=>open('topic')}>Topic</Button><Button icon={<PlusOutlined/>} size="small" type="primary" onClick={()=>open('operation')}>Operation</Button></Space>}
    </div>
    <div className="graph-explanation">Operation → DDS Action → Topic → Data Type. {custom?'핸들을 드래그하여 Action→Topic 또는 Topic→Type 참조를 변경할 수 있습니다.':'공식 계약은 읽기 전용이며, 노드 더블클릭으로 원본 정보를 열 수 있습니다.'}</div>
    <div className="contract-graph-canvas"><ReactFlow key={serviceId} nodes={nodes} edges={edges} nodeTypes={nodeTypes} nodesDraggable={false} nodesConnectable={custom} onConnect={onConnect} onNodeClick={(_,n)=>setFocus(n.id)} onNodeDoubleClick={(_,n)=>openNode(n)} fitView minZoom={.18} maxZoom={1.6} proOptions={{hideAttribution:true}}>
      <Background gap={20} color="#dce6f2"/><Controls showInteractive={false}/><MiniMap pannable zoomable/>
    </ReactFlow></div>
    {focus&&<div className="graph-selected-bar">
      <Typography.Text strong>선택: {graph.nodes.find(n=>n.id===focus)?.title}</Typography.Text>
      <Space>{['operation','topic','type'].includes(focus.split(':')[0])&&<Button size="small" onClick={()=>openNode({id:focus})}>상세 편집 열기</Button>}
        {custom&&focus.startsWith('operation:')&&<Button size="small" danger onClick={()=>Modal.confirm({title:'Custom Operation 삭제',content:'이 Operation과 연결된 DDS Action을 제거합니다.',onOk:()=>{removeOp(focus.slice(10));setFocus(null);}})}>Operation 삭제</Button>}
      </Space>
    </div>}
    <Alert type="info" showIcon style={{marginTop:10}} message="Operation과 DDS Topic은 항상 1:1이 아닙니다." description="UMAA에서 Query는 일반적으로 Subscribe, Cancel은 기존 Command 인스턴스 Dispose로 구현됩니다. Service 패턴은 역할 바인딩 시 자동 파생됩니다."/>
    <Modal open={!!dialog} title={`Custom ${dialog??''} 생성`} okText="계약에 추가" onOk={handleSubmit} onCancel={()=>setDialog(null)} destroyOnClose>
      <Form form={form} layout="vertical" initialValues={{action:'publish',direction:'output',actor:'provider',optionalConsumer:false}}>
        <Form.Item name="name" label="이름" rules={[{required:true},{pattern:idRx,message:'IDL 식별자 형식으로 입력하세요'}]}><Input placeholder={dialog==='type'?'NewSensorReportType':dialog==='topic'?'NewSensorReportTopic':'reportNewSensor'}/></Form.Item>
        {dialog==='topic'&&<Form.Item name="typeId" label="Data Type" rules={[{required:true}]}><Select showSearch optionFilterProp="label" options={ownedTypes.map(m=>({label:m.name,value:m.id}))}/></Form.Item>}
        {dialog==='operation'&&<>
          <Form.Item name="topicId" label="DDS Topic" rules={[{required:true}]}><Select showSearch optionFilterProp="label" options={reusableTopics.map(t=>({label:t.name,value:t.id}))}/></Form.Item>
          <Form.Item name="action" label="DDS Action"><Select options={['publish','subscribe','dispose'].map(v=>({label:v,value:v}))}/></Form.Item>
          <Form.Item name="direction" label="Interface Direction (Provider 기준)" rules={[{required:true}]}><Select options={[
            {label:'INPUT · Consumer → Provider',value:'input'},
            {label:'OUTPUT · Provider → Consumer',value:'output'},
          ]}/></Form.Item>
          <Form.Item name="actor" label="DDS Actor (독립 지정)" rules={[{required:true}]}><Select options={[
            {label:'Consumer',value:'consumer'},{label:'Provider',value:'provider'},
          ]}/></Form.Item>
          <Typography.Text type="secondary" className="small-hint">
            INPUT/OUTPUT은 Service 계약 방향입니다. Query가 INPUT이어도 DDS 동작은 Consumer Subscribe일 수 있습니다.
          </Typography.Text>
        </>}
      </Form>
    </Modal>
  </div>;
}
