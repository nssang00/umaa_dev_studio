import { useMemo } from 'react';
import { Alert, Tag, Typography } from 'antd';
import { ReactFlow, Background, Controls } from '@xyflow/react';
import { useEditorStore } from '../stores/useEditorStore.js';
import { buildQosEntityGraph, buildQosProfileGraph, QOS_ENTITY_SECTIONS } from '../model/qosDiagram.js';
const { Text, Title } = Typography;

function ReadOnlyQosGraph({ graph, height, title }) {
  const nodes = graph.nodes.map(node => ({
    ...node,
    draggable: false,
    selectable: false,
    style: {
      width: node.data.concept ? 230 : 240,
      padding: '13px 8px',
      border: node.data.concept ? '1px solid #9bb5d3' : '1px solid #bbc8d6',
      borderRadius: 9,
      background: node.data.concept ? '#edf4fc' : '#fff',
      color: '#213b5b',
      fontWeight: 600,
      fontSize: 12,
    },
  }));
  const edges = graph.edges.map(edge => ({
    ...edge,
    type: 'smoothstep',
    style: { stroke: '#849ab4', strokeWidth: 1.5 },
    labelStyle: { fontSize: 10, fill: '#526779' },
  }));
  return <div className="data-pattern-graph" style={{ height }} aria-label={title}>
    <ReactFlow nodes={nodes} edges={edges} fitView fitViewOptions={{padding:0.2}}
      nodesDraggable={false} nodesConnectable={false} elementsSelectable={false}
      proOptions={{hideAttribution:true}}>
      <Background gap={18}/><Controls showInteractive={false}/>
    </ReactFlow>
  </div>;
}

/** Separate semantic DDS topology from real project Profile references. */
export function QosUsageDiagram({profileId}) {
  const snapshot = useEditorStore(state => state.snapshot);
  const topology = useMemo(buildQosEntityGraph, []);
  const references = useMemo(
    () => buildQosProfileGraph(snapshot, profileId),
    [snapshot, profileId],
  );
  return <div className="qos-usage-diagram">
    <Title level={5}>DDS Entity / QoS 적용 대상 개념도</Title>
    <Text type="secondary">DDS 엔터티의 생성·포함 및 Topic 읽기/쓰기 관계입니다. 선은 QoS 정책 상속이나 실제 런타임 연결을 의미하지 않습니다.</Text>
    <ReadOnlyQosGraph graph={topology} height={370} title="Six DDS QoS entity concepts"/>
    <div style={{display:'flex',gap:6,flexWrap:'wrap',margin:'8px 0 18px'}}>
      {QOS_ENTITY_SECTIONS.map(section => <Tag key={section.key}>{section.key}</Tag>)}
    </div>
    <Title level={5}>저장된 QoS Profile 참조 관계</Title>
    <Text type="secondary">Base Profile 참조와 Component Runtime에 저장된 QoS Profile 선택만 표시합니다.</Text>
    <ReadOnlyQosGraph graph={references} height={Math.max(230, 75 + references.uses.length * 88)} title="Stored QoS profile references"/>
    {!references.uses.length && <Text type="secondary">이 Profile을 참조하는 Component가 없습니다.</Text>}
    <Alert style={{marginTop:16}} type="info" showIcon message="개념도와 구현 범위의 구분"
      description="여섯 QoS 엔터티 영역은 구조적 개념입니다. 현재 프로젝트는 프로필의 공통 정책 필드 및 Component 단위 참조만 저장합니다. domain_participant_qos, topic_qos, publisher_qos, subscriber_qos, datawriter_qos, datareader_qos 각각의 정책 데이터 편집, DDS SDK 적용, Requested/Offered 호환성 검사는 아직 지원하지 않습니다."/>
  </div>;
}
