import { useMemo, useState } from 'react';
import { Alert, Button, Divider, Select, Space, Table, Tag, Typography } from 'antd';
import { useEditorStore } from '../stores/useEditorStore.js';
function linkForOperation(s, operation) {
    const topic = s.topics.find(t => t.id === operation.topicId);
    const message = s.messages.find(m => m.id === topic?.messageTypeId);
    return { topic, message };
}
export function ContractMatrix() {
    const s = useEditorStore(x => x.snapshot);
    const select = useEditorStore(x => x.select);
    const [chosen, setChosen] = useState();
    const selectedId = (chosen && s?.services.some(x => x.id === chosen)) ? chosen : s?.services[0]?.id;
    const svc = s?.services.find(x => x.id === selectedId);
    const bindings = useMemo(() => s?.bindings.filter(b => b.serviceId === selectedId) ?? [], [s, selectedId]);
    if (!s || !svc)
        return null;
    const operations = s.operations.filter(o => o.serviceId === svc.id);
    const relationRows = s.topicRelations.filter(r => operations.some(o => o.topicId === r.parentTopicId));
    return <div className="contract-panel">
    <Space wrap>
      <Select showSearch optionFilterProp="label" style={{ minWidth: 320 }} value={svc.id} onChange={setChosen} options={s.services.map(x => ({ value: x.id, label: `${x.functionalArea} / ${x.name}` }))}/>
      <Button size="small" onClick={() => select({ kind: 'service', id: svc.id })}>Service 속성 열기</Button>
      <Tag>{svc.flowControl}</Tag><Tag color="blue">{svc.functionalArea}</Tag>
    </Space>
    <div className="contract-summary">{svc.description} · Provider {bindings.filter(b => b.role === 'provider').length}개 / Consumer {bindings.filter(b => b.role === 'consumer').length}개 / Interface 그룹 {s.interfaces.filter(i => i.serviceId === svc.id).length}개</div>
    <Table size="small" pagination={false} rowKey="id" dataSource={operations} scroll={{ x: 750 }} columns={[
            { title: 'Operation (ICD)', dataIndex: 'name', width: 230, render: (name, op) => <Button size="small" type="link" onClick={() => select({ kind: 'operation', id: op.id })}>{name}</Button> },
            { title: 'DDS Action', dataIndex: 'action', width: 105, render: (x) => <Tag color={x === 'publish' ? 'blue' : x === 'dispose' ? 'volcano' : 'cyan'}>{x}</Tag> },
            { title: 'Actor', dataIndex: 'actor', width: 92 },
            { title: 'Topic', width: 230, render: (_, op) => { const { topic } = linkForOperation(s, op); return topic?.name ?? '-'; } },
            { title: 'Data Type', width: 235, render: (_, op) => { const { message } = linkForOperation(s, op); return message ? <Button size="small" type="link" onClick={() => select({ kind: 'message', id: message.id })}>{message.name}</Button> : '-'; } },
            { title: '해석', width: 170, render: (_, op) => op.action === 'subscribe' ? 'Reader (요청 Topic 없음)' : op.action === 'dispose' ? 'Writer / instance dispose' : `${op.actor} Writer ↔ 상대 Reader` },
        ]}/>
    {relationRows.length > 0 && <><Divider style={{ margin: '8px 0' }}/>
      <Typography.Text strong>추가 DDS 데이터 관계</Typography.Text>
      {relationRows.map(r => <Alert key={r.id} type="info" showIcon style={{ margin: '7px 0' }} message={`${r.kind}: ${s.topics.find(t => t.id === r.parentTopicId)?.name} → ${s.topics.find(t => t.id === r.relatedTopicId)?.name}`} description={r.description}/>)}
    </>}
    <Alert style={{ marginTop: 12 }} type="warning" message="연결선은 Service 계약 관계이며 DDS의 점대점 통신이 아닙니다. 실제 DDS Endpoint/IDL 코드 생성은 선택한 벤더 SDK 및 공식 UMAA IDL을 연결해야 합니다."/>
  </div>;
}
