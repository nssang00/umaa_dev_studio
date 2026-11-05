import { useMemo, useState } from 'react';
import { ReactFlow, Background, Controls, MarkerType } from '@xyflow/react';
import { Alert, Button, Input, Modal, Select, Space, Typography, message } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useEditorStore } from '../stores/useEditorStore.js';
import { StudioGraphNode } from './GraphNodes.jsx';
const nodeTypes={studio:StudioGraphNode};
const blockOptions=['Service Input','Validation','Decision','Command Arbitration','User Handler','Status Output','Error Handler'];
export const makeInitialBehavior=()=>({nodes:[
  {id:'input',kind:'action',label:'Service Input',x:20,y:95},
  {id:'validate',kind:'action',label:'Validation',x:300,y:95},
  {id:'handler',kind:'action',label:'User Handler',x:580,y:95},
  {id:'status',kind:'action',label:'Status Output',x:860,y:95}
],edges:[{id:'e-input-validate',source:'input',target:'validate'},{id:'e-validate-handler',source:'validate',target:'handler'},{id:'e-handler-status',source:'handler',target:'status'}]});
export function BehaviorGraph({componentId}) {
  const snapshot=useEditorStore(s=>s.snapshot);
  const save=useEditorStore(s=>s.setBehaviorDiagram);
  const diagram=snapshot?.behaviorDiagrams?.[componentId]??makeInitialBehavior();
  const [selected,setSelected]=useState(null);
  const [modal,setModal]=useState(null);
  const [label,setLabel]=useState('');
  const [kind,setKind]=useState('User Handler');
  const nodes=useMemo(()=>diagram.nodes.map(n=>({id:n.id,type:'studio',position:{x:n.x,y:n.y},data:{kind:n.kind,title:n.label,detail:n.kind==='action'?'Project behavior draft':'Custom block'}})),[diagram]);
  const edges=useMemo(()=>diagram.edges.map(e=>({...e,type:'smoothstep',markerEnd:{type:MarkerType.ArrowClosed},style:{stroke:'#617da1',strokeWidth:2}})),[diagram]);
  const commit=d=>save(componentId,d);
  const addNode=()=>{
    if(!label.trim())return;
    const id='step-'+Math.random().toString(36).slice(2);
    commit({...diagram,nodes:[...diagram.nodes,{id,kind:'action',label:label.trim(),x:160+diagram.nodes.length*55,y:230+(diagram.nodes.length%3)*85}]});setModal(null);setLabel('');
  };
  const remove=()=>{
    if(!selected)return;
    if(selected.startsWith('edge:')){const id=selected.slice(5);commit({...diagram,edges:diagram.edges.filter(e=>e.id!==id)});}
    else{commit({nodes:diagram.nodes.filter(n=>n.id!==selected),edges:diagram.edges.filter(e=>e.source!==selected&&e.target!==selected)});}
    setSelected(null);
  };
  const onNodesChange=changes=>{const moves=changes.filter(c=>c.type==='position'&&c.position);if(!moves.length)return;
    commit({...diagram,nodes:diagram.nodes.map(n=>{const c=moves.find(c=>c.id===n.id);return c?{...n,x:c.position.x,y:c.position.y}:n;})});
  };
  const onConnect=c=>{if(!c.source||!c.target||c.source===c.target)return; if(diagram.edges.some(e=>e.source===c.source&&e.target===c.target))return;
    commit({...diagram,edges:[...diagram.edges,{id:'e-'+Math.random().toString(36).slice(2),source:c.source,target:c.target}]});
  };
  const rename=()=>{const n=diagram.nodes.find(n=>n.id===selected);if(!n)return;setLabel(n.label);setModal('rename');};
  return <div className="graph-editor">
    <div className="graph-toolbar"><Typography.Text strong>Component Behavior · 설계 초안</Typography.Text><Space><Button size="small" icon={<PlusOutlined/>} onClick={()=>{setLabel('');setModal('add');}}>Block 추가</Button><Button size="small" onClick={rename} disabled={!selected||selected.startsWith('edge:')}>이름 변경</Button><Button size="small" danger disabled={!selected} onClick={remove}>선택 삭제</Button></Space></div>
    <div className="graph-explanation">노드 이동·블록 연결·추가·삭제 결과가 프로젝트 JSON에 저장됩니다. UMAA 표준 Command State Machine을 변경하는 편집기가 아닙니다.</div>
    <div className="behavior-graph-canvas"><ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onNodesChange={onNodesChange} onConnect={onConnect} onNodeClick={(_,n)=>setSelected(n.id)} onEdgeClick={(_,e)=>setSelected('edge:'+e.id)} onNodeDoubleClick={(_,n)=>{setSelected(n.id);setLabel(diagram.nodes.find(x=>x.id===n.id)?.label??'');setModal('rename');}} fitView proOptions={{hideAttribution:true}} minZoom={.35} maxZoom={1.8}><Background gap={20} color="#dce6f2"/><Controls showInteractive={false}/></ReactFlow></div>
    <Alert type="warning" style={{marginTop:10}} showIcon message="Behavior Graph는 현재 설계 기록용입니다." description="실제 C++ 로직 생성·실행은 미구현입니다. 명령 상태 전이는 UMAA ICD 규칙을 따르며, User Handler와 중재 정책은 별도로 구현해야 합니다."/>
    <Modal open={!!modal} onCancel={()=>setModal(null)} onOk={()=>{
      if(modal==='add')addNode();else if(modal==='rename'&&label.trim()){
        commit({...diagram,nodes:diagram.nodes.map(n=>n.id===selected?{...n,label:label.trim()}:n)});setModal(null);
      }}} title={modal==='add'?'Behavior Block 추가':'Block 이름 변경'} okText="적용">
      {modal==='add'&&<Select style={{width:'100%',marginBottom:12}} value={kind} onChange={v=>{setKind(v);setLabel(v);}} options={blockOptions.map(v=>({label:v,value:v}))}/>}
      <Input value={label} onChange={e=>setLabel(e.target.value)} placeholder="Block Label"/>
    </Modal>
  </div>;
}
