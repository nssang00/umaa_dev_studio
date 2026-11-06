import { useEffect, useMemo, useState } from 'react';
import { Button, Empty, Input, Modal, Select, Space, Tag, Typography, message } from 'antd';
import { CheckCircleOutlined, PlusOutlined } from '@ant-design/icons';
import { useEditorStore } from '../../stores/useEditorStore.js';
const {Text}=Typography;
export function ServiceAddModal({ open, onClose, component, snapshot, initialRole }) {
  const addBinding = useEditorStore(x => x.addBinding);
  const [query, setQuery] = useState('');
  const [area, setArea] = useState('all');
  const [role, setRole] = useState('provider');
  useEffect(()=>{if(open)setRole(initialRole);},[open,initialRole]);
  const existing = useMemo(() => new Set(snapshot.bindings.filter(b => b.componentId === component.id)
    .map(b => `${b.serviceId}:${b.role}`)), [snapshot, component.id]);
  const candidates = useMemo(() => snapshot.services.filter(s => (area === 'all' || s.functionalArea === area) &&
    `${s.name} ${s.description ?? ''}`.toLowerCase().includes(query.toLowerCase())), [snapshot.services, area, query]);
  const attach = service => {
    if (addBinding(component.id, service.id, role, { stayOnComponent: true })) {
      message.success(`${service.name} · ${role === 'provider' ? '제공' : '사용'} 추가됨`);
    } else message.warning('이미 추가한 서비스입니다.');
  };
  return <Modal open={open} onCancel={onClose} footer={<Button onClick={onClose}>완료</Button>} width={680} title={`${component.name} · 서비스 선택`} destroyOnClose>
    <div className="journey-helper">어떤 기능을 제공하거나 사용할지 선택하세요. Operation, Topic, Type 계약은 자동 연결되며 표준 원본은 변경되지 않습니다.</div>
    <div className="service-picker-controls">
      <Select aria-label="서비스 역할" value={role} onChange={setRole} style={{width:155}} options={[
        {value:'provider',label:'제공하는 기능'},{value:'consumer',label:'사용하는 기능'}]}/>
      <Select aria-label="기능 영역" value={area} onChange={setArea} style={{width:190}} options={[{value:'all',label:'모든 기능 영역'},...snapshot.functionalAreas.map(a=>({value:a.id,label:`${a.id} · ${a.name}`}))]}/>
      <Input.Search aria-label="서비스 검색" value={query} onChange={e=>setQuery(e.target.value)} allowClear placeholder="기능 또는 서비스 이름" style={{flex:1,minWidth:150}}/>
    </div>
    <div className="service-picker-list">
      {candidates.map(service => {
        const already = existing.has(`${service.id}:${role}`);
        return <div className="picker-service" key={service.id}>
          <div className="picker-service-info"><Space size={6}><Text strong>{service.name}</Text><Tag>{service.functionalArea}</Tag>{service.source === 'custom' && <Tag color="purple">Custom</Tag>}</Space>
            <Text type="secondary">{service.description || 'UMAA 서비스 계약'}</Text></div>
          <Button size="small" type={already?'default':'primary'} disabled={already} icon={already?<CheckCircleOutlined/>:<PlusOutlined/>} onClick={()=>attach(service)}>{already?'추가됨':'추가'}</Button>
        </div>;
      })}
      {!candidates.length && <Empty description="검색과 일치하는 서비스가 없습니다."/>}
    </div>
  </Modal>;
}

