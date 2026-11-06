import { useMemo, useState } from 'react';
import { Alert, Button, Checkbox, Form, Input, Modal, Select, Space, Tag, Typography, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { ModelGraphCanvas } from '../shared/graph/ModelGraphCanvas.jsx';
import { useEditorStore } from '../../stores/useEditorStore.js';
import { typeDependencyGraph } from '../../logic/editorGraphs.js';
import { StudioGraphNode } from '../shared/graph/StudioGraphNode.jsx';
const nodeTypes={studio:StudioGraphNode};
const primitives=['boolean','short','long','unsigned long','long long','float','double','string','char','octet'];
export function TypeGraph({kind,id}) {
  const snapshot=useEditorStore(s=>s.snapshot);
  const select=useEditorStore(s=>s.select);
  const addMessage=useEditorStore(s=>s.addMessageField);
  const updateMessage=useEditorStore(s=>s.updateMessageField);
  const removeMessage=useEditorStore(s=>s.removeMessageField);
  const addData=useEditorStore(s=>s.addDataTypeField);
  const updateData=useEditorStore(s=>s.updateDataTypeField);
  const removeData=useEditorStore(s=>s.removeDataTypeField);
  const [form]=Form.useForm();
  const [dialog,setDialog]=useState(null);
  const [focus,setFocus]=useState(null);
  const type=kind==='message'?snapshot?.messages.find(m=>m.id===id):snapshot?.dataTypes.find(t=>t.id===id);
  const editable=type?.source==='custom' && type.kind!=='enum';
  const graph=useMemo(()=>snapshot?typeDependencyGraph(snapshot,kind,id):{nodes:[],edges:[]},[snapshot,kind,id]);
  const available=useMemo(()=>snapshot?[...snapshot.dataTypes,...snapshot.messages].filter(t=>t.id!==id && t.name!=='').slice(0,7):[],[snapshot,id]);
  const nodes=useMemo(()=>[...graph.nodes,...(editable?available.filter(t=>!graph.nodes.some(n=>n.id===`dependent:${t.id}`)).map((t,i)=>({id:`candidate:${t.id}`,kind:'type',title:t.name,detail:'Reference candidate · drag from root',position:{x:610,y:Math.max(65,graph.nodes.length*72)+i*82}})):[])].map(n=>({id:n.id,type:'studio',position:n.position,draggable:false,selected:n.id===focus,data:n})),[graph,editable,available,focus]);
  const edges=graph.edges.map(e=>({...e,type:'smoothstep',style:{stroke:'#9aacc4',strokeWidth:1.8}}));
  const open=(row=null,targetType=null)=>{
    setDialog({oldName:row?.name??null});
    form.setFieldsValue({name:row?.name??'',type:targetType??row?.type??'double',key:Boolean(row?.key),optional:Boolean(row?.optional)});
  };
  const save=async()=>{
    try{const v=await form.validateFields();if(v.key&&v.optional){message.error('@key와 @optional은 동시에 사용할 수 없습니다.');return;}
      const patch={name:v.name,type:v.type,key:!!v.key,optional:!!v.optional};
      const ok=dialog.oldName ? (kind==='message'?updateMessage(id,dialog.oldName,patch):updateData(id,dialog.oldName,patch)):(kind==='message'?addMessage(id,v.name,v.type,patch):addData(id,v.name,v.type,patch));
      if(ok){setDialog(null);message.success('Type 모델에 반영했습니다.');}else message.error('필드 식별자·Type을 확인하세요.');
    }catch{}
  };
  const onConnect=c=>{
    if(!editable||c.source!==`root:${id}`||!c.target?.startsWith('candidate:')){message.warning('Custom Struct/MessageType에서 타입 참조만 추가할 수 있습니다.');return;}
    const target=available.find(t=>t.id===c.target.slice(10));
    if(target)open(null,`${target.namespace}::${target.name}`);
  };
  const onNodeClick=(_,n)=>setFocus(n.id);
  const onNodeDoubleClick=(_,n)=>{
    if(n.id.startsWith('field:')){const f=type.fields?.find(f=>f.name===n.id.slice(6));if(editable&&f)open(f);}
    else if(n.id.startsWith('dependent:')||n.id.startsWith('candidate:')){
      const id=n.id.split(':')[1];const category=snapshot.messages.some(t=>t.id===id)?'message':'dataType';select({kind:category,id});
    }
  };
  if(!type)return null;
  return <div className="graph-editor">
    <div className="graph-toolbar"><Space wrap><Tag color={editable?'purple':'blue'}>{editable?'CUSTOM · EDITABLE':'ICD MOCK · READ ONLY'}</Tag><Typography.Text type="secondary">필드 → 참조 타입을 추적합니다.</Typography.Text></Space>
      {editable&&<Button size="small" icon={<PlusOutlined/>} type="primary" onClick={()=>open()}>Field 추가</Button>}
    </div>
    <div className="graph-explanation">Custom Type: 루트에서 참조 후보 타입으로 드래그하면 필드를 생성합니다. 필드 노드를 더블클릭하면 수정할 수 있습니다.</div>
    <div className="type-graph-canvas">
      <ModelGraphCanvas graphKey={id} nodes={nodes} edges={edges} nodeTypes={nodeTypes}
        nodesDraggable={false} nodesConnectable={editable}
        onConnect={onConnect} onNodeClick={onNodeClick} onNodeDoubleClick={onNodeDoubleClick}
        fitView minZoom={.25} maxZoom={1.8}/>
    </div>
    {focus?.startsWith('field:')&&editable&&<div className="graph-selected-bar"><Typography.Text>Field: {focus.slice(6)}</Typography.Text><Space><Button size="small" onClick={()=>{const f=type.fields.find(x=>x.name===focus.slice(6));if(f)open(f);}}>수정</Button><Button size="small" danger onClick={()=>Modal.confirm({title:'Field 삭제',onOk:()=>{(kind==='message'?removeMessage:removeData)(id,focus.slice(6));setFocus(null);}})}>삭제</Button></Space></div>}
    {!editable&&<Alert type="info" showIcon style={{marginTop:10}} message="ICD 기반 목 타입은 읽기 전용입니다." description="ICD의 속성표에서 도출한 목 필드만 그래프로 표시합니다. 원본 공식 IDL·상속·고급 IDL 정의와 완전히 일치한다고 가정하지 마세요. 상속된 공통 필드는 Fields / IDL 탭에서 확인할 수 있습니다."/>}
    <Modal open={!!dialog} onCancel={()=>setDialog(null)} onOk={save} title={dialog?.oldName?'Type Field 수정':'Type Field 추가'} okText="모델에 반영">
      <Form form={form} layout="vertical"><Form.Item name="name" label="Field Name" rules={[{required:true},{pattern:/^[A-Za-z_][A-Za-z0-9_]*$/}]}><Input/></Form.Item>
        <Form.Item name="type" label="IDL Type" rules={[{required:true}]}><Select showSearch options={[...primitives,...available.map(t=>`${t.namespace}::${t.name}`)].map(v=>({label:v,value:v}))}/></Form.Item>
        <Space><Form.Item name="key" valuePropName="checked"><Checkbox>@key</Checkbox></Form.Item><Form.Item name="optional" valuePropName="checked"><Checkbox>@optional</Checkbox></Form.Item></Space>
      </Form>
    </Modal>
  </div>;
}
