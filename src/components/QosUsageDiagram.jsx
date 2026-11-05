import { useMemo } from 'react';
import { Alert, Tag, Typography } from 'antd';
import { ReactFlow, Background, Controls } from '@xyflow/react';
import { useEditorStore } from '../stores/useEditorStore.js';
const {Text}=Typography;
/** QoS profile use and inheritance are model projections, NOT actual DDS entity matching. */
export function QosUsageDiagram({profileId}){
  const s=useEditorStore(x=>x.snapshot);
  const graph=useMemo(()=>{
    const profile=s?.qosProfiles.find(p=>p.id===profileId);
    if(!profile)return {nodes:[],edges:[]};
    const uses=s.components.filter(c=>s.componentRuntime?.[c.id]?.qosProfileId===profileId);
    const base=s.qosProfiles.find(p=>p.id===profile.baseProfileId);
    const nodes=[
      ...(base?[{id:base.id,position:{x:0,y:24},data:{label:`Base: ${base.name}`}}]:[]),
      {id:profile.id,position:{x:base?260:0,y:24},data:{label:`QoS Profile: ${profile.name}`}},
      ...uses.map((c,i)=>({id:c.id,position:{x:base?540:280,y:i*90+16},data:{label:`Component: ${c.name}`}}))
    ].map(n=>({...n,draggable:false,selectable:false}));
    const edges=[...(base?[{id:'base-link',source:base.id,target:profile.id,label:'base_name'}]:[]),...uses.map(c=>({id:`used:${c.id}`,source:profile.id,target:c.id,label:'applied by'}))];
    return {nodes,edges};
  },[s,profileId]);
  return <div><div className="data-pattern-graph" style={{height:280}}><ReactFlow nodes={graph.nodes} edges={graph.edges} fitView nodesDraggable={false} nodesConnectable={false} proOptions={{hideAttribution:true}}><Background gap={18}/><Controls showInteractive={false}/></ReactFlow></div>
    <Alert type="info" showIcon message="QoS 참조 관계도" description="Component에서 선택한 QoS Profile과 Base 참조 관계만 보여줍니다. DDS-JSON XML/JSON 전 범위, Reader/Writer 정책 상속·호환성 검사 또는 벤더 적용은 현재 구현 범위가 아닙니다."/>
  </div>;
}
