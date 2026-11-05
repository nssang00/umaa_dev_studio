import { Empty, List, Tag, Typography, Input } from 'antd';
import { useMemo, useState } from 'react';
import { useEditorStore } from '../stores/useEditorStore.js';
export function ServiceCatalog() {
    const snapshot = useEditorStore(s => s.snapshot);
    const select = useEditorStore(s => s.select);
    const [filter, setFilter] = useState('');
    const services = useMemo(() => (snapshot?.services ?? []).filter(s => `${s.name} ${s.functionalArea}`.toLowerCase().includes(filter.toLowerCase())), [snapshot, filter]);
    if (!snapshot)
        return <Empty />;
    return <div className="sidebar-section">
    <Typography.Text type="secondary" className="side-label">SERVICE CATALOG</Typography.Text>
    <Input.Search placeholder="Service 검색" allowClear value={filter} onChange={e => setFilter(e.target.value)} style={{ margin: '10px 0' }}/>
    <List size="small" dataSource={services} renderItem={service => <List.Item className="clickable-row draggable-catalog" draggable onDragStart={e=>{ e.dataTransfer.setData('application/umaa-service-id',service.id);e.dataTransfer.effectAllowed='copy'; }} onClick={() => select({ kind: 'service', id: service.id })}>
      <div className="catalog-entry"><strong>{service.name}</strong><small className="drag-hint">드래그 → Component</small><div><Tag color={service.source === 'standard' ? 'blue' : 'purple'}>{service.source === 'standard' ? 'UMAA' : 'Custom'}</Tag><Tag>{service.functionalArea}</Tag></div></div>
    </List.Item>}/>
  </div>;
}
