import { useMemo, useState } from 'react';
import { Alert, Button, Divider, Space, Table, Tag, Typography } from 'antd';
import { useEditorStore } from '../stores/useEditorStore.js';
import { deriveEndpoints } from '../logic/endpoints.js';

/**
 * Reads only the canonical mock snapshot: no duplicate hard-coded UI catalog.
 * The service/operation/topic/type names come from the 6.0 ICD seed.
 */
export function AutopilotContract() {
  const snapshot = useEditorStore(x => x.snapshot);
  const select = useEditorStore(x => x.select);
  const [expanded, setExpanded] = useState([]);
  const rows = useMemo(() => {
    if (!snapshot) return [];
    const endPoints = deriveEndpoints(snapshot, 'autopilot');
    return snapshot.bindings.filter(b => b.componentId === 'autopilot').map(binding => {
      const service = snapshot.services.find(v => v.id === binding.serviceId);
      const interfaces = snapshot.interfaces.filter(v => v.serviceId === service?.id);
      const operations = snapshot.operations.filter(v => v.serviceId === service?.id);
      const topics = [...new Set(operations.map(o => snapshot.topics.find(t => t.id === o.topicId)?.name).filter(Boolean))];
      const endpoints = endPoints.filter(e => e.bindingId === binding.id);
      return {
        id: binding.id, service, role: binding.role, interfaces, operations, topics,
        endpoints, writerCount: endpoints.filter(e => e.direction === 'writer').length,
        readerCount: endpoints.filter(e => e.direction === 'reader').length,
      };
    });
  }, [snapshot]);
  if (!snapshot) return null;

  const renderedOp = row => {
    const operationData = row.operations.map(op => {
      const t = snapshot.topics.find(v => v.id === op.topicId);
      return {
        ...op,
        topicName: t?.name ?? '-',
        messageType: snapshot.messages.find(v => v.id === t?.messageTypeId)?.name ?? '-',
        runtimeAction: op.action === 'subscribe' ? 'DDS DataReader / subscription'
          : op.action === 'dispose' ? 'DDS keyed instance dispose'
          : `${op.actor === row.role ? 'DataWriter' : 'DataReader'} (runtime)`
      };
    });
    const related = snapshot.topicRelations.filter(r => row.operations.some(op => op.topicId === r.parentTopicId));
    return <div className="autopilot-expanded">
      <Typography.Text type="secondary">InterfaceBlock 투영: {row.interfaces.map(i => i.name).join(', ')}</Typography.Text>
      <Table size="small" pagination={false} rowKey="id" scroll={{ x: 820 }} dataSource={operationData} columns={[
        { title: 'Operation', dataIndex: 'name', width: 245 },
        { title: 'Actor', dataIndex: 'actor', width: 90 },
        { title: 'DDS action', dataIndex: 'action', width: 100, render: x => <Tag>{x}</Tag> },
        { title: 'Topic', dataIndex: 'topicName', width: 260 },
        { title: 'IDL Data Type', dataIndex: 'messageType', width: 260 },
      ]} />
      {related.map(r => <Alert key={r.id} type="info" style={{ margin: '6px 0' }}
        message={`${r.kind}: ${snapshot.topics.find(t => t.id === r.parentTopicId)?.name} → ${snapshot.topics.find(t => t.id === r.relatedTopicId)?.name}`}
        description={r.description} />)}
    </div>;
  };

  return <div className="contract-panel">
    <Space wrap style={{ marginBottom: 8 }}>
      <Tag color="blue">UMAA Component Definitions v1.0 §3.1.3</Tag>
      <Tag>Autopilot: {rows.length} Service Bindings</Tag>
      <Tag color="geekblue">Provider {rows.filter(r => r.role === 'provider').length}</Tag>
      <Tag color="orange">Consumer {rows.filter(r => r.role === 'consumer').length}</Tag>
      <Button size="small" onClick={() => setExpanded(rows.map(r => r.id))}>모두 펼치기</Button>
      <Button size="small" onClick={() => setExpanded([])}>접기</Button>
      <Button size="small" onClick={() => select({kind:'component',id:'autopilot'})}>Autopilot 속성</Button>
    </Space>
    <Table rowKey="id" size="small" pagination={false} dataSource={rows}
      scroll={{ x: 850 }} expandable={{ expandedRowKeys: expanded,
        onExpandedRowsChange: keys => setExpanded([...keys]), expandedRowRender: renderedOp }}
      columns={[
        {title: 'Functional Area', width: 115, render: (_, row) => <Tag>{row.service?.functionalArea}</Tag>},
        {title: 'Service', width: 230, render: (_, row) => <Button size="small" type="link" onClick={() => select({kind:'service',id:row.service.id})}>{row.service?.name}</Button>},
        {title: 'Role', dataIndex: 'role', width: 100, render: x => <Tag color={x==='provider'?'blue':'orange'}>{x}</Tag>},
        {title: 'Flow Control', width: 150, render: (_, row) => row.service?.flowControl},
        {title: 'Interface', width: 110, render: (_, row) => row.interfaces.length},
        {title: 'Operations', width: 100, render: (_, row) => row.operations.length},
        {title: 'Topics', width: 80, render: (_, row) => row.topics.length},
        {title: 'Endpoints', width: 130, render: (_, row) => `${row.writerCount} W / ${row.readerCount} R`},
      ]} />
    <Divider style={{margin:'10px 0'}}/>
    <Alert type="warning" showIcon message="표준 ICD 메시지 필드 및 실제 DDS 전송은 아직 연결 전입니다."
      description="여기에는 14개 Service의 Operation/Topic/IDL 타입 참조가 모두 입력되어 있습니다. 실제 IDL 파일과 TypeSupport 생성기, DDS SDK를 연결해야 통신하는 DLL/SO가 됩니다. InterfaceBlock 항목은 공식 모델 고유 ID가 아닌 도구의 탐색 투영입니다." />
  </div>;
}
