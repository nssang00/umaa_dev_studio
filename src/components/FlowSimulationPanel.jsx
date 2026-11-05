import { useMemo, useState } from 'react';
import { Alert, Button, Select, Space, Tag, Typography } from 'antd';
import { PlayCircleOutlined } from '@ant-design/icons';
import { simulateConnectionFlow } from '../logic/mockRuntime.js';
import { useEditorStore } from '../stores/useEditorStore.js';
export function FlowSimulationPanel() {
    const snapshot = useEditorStore(x => x.snapshot);
    const [connectionId, setConnectionId] = useState();
    const [events, setEvents] = useState([]);
    const options = useMemo(() => (snapshot?.connections ?? []).map(c => {
        const p = snapshot?.bindings.find(b => b.id === c.providerBindingId);
        const u = snapshot?.bindings.find(b => b.id === c.consumerBindingId);
        const svc = snapshot?.services.find(v => v.id === p?.serviceId);
        const a = snapshot?.components.find(v => v.id === p?.componentId)?.name;
        const b = snapshot?.components.find(v => v.id === u?.componentId)?.name;
        return { label: `${svc?.name}: ${a} → ${b}`, value: c.id };
    }), [snapshot]);
    const selected = connectionId && options.some(x => x.value === connectionId) ? connectionId : options[0]?.value;
    return <div>
    <Space wrap style={{ marginBottom: 8 }}>
      <Select style={{ minWidth: 390 }} placeholder="Service Connection 선택" options={options} value={selected} onChange={v => { setConnectionId(v); setEvents([]); }}/>
      <Button type="primary" size="small" icon={<PlayCircleOutlined />} disabled={!selected || !snapshot} onClick={() => {
            if (snapshot && selected)
                setEvents(simulateConnectionFlow(snapshot, selected));
        }}>Mock 흐름 재생</Button>
    </Space>
    <Alert type="info" showIcon message="실제 DDS 통신이 아닌 Operation/Binding 기반의 개념적 시퀀스입니다." style={{ marginBottom: 6, padding: '6px 10px' }}/>
    <div className="simulation-events">
      {events.map(e => <div key={e.step} className="simulation-event"><Tag>{e.step}</Tag><Typography.Text strong>{e.actor}</Typography.Text><Tag color="blue">{e.action}</Tag><Typography.Text type="secondary">{e.detail}</Typography.Text></div>)}
    </div>
  </div>;
}
