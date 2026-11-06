import { useMemo, useState } from 'react';
import { Button, Descriptions, Divider, Empty, Form, Input, Modal, Select, Space, Table, Tag, Typography, message } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useEditorStore } from '../stores/useEditorStore.js';
import { deriveEndpoints } from '../logic/endpoints.js';
import { RuntimeSettings, ConnectionProtocol, QosEditor, CustomTypeEditor, CustomServiceEditor } from './DesignDetails.jsx';
const { Text, Title } = Typography;
export function Inspector() {
    const s = useEditorStore(x => x.snapshot);
    const selection = useEditorStore(x => x.selection);
    const select = useEditorStore(x => x.select);
    const addBinding = useEditorStore(x => x.addBinding);
    const removeBinding = useEditorStore(x => x.removeBinding);
    const removeConnection = useEditorStore(x => x.removeConnection);
    const addField = useEditorStore(x => x.addMessageField);
    const removeField = useEditorStore(x => x.removeMessageField);
    const [bindingModal, setBindingModal] = useState(false);
    const [fieldModal, setFieldModal] = useState(false);
    const [bindingForm] = Form.useForm();
    const [fieldForm] = Form.useForm();
    const entity = useMemo(() => {
        if (!s || !selection)
            return null;
        if (selection.kind === 'functionalArea')
            return s.functionalAreas.find(v => v.id === selection.id);
        if (selection.kind === 'interface')
            return s.interfaces.find(v => v.id === selection.id);
        if (selection.kind === 'operation')
            return s.operations.find(v => v.id === selection.id);
        if (selection.kind === 'topic')
            return s.topics.find(v => v.id === selection.id);
        if (selection.kind === 'component')
            return s.components.find(v => v.id === selection.id);
        if (selection.kind === 'service')
            return s.services.find(v => v.id === selection.id);
        if (selection.kind === 'binding')
            return s.bindings.find(v => v.id === selection.id);
        if (selection.kind === 'connection')
            return s.connections.find(v => v.id === selection.id);
        if (selection.kind === 'message')
            return s.messages.find(v => v.id === selection.id);
        return null;
    }, [s, selection]);
    if (!s || !selection || !entity)
        return <div className="inspector"><Empty description="Component 또는 Service를 선택하세요" image={Empty.PRESENTED_IMAGE_SIMPLE}/></div>;
    const area = selection.kind === 'functionalArea' ? s.functionalAreas.find(a => a.id === selection.id) : undefined;
    const iface = selection.kind === 'interface' ? s.interfaces.find(i => i.id === selection.id) : undefined;
    const operation = selection.kind === 'operation' ? s.operations.find(o => o.id === selection.id) : undefined;
    const selectedTopic = selection.kind === 'topic' ? s.topics.find(t => t.id === selection.id) : undefined;
    const binding = selection.kind === 'binding' ? s.bindings.find(b => b.id === selection.id) : undefined;
    const component = selection.kind === 'component' ? s.components.find(c => c.id === selection.id) : undefined;
    const service = selection.kind === 'service' ? s.services.find(v => v.id === selection.id) : undefined;
    const msg = selection.kind === 'message' ? s.messages.find(m => m.id === selection.id) : undefined;
    const connection = selection.kind === 'connection' ? s.connections.find(c => c.id === selection.id) : undefined;
    return <div className="inspector">
    <Text type="secondary" className="side-label">CONTRACT / COMPONENT PROPERTIES</Text>
    {selection.kind === 'qos' && <QosEditor profileId={selection.id}/>}
    {selection.kind === 'dataType' && <CustomTypeEditor typeId={selection.id}/>}
    {area && <>
      <Title level={5}>{area.id} · {area.name}</Title>
      <Descriptions size="small" bordered column={1}><Descriptions.Item label="ICD">{area.icd}</Descriptions.Item>
        <Descriptions.Item label="예제 Service 수">{s.services.filter(v => v.functionalArea === area.id).length}</Descriptions.Item></Descriptions>
      <Divider orientation="left">Services</Divider>
      {s.services.filter(v => v.functionalArea === area.id).map(v => <div className="inspector-binding clickable-row" key={v.id} onClick={() => select({ kind: 'service', id: v.id })}>{v.name}<Tag>{v.flowControl}</Tag></div>)}
      <Text type="secondary" className="small-hint">전체 공식 Service 목록이 아니라 확인된 예제만 포함합니다.</Text>
    </>}
    {iface && <>
      <Title level={5}>{iface.name}</Title>
      <Text type="secondary">{iface.description}</Text>
      <p><Button size="small" onClick={() => select({ kind: 'service', id: iface.serviceId })}>상위 Service 열기</Button></p>
      <Divider orientation="left">Operations</Divider>
      {iface.operationIds.map(id => s.operations.find(o => o.id === id)).filter(o => o !== undefined).map(o => <div key={o.id} className="inspector-binding clickable-row" onClick={() => select({ kind: 'operation', id: o.id })}>{o.name}<Tag>{o.action}</Tag></div>)}
    </>}
    {operation && (() => {
            const topic = s.topics.find(t => t.id === operation.topicId);
            const msg = s.messages.find(m => m.id === topic?.messageTypeId);
            return <>
        <Title level={5}>{operation.name}</Title>
        <Descriptions size="small" bordered column={1}>
          <Descriptions.Item label="ICD Service">{s.services.find(v => v.id === operation.serviceId)?.name}</Descriptions.Item>
          <Descriptions.Item label="Actor">{operation.actor}</Descriptions.Item>
          <Descriptions.Item label="DDS action">{operation.action}</Descriptions.Item>
          <Descriptions.Item label="Topic">{topic?.name}</Descriptions.Item>
          <Descriptions.Item label="Data Type">{msg?.name}</Descriptions.Item>
          <Descriptions.Item label="Consumer 필수 여부">{operation.optionalConsumer ? '선택적 구독' : '역할에 따라 필수'}</Descriptions.Item>
        </Descriptions>
        <p><Button size="small" onClick={() => topic && select({ kind: 'topic', id: topic.id })}>Topic 열기</Button></p>
        <Text type="secondary" className="small-hint">subscribe는 보통 Query 메시지를 발행하지 않으며, dispose는 명령 취소를 위한 DDS 동작입니다.</Text>
      </>;
        })()}
    {selectedTopic && (() => {
            const m = s.messages.find(v => v.id === selectedTopic.messageTypeId);
            const refs = s.topicRelations.filter(r => r.parentTopicId === selectedTopic.id || r.relatedTopicId === selectedTopic.id);
            return <><Title level={5}>{selectedTopic.name}</Title>
        <Descriptions size="small" bordered column={1}>
          <Descriptions.Item label="Data Type">{m?.name}</Descriptions.Item>
          <Descriptions.Item label="Namespace">{m?.namespace}</Descriptions.Item>
          <Descriptions.Item label="IDL Source">{m?.source === 'standard' ? '공식 UMAA 6.0 IDL (외부 의존성)' : 'Custom generated IDL'}</Descriptions.Item>
        </Descriptions>
        <p><Button size="small" onClick={() => m && select({ kind: 'message', id: m.id })}>IDL Message 열기</Button></p>
        {refs.map(r => <p className="small-hint" key={r.id}>{r.kind}: {r.description}</p>)}
      </>;
        })()}
    {component && <>
      <Title level={5}>{component.name}</Title>
      <Text type="secondary">{component.description || 'Component의 구현 단위입니다.'}</Text>
      <Divider orientation="left">Service Bindings</Divider>
      <Space direction="vertical" style={{ width: '100%' }} size="small">
        {s.bindings.filter(b => b.componentId === component.id).map(b => {
                const svc = s.services.find(x => x.id === b.serviceId);
                return <div key={b.id} className="inspector-binding clickable-row" onClick={() => select({ kind: 'binding', id: b.id })}>
            <span>{svc?.name ?? 'Unknown'}</span><Tag color={b.role === 'provider' ? 'blue' : 'orange'}>{b.role === 'provider' ? 'Provider' : 'Consumer'}</Tag>
          </div>;
            })}
        <Button block icon={<PlusOutlined />} onClick={() => { bindingForm.resetFields(); setBindingModal(true); }}>Service Binding 추가</Button>
      </Space>
      <Divider orientation="left">Auto DDS Mapping</Divider>
      <Text type="secondary" className="small-hint">{deriveEndpoints(s, component.id).length}개 DataWriter/DataReader 설계 Endpoint가 Service Binding에서 자동 도출됩니다.</Text>
      <Button size="small" block onClick={()=>select({kind:'ddsConfig',id:'project',componentId:component.id})}>고급 DDS Configuration 열기</Button>
    </>}

    {service && <>
      <Title level={5}>{service.name}</Title>
      <Space wrap><Tag color={service.source === 'standard' ? 'blue' : 'purple'}>{service.source === 'standard' ? 'UMAA Standard' : 'Custom'}</Tag><Tag>{service.functionalArea}</Tag><Tag>{service.flowControl}</Tag></Space>
      <p className="property-description">{service.description}</p>
      <Descriptions column={1} size="small" bordered>
        <Descriptions.Item label="Namespace"><Text code copyable>{service.namespace}</Text></Descriptions.Item>
        <Descriptions.Item label="Version">{service.version}</Descriptions.Item>
        <Descriptions.Item label="규격 출처">{s.functionalAreas.find(f => f.id === service.functionalArea)?.icd ?? 'Project Custom'}</Descriptions.Item>
      </Descriptions>
      <Divider orientation="left">Service Interfaces (도구 그룹)</Divider>
      {s.interfaces.filter(i => i.serviceId === service.id).map(i => <div className="inspector-binding clickable-row" key={i.id} onClick={() => select({ kind: 'interface', id: i.id })}>{i.name}<Tag>{i.operationIds.length} ops</Tag></div>)}
      <Divider orientation="left">Operations</Divider>
      <Table size="small" pagination={false} dataSource={s.operations.filter(op => op.serviceId === service.id)} rowKey="id" columns={[
                { title: 'Operation', dataIndex: 'name', ellipsis: true },
                { title: 'Action', dataIndex: 'action', width: 88 },
                { title: 'Role', dataIndex: 'actor', width: 90 },
            ]} expandable={{ expandedRowRender: op => {
                    const topic = s.topics.find(t => t.id === op.topicId);
                    const m = s.messages.find(t => t.id === topic?.messageTypeId);
                    return <div><Text>Topic: {topic?.name ?? 'N/A'}</Text><br /><Text>Message: </Text>{m ? <Button type="link" size="small" onClick={() => select({ kind: 'message', id: m.id })}>{m.name}</Button> : 'N/A'}</div>;
                } }}/>
      <Divider orientation="left">Messages</Divider>
      {s.messages.filter(m => s.topics.some(t => t.messageTypeId === m.id && s.operations.some(op => op.topicId === t.id && op.serviceId === service.id))).map(m => <div className="inspector-binding clickable-row" key={m.id} onClick={() => select({ kind: 'message', id: m.id })}>{m.name}<Tag>{m.source === 'standard' ? 'Official IDL' : 'Custom IDL'}</Tag></div>)}
      {s.topicRelations.filter(r => s.operations.some(o => o.serviceId === service.id && o.topicId === r.parentTopicId)).map(r => <div key={r.id}>
        <Divider orientation="left">Data Rule: {r.kind}</Divider>
        <Text className="small-hint">{s.topics.find(t => t.id === r.parentTopicId)?.name} → {s.topics.find(t => t.id === r.relatedTopicId)?.name}</Text>
        <Text className="small-hint">{r.description}</Text>
      </div>)}
      {service.source === 'custom' && <CustomServiceEditor service={service}/>}
      {service.source === 'standard' && <Text type="secondary" className="small-hint">표준 정의는 읽기 전용입니다. 이 샘플은 일부 Operation/Topic만 포함하며, 원본 IDL 필드는 생성하지 않습니다.</Text>}
    </>}

    {binding && <>
      <Title level={5}>Service Binding</Title>
      <Descriptions size="small" bordered column={1}>
        <Descriptions.Item label="Component">{s.components.find(c => c.id === binding.componentId)?.name}</Descriptions.Item>
        <Descriptions.Item label="Service">{s.services.find(svc => svc.id === binding.serviceId)?.name}</Descriptions.Item>
        <Descriptions.Item label="Role"><Tag color={binding.role === 'provider' ? 'blue' : 'orange'}>{binding.role}</Tag></Descriptions.Item>
      </Descriptions>
      <p className="small-hint">React Flow에서 Provider Handle을 같은 Service의 Consumer Handle로 드래그해 연결합니다.</p>
      <Button danger icon={<DeleteOutlined />} block onClick={() => removeBinding(binding.id)}>Binding 제거</Button>
    </>}

    {connection && <>
      <Title level={5}>Service Connection</Title>
      <Descriptions size="small" bordered column={1}>
        <Descriptions.Item label="Provider">{s.components.find(c => c.id === s.bindings.find(b => b.id === connection.providerBindingId)?.componentId)?.name}</Descriptions.Item>
        <Descriptions.Item label="Consumer">{s.components.find(c => c.id === s.bindings.find(b => b.id === connection.consumerBindingId)?.componentId)?.name}</Descriptions.Item>
        <Descriptions.Item label="Service">{s.services.find(svc => svc.id === s.bindings.find(b => b.id === connection.providerBindingId)?.serviceId)?.name}</Descriptions.Item>
      </Descriptions>
      <p className="small-hint">이 Edge는 설계상의 서비스 사용 관계이며 DDS의 Point-to-Point 채널이 아닙니다.</p>
      <ConnectionProtocol connection={connection}/>
      <Button danger icon={<DeleteOutlined />} block onClick={() => removeConnection(connection.id)}>Connection 제거</Button>
    </>}

    {msg && <>
      <Title level={5}>{msg.name}</Title>
      <Space wrap><Tag color={msg.source === 'standard' ? 'blue' : 'purple'}>{msg.source === 'standard' ? 'Official UMAA IDL' : 'Custom IDL'}</Tag></Space>
      <p><Text code copyable>{msg.namespace}</Text></p>
      {msg.source === 'standard' ? <>
        <Text type="secondary">표준 필드 목록을 임의로 재구성하지 않았습니다. 실제 프로젝트에서는 공식 UMAA 6.0 IDL에서 필드·Key·Optional을 읽어와 표시해야 합니다.</Text>
        <p><Text code>{msg.externalIdlPath}</Text></p>
      </> : <>
        <Table rowKey="name" size="small" pagination={false} dataSource={msg.fields} columns={[
                    { title: 'Field', dataIndex: 'name' }, { title: 'Type', dataIndex: 'type', width: 80 },
                    { title: '', width: 32, render: (_, r) => <Button type="text" danger size="small" icon={<DeleteOutlined />} onClick={() => removeField(msg.id, r.name)}/> },
                ]}/>
        <Button block icon={<PlusOutlined />} onClick={() => { fieldForm.resetFields(); setFieldModal(true); }}>Field 추가</Button>
      </>}
    </>}

    <Modal title="Service Binding 추가" open={bindingModal} okText="추가" onCancel={() => setBindingModal(false)} onOk={async () => {
            try {
                const v = await bindingForm.validateFields();
                if (component && addBinding(component.id, v.serviceId, v.role)) {
                    setBindingModal(false);
                    message.success('Binding을 추가했습니다.');
                }
                else
                    message.warning('중복되었거나 잘못된 Binding입니다.');
            }
            catch { /* AntD form indicates validation errors */ }
        }} destroyOnClose>
      <Form form={bindingForm} layout="vertical" initialValues={{ role: 'consumer' }}>
        <Form.Item label="Service" name="serviceId" rules={[{ required: true, message: 'Service를 선택하세요' }]}>
          <Select showSearch optionFilterProp="label" options={s.services.map(v => ({ label: `${v.name} (${v.source})`, value: v.id }))}/>
        </Form.Item>
        <Form.Item label="Role" name="role" rules={[{ required: true }]}>
          <Select options={[{ label: 'Provider', value: 'provider' }, { label: 'Consumer', value: 'consumer' }]}/>
        </Form.Item>
      </Form>
    </Modal>
    <Modal title="Custom Message Field 추가" open={fieldModal} okText="추가" onCancel={() => setFieldModal(false)} onOk={async () => {
            try {
                const v = await fieldForm.validateFields();
                if (msg && addField(msg.id, v.name, v.type)) {
                    setFieldModal(false);
                    message.success('Field가 추가되었습니다.');
                }
                else
                    message.warning('필드명 중복 또는 식별자 오류');
            }
            catch { /* AntD form handles field errors */ }
        }} destroyOnClose>
      <Form form={fieldForm} layout="vertical" initialValues={{ type: 'double' }}>
        <Form.Item label="Field Name" name="name" rules={[{ required: true }, { pattern: /^[A-Za-z_][A-Za-z0-9_]*$/, message: 'IDL 식별자를 사용하세요' }]}><Input /></Form.Item>
        <Form.Item label="Data Type" name="type"><Select showSearch options={['string','long','double','boolean','float','unsigned long',...(s.dataTypes??[]).map(t=>`${t.namespace}::${t.name}`)].map(t=>({label:t,value:t}))}/></Form.Item>
      </Form>
    </Modal>
  </div>;
}
