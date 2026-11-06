import { useMemo, useState } from 'react';
import { Alert, Button, Form, Input, Modal, Select, Space, Table, Tag, Typography, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { ReactFlow, Background, Controls } from '@xyflow/react';
import { useEditorStore } from '../stores/useEditorStore.js';
import { isLargeCollection, TOPIC_RELATION_KINDS } from '../model/icdConcepts.js';
const {Text}=Typography;
/** Relationship editor; ReactFlow nodes are a projection of stored topicRelations. */
export function DataPatternsWorkbench(){
  const s=useEditorStore(x=>x.snapshot),select=useEditorStore(x=>x.select);
  const add=useEditorStore(x=>x.addTopicRelation),remove=useEditorStore(x=>x.removeTopicRelation);
  const [modal,setModal]=useState(false);const [form]=Form.useForm();
  const graph=useMemo(()=>{
    const rows=s?.topicRelations??[],ids=[...new Set(rows.flatMap(r=>[r.parentTopicId,r.relatedTopicId]))];
    const nodes=ids.map((id,i)=>{
      const t=s.topics.find(t=>t.id===id);
      return {id,type:'default',draggable:false,position:{x:(i%2)*360,y:Math.floor(i/2)*145},data:{label:<div><strong>{t?.name??id}</strong><div style={{fontSize:10}}>Topic · {s.messages.find(m=>m.id===t?.messageTypeId)?.name??'missing Data Type'}</div></div>}};
    });
    const edges=rows.map(r=>({id:r.id,source:r.parentTopicId,target:r.relatedTopicId,label:TOPIC_RELATION_KINDS.find(k=>k.value===r.kind)?.label??r.kind,type:'smoothstep',animated:false}));
    return {nodes,edges};
  },[s]);
  const topics=s?.topics??[],rels=s?.topicRelations??[];
  return <div className="center-workbench">
    <div className="editor-heading"><div><Text className="editor-eyebrow" type="secondary">UMAA ICD §3.8 / §3.9</Text><h2>Topic Relationships · Data Patterns</h2></div><Button icon={<PlusOutlined/>} type="primary" onClick={()=>setModal(true)}>관계 생성</Button></div>
    <Alert showIcon type="info" message="Data Modeling Patterns는 Flow Control 종류가 아닙니다." description="Large Collections는 Metadata / Element Topic 쌍을, Generalization / Specialization은 타입 관계와 서로 다른 Topic의 동기화 메타데이터를 다룹니다. Topic 관계도와 UML Type Diagram을 함께 확인하세요."/>
    <div className="data-pattern-graph" aria-label="Topic relationship diagram"><ReactFlow nodes={graph.nodes} edges={graph.edges} onNodeDoubleClick={(_,node)=>select({kind:'topic',id:node.id})} nodesDraggable={false} nodesConnectable={false} fitView proOptions={{hideAttribution:true}}><Background gap={18} color="#dce6f2"/><Controls showInteractive={false}/></ReactFlow></div>
    <Table rowKey="id" size="small" pagination={false} dataSource={rels} columns={[
      {title:'Data Pattern',render:(_,r)=><Tag color={isLargeCollection(r)?'blue':'purple'}>{TOPIC_RELATION_KINDS.find(k=>k.value===r.kind)?.label??r.kind}</Tag>},
      {title:'Metadata / Generalization Topic',render:(_,r)=><Button size="small" type="link" onClick={()=>select({kind:'topic',id:r.parentTopicId})}>{topics.find(t=>t.id===r.parentTopicId)?.name??'Missing'}</Button>},
      {title:'Element / Specialization Topic',render:(_,r)=><Button size="small" type="link" onClick={()=>select({kind:'topic',id:r.relatedTopicId})}>{topics.find(t=>t.id===r.relatedTopicId)?.name??'Missing'}</Button>},
      {title:'',render:(_,r)=>r.source==='custom'?<Button danger size="small" onClick={()=>remove(r.id)}>삭제</Button>:<Tag>ICD example</Tag>}
    ]}/>
    <Space direction="vertical" style={{marginTop:12}}><Text type="secondary">Large Collections: setID/listID, Timestamp, Element 순서 QoS(PRESENTATION), 메타데이터 동기화가 필요합니다.</Text><Text type="secondary">Generalization / Specialization: specializationTopic, specializationID, specializationTimestamp가 타입과 Topic 사이에서 일치해야 합니다.</Text></Space>
    <Modal title="사용자 정의 Topic 관계" open={modal} okText="관계 생성" onCancel={()=>setModal(false)} destroyOnClose onOk={async()=>{try{const v=await form.validateFields();if(!add(v.kind,v.parentTopicId,v.relatedTopicId)){message.error('같은 Topic, 표준 Topic 또는 중복 관계는 편집할 수 없습니다.');return;}setModal(false);form.resetFields();message.success('Topic 관계를 생성했습니다.');}catch{}}}>
      <Alert type="warning" showIcon message="공식 UMAA Topic은 편집하지 않습니다." description="Custom Topic 간 관계를 프로젝트 모델에 기록합니다. 실제 Metadata/Element 타입 생성 및 DDS 동기화 코드는 별도로 필요합니다." style={{marginBottom:12}}/>
      <Form layout="vertical" form={form} initialValues={{kind:'large-list-element'}}><Form.Item name="kind" label="ICD Data Pattern" rules={[{required:true}]}><Select options={TOPIC_RELATION_KINDS}/></Form.Item><Form.Item name="parentTopicId" label="Metadata / Generalization Topic" rules={[{required:true}]}><Select showSearch optionFilterProp="label" options={topics.filter(t=>s.messages.find(m=>m.id===t.messageTypeId)?.source==='custom').map(t=>({label:t.name,value:t.id}))}/></Form.Item><Form.Item name="relatedTopicId" label="Element / Specialization Topic" rules={[{required:true}]}><Select showSearch optionFilterProp="label" options={topics.filter(t=>s.messages.find(m=>m.id===t.messageTypeId)?.source==='custom').map(t=>({label:t.name,value:t.id}))}/></Form.Item></Form>
    </Modal>
  </div>;
}
