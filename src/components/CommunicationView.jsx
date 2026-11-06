import { useMemo, useState } from 'react';
import { Alert, Button, Descriptions, Empty, Space, Table, Tag, Typography } from 'antd';
import { ArrowLeftOutlined, SwapOutlined } from '@ant-design/icons';
import { ReactFlow, Background, Controls, MarkerType } from '@xyflow/react';
import { useEditorStore } from '../stores/useEditorStore.js';
import { channelGraph } from '../logic/communicationModel.js';
import { RuntimeSettings } from './DesignDetails.jsx';
const { Text } = Typography;
export function CommunicationView({ connectionId, onBack }) {
  const snapshot = useEditorStore(s=>s.snapshot);
  const select = useEditorStore(s=>s.select);
  const [focus,setFocus]=useState(null);
  const graph = useMemo(()=>snapshot ? channelGraph(snapshot,connectionId) : null,[snapshot,connectionId]);
  const con=snapshot?.connections.find(c=>c.id===connectionId);
  const pb=snapshot?.bindings.find(b=>b.id===con?.providerBindingId);
  const service=snapshot?.services.find(s=>s.id===pb?.serviceId);
  const pr=snapshot?.componentRuntime?.[graph?.provider?.id];
  const cr=snapshot?.componentRuntime?.[graph?.consumer?.id];
  if(!graph || !service) return <Empty description="연결을 선택하세요"/>;
  const error=pr && cr && (pr.domainId!==cr.domainId || pr.partition!==cr.partition);
  return <div className="center-workbench">
    <div className="editor-heading"><div><Text type="secondary" className="editor-eyebrow">DDS ENDPOINT TOPOLOGY · LOGICAL CONNECTION</Text><h2><SwapOutlined/> {service.name}</h2><Text type="secondary">{graph.consumer?.name} (Consumer) ↔ {graph.provider?.name} (Provider)</Text></div>
      <Button icon={<ArrowLeftOutlined/>} onClick={onBack}>System Diagram</Button></div>
    <Alert type="info" showIcon message="Service Connection은 DDS Point-to-Point 연결이 아닙니다." description="이 화면은 동일 Service의 P/C 바인딩으로부터 DataWriter / Topic / DataReader 흐름을 파생한 설계 투영입니다. 실제 매칭은 Domain, Partition, Topic 이름·Type 및 QoS 호환성에 따라 결정됩니다."/>
    {error && <Alert style={{marginTop:9}} showIcon type="warning" message="Domain 또는 Partition 설정이 서로 다릅니다." description="이 두 Component의 Runtime 설정을 확인하세요. (다른 정책과 QoS는 미검증)"/>}
    <div className="dds-flow-canvas"><ReactFlow nodes={graph.nodes} edges={graph.edges.map(e=>({...e,markerEnd:{type:MarkerType.ArrowClosed,color:e.style.stroke}}))} fitView fitViewOptions={{padding:.18}} nodesDraggable={false} nodesConnectable={false} elementsSelectable minZoom={.2} onNodeClick={(_,node)=>{
      setFocus(node.id);
      if(node.data?.endpointKey)
        select({kind:'connection',id:connectionId,endpointKey:node.data.endpointKey});
      else if(useEditorStore.getState().selection?.endpointKey)
        select({kind:'connection',id:connectionId});
    }} maxZoom={1.5} proOptions={{hideAttribution:true}}><Background color="#dae4f1" gap={22}/><Controls showInteractive={false}/></ReactFlow></div>
    <div className="dds-focus-panel">
      <Typography.Text strong>선택한 DDS 요소</Typography.Text>
      {focus==='consumer'||focus==='provider'?<>
        <p>{focus==='consumer'?graph.consumer?.name:graph.provider?.name} · {focus==='consumer'?'Consumer':'Provider'} Runtime 설정</p>
        <RuntimeSettings componentId={focus==='consumer'?graph.consumer?.id:graph.provider?.id}/>
      </>:focus?.startsWith('ep:')?<><p>DataWriter / DataReader Endpoint를 선택했습니다.</p>
        <Text type="secondary">오른쪽 Properties에서 Endpoint별 QoS Profile을 지정할 수 있습니다.</Text>
      </>:focus?.startsWith('ch')?<>
        <p>{graph.channels[Number(focus.slice(2))]?.topicName}</p>
        <Space><Button size="small" onClick={()=>{
          const ch=graph.channels[Number(focus.slice(2))];const topic=snapshot.topics.find(t=>t.name===ch?.topicName);if(topic)select({kind:'topic',id:topic.id});
        }}>Topic 계약 열기</Button><Button size="small" onClick={()=>{
          const ch=graph.channels[Number(focus.slice(2))];const m=snapshot.messages.find(m=>m.name===ch?.typeName);if(m)select({kind:'message',id:m.id});
        }}>IDL Type 열기</Button></Space>
      </>:<Text type="secondary">Consumer 또는 Provider를 클릭하면 Component Runtime을, DataWriter/Reader를 클릭하면 오른쪽 Properties에서 QoS를 설정할 수 있습니다.</Text>}
    </div>
    <Space wrap className="editor-info-tags"><Tag color="blue">{service.flowControl}</Tag><Tag>{graph.channels.length} DDS Topics</Tag><Tag>Custom Wrapper / DDS Runtime: 미구현</Tag></Space>
    <Table size="small" rowKey="id" pagination={false} scroll={{x:700}} dataSource={graph.channels} columns={[
      {title:'Writer → Reader',render:(_,r)=><Tag color="blue">{r.writerRole} → {r.readerRole}</Tag>,width:160},
      {title:'Topic',dataIndex:'topicName',width:235,render:(v,r)=><Button type="link" size="small" style={{padding:0}} onClick={()=>{const op=snapshot.operations.find(o=>o.serviceId===pb.serviceId && snapshot.topics.find(t=>t.id===o.topicId)?.name===v);if(op){select({kind:'topic',id:op.topicId});}}}>{v}</Button>},
      {title:'IDL Type',dataIndex:'typeName',width:190},
      {title:'Actions',render:(_,r)=><span>{r.operations.map(o=>`${o.name} (${o.action})`).join(', ')}{r.dataRule?` · ${r.dataRule}`:''}</span>}
    ]}/>
    {service.flowControl==='command-response'&&<Alert showIcon type="warning" message="Command Flow Control은 메시지 연결보다 복잡합니다." description="sessionID, destination GUID, 명령 상태 전이(ISSUED→COMMANDED→EXECUTING), update/cancel/dispose, cleanup 및 재시작 복구는 실제 Adapter에서 구현해야 합니다."/>}
    <div className="editor-note">이 화면은 설계 시각화입니다. 생성 DLL/SO는 현재 통신 미구현 골격입니다.</div>
  </div>;
}
