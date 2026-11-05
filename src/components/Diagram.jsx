import { useMemo, useCallback, useEffect, useRef, useState } from 'react';
import { ReactFlow, Background, Controls, MiniMap, MarkerType } from '@xyflow/react';
import { message, Modal, Select, Typography } from 'antd';
import { canConnect } from '../logic/validation.js';
import { useEditorStore } from '../stores/useEditorStore.js';
import { ComponentNode } from './ComponentNode.jsx';
import '@xyflow/react/dist/style.css';
const nodeTypes = { component: ComponentNode };
export function Diagram() {
    const snapshot = useEditorStore(s => s.snapshot);
    const selection = useEditorStore(s => s.selection);
    const highlightedComponentId = useEditorStore(s => s.highlightedComponentId);
    const highlightComponent = useEditorStore(s => s.highlightComponent);
    const layoutRevision = useEditorStore(s => s.layoutRevision);
    const flowRef = useRef(null);
    const select = useEditorStore(s => s.select);
    const moveComponent = useEditorStore(s => s.moveComponent);
    const connect = useEditorStore(s => s.connect);
    const removeConnection = useEditorStore(s => s.removeConnection);
    const addBinding = useEditorStore(s => s.addBinding);
    const [dropped, setDropped] = useState(null);
    const [bindingRole, setBindingRole] = useState('consumer');
    const nodes = useMemo(() => !snapshot ? [] : snapshot.components.map((component, i) => ({
        id: component.id,
        type: 'component',
        position: snapshot.positions[component.id] ?? { x: i * 320, y: 120 },
        selected: (selection?.kind === 'component' && selection.id === component.id) || highlightedComponentId === component.id,
        data: {
            title: component.name,
            description: component.description,
            ports: snapshot.bindings.filter(b => b.componentId === component.id).map(b => ({
                id: b.id, role: b.role,
                name: snapshot.services.find(s => s.id === b.serviceId)?.name ?? 'Unknown',
                origin: snapshot.services.find(s => s.id === b.serviceId)?.source ?? 'custom',
            })),
        },
    })), [snapshot, selection, highlightedComponentId]);
    const edges = useMemo(() => !snapshot ? [] : snapshot.connections.flatMap(c => {
        const from = snapshot.bindings.find(b => b.id === c.providerBindingId);
        const to = snapshot.bindings.find(b => b.id === c.consumerBindingId);
        if (!from || !to)
            return [];
        const service = snapshot.services.find(s => s.id === from.serviceId);
        return [{
                id: c.id, source: from.componentId, target: to.componentId,
                sourceHandle: from.id, targetHandle: to.id, type: 'smoothstep',
                label: service?.name ?? 'Unknown',
                markerEnd: { type: MarkerType.ArrowClosed, color: '#4384d3' },
                style: { stroke: '#4384d3', strokeWidth: 2 },
                labelStyle: { fontSize: 11, fill: '#466487', fontWeight: 600 },
                selected: selection?.kind === 'connection' && selection.id === c.id,
            }];
    }), [snapshot, selection]);
    const onNodesChange = useCallback((changes) => {
        // Controlled React Flow nodes must receive updates throughout the drag.
        for (const change of changes) {
            if (change.type === 'position' && change.position) {
                moveComponent(change.id, change.position);
            }
        }
    }, [moveComponent]);
    useEffect(() => {
        // The layout button updates stored node coordinates; fit the new graph in the canvas.
        const frame = requestAnimationFrame(() => {
            void flowRef.current?.fitView({ padding: 0.18, duration: 300 });
        });
        return () => cancelAnimationFrame(frame);
    }, [layoutRevision]);
    const onEdgesChange = useCallback((changes) => {
        for (const change of changes)
            if (change.type === 'remove')
                removeConnection(change.id);
    }, [removeConnection]);
    const isValidConnection = useCallback((c) => Boolean(snapshot && c.sourceHandle && c.targetHandle && canConnect(snapshot, c.sourceHandle, c.targetHandle)), [snapshot]);
    const onConnect = useCallback((c) => {
        if (!c.sourceHandle || !c.targetHandle || !connect(c.sourceHandle, c.targetHandle)) {
            message.warning('같은 Service의 Provider 포트에서 Consumer 포트로만 연결할 수 있습니다.');
        }
        else
            message.success('Service Connection을 추가했습니다.');
    }, [connect]);
    const onDrop = useCallback(e => {
        e.preventDefault();
        const sid = e.dataTransfer.getData('application/umaa-service-id');
        if(!sid || !snapshot?.services.some(s=>s.id===sid) || !flowRef.current) return;
        const xy = flowRef.current.screenToFlowPosition({ x:e.clientX,y:e.clientY });
        const target = flowRef.current.getNodes().find(node=>{
          const w=node.measured?.width??266;
          const h=node.measured?.height??(52+33*(snapshot.bindings.filter(b=>b.componentId===node.id).length||1));
          return xy.x>=node.position.x && xy.x<=node.position.x+w && xy.y>=node.position.y && xy.y<=node.position.y+h;
        });
        if(!target){message.info('Service를 Component 노드 위로 드롭하세요.');return;}
        setBindingRole('consumer');setDropped({serviceId:sid,componentId:target.id});
    },[snapshot]);
    const onDragOver = e => { if(e.dataTransfer.types.includes('application/umaa-service-id')){e.preventDefault();e.dataTransfer.dropEffect='copy';} };
    return <div className="diagram" onDrop={onDrop} onDragOver={onDragOver}>
    <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} onInit={instance => { flowRef.current = instance; }} onNodesChange={onNodesChange} onEdgesChange={onEdgesChange} onConnect={onConnect} isValidConnection={isValidConnection} onNodeClick={(_, node) => highlightComponent(node.id)} onNodeDoubleClick={(_, node) => select({kind:'component',id:node.id})} onEdgeClick={(_, edge) => select({ kind: 'connection', id: edge.id })} onPaneClick={() => highlightComponent(null)} deleteKeyCode={['Backspace', 'Delete']} connectionLineStyle={{ stroke: '#4384d3', strokeWidth: 2 }} fitView fitViewOptions={{ padding: 0.18 }} minZoom={0.3} maxZoom={1.8}>
      <Background color="#dce8f2" gap={20} size={1}/>
      <Controls showInteractive={false}/>
      <MiniMap pannable zoomable style={{ background: '#f3f6fa' }} nodeStrokeWidth={2}/>
    </ReactFlow>
    <Modal title="Service Binding 생성" open={!!dropped} okText="Binding 추가" onCancel={()=>setDropped(null)} onOk={()=>{
      if(dropped && addBinding(dropped.componentId,dropped.serviceId,bindingRole)) message.success('Service Binding이 추가되었습니다.');
      else message.warning('Binding이 이미 존재하거나 유효하지 않습니다.');
      setDropped(null);
    }}>
      <Typography.Paragraph>Service: <b>{snapshot?.services.find(x=>x.id===dropped?.serviceId)?.name}</b></Typography.Paragraph>
      <Typography.Paragraph>Component: <b>{snapshot?.components.find(x=>x.id===dropped?.componentId)?.name}</b></Typography.Paragraph>
      <Select style={{width:'100%'}} value={bindingRole} onChange={setBindingRole} options={[{label:'Provider — Service 구현',value:'provider'},{label:'Consumer — Service 사용',value:'consumer'}]}/>
      <Typography.Paragraph type="secondary" style={{fontSize:12,marginTop:12}}>통신 패턴과 Topic/Type은 Service Contract에서 상속됩니다. 여기서는 Provider/Consumer 역할만 선택합니다.</Typography.Paragraph>
    </Modal>
  </div>;
}
