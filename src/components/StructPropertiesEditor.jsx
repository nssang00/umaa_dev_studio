import { useEffect } from 'react';
import { Alert, Button, Checkbox, Descriptions, Form, Input, Popconfirm, Select, Space, Tag, Typography } from 'antd';
import { UndoOutlined } from '@ant-design/icons';
import { StructFieldAccordionList } from './StructFieldAccordionList.jsx';
import { effectiveTypeFields } from '../model/mockIdlCatalog.js';
const { Text } = Typography;
const identifier = /^[A-Za-z_][A-Za-z0-9_]*$/;

const initialFields = type => (type.fields ?? []).map(field => ({
  ...field, _originalName: field.name, key: !!field.key, optional: !!field.optional,
  description: field.description ?? '', defaultValue: field.defaultValue ?? '',
}));
/** Entire Struct draft is local to this editor; onApply commits one validated model transaction. */
export function StructPropertiesEditor({
  snapshot, type, requestAdd = false, selectedFieldName, onApply, onRestore,
}) {
  const [form] = Form.useForm();
  const candidates = [...snapshot.messages, ...snapshot.dataTypes]
    .filter(item => item.id !== type.id && item.kind !== 'enum');
  const inheritedCount = effectiveTypeFields(snapshot, type).filter(field => field.inherited).length;

  useEffect(() => {
    form.setFieldsValue({
      name: type.name,
      baseType: type.baseType ?? null,
      fields: initialFields(type),
    });
  }, [form, type.id, type.name, type.baseType, type.fields]);


  const resetDraft = () => {
    form.setFieldsValue({ name: type.name, baseType: type.baseType ?? null, fields: initialFields(type) });
  };
  async function saveAll() {
    let values;
    try { values = await form.validateFields(); } catch { return; }
    if (values.fields?.some(field => field.key && field.optional)) {
      form.setFields([{ name: ['fields'], errors: ['@key와 @optional은 동시에 사용할 수 없습니다.'] }]);
      return;
    }
    await onApply({ name: values.name, baseType: values.baseType || null, fields: values.fields ?? [] });
  }
  return <div className="inspector context-properties type-properties">
    <Text type="secondary" className="side-label">STRUCT PROPERTIES · ALL DECLARED FIELDS</Text>
    <h3>{type.name}</h3>
    <Space wrap size={4}>
      <Tag color={type.source==='custom'?'purple':type.projectOverride?'gold':'blue'}>
        {type.source==='custom'?'CUSTOM':type.projectOverride?'ICD MOCK · OVERRIDDEN':'ICD MOCK · PROJECT OVERRIDE AVAILABLE'}
      </Tag>
      <Tag>Struct</Tag>
    </Space>
    <Descriptions bordered column={1} size="small" style={{marginTop:12}}>
      <Descriptions.Item label="Namespace">{type.namespace}</Descriptions.Item>
      <Descriptions.Item label="Declared">{type.fields?.length ?? 0}</Descriptions.Item>
      <Descriptions.Item label="Inherited">{inheritedCount}</Descriptions.Item>
      {type.reference && <Descriptions.Item label="ICD Reference">{type.reference}</Descriptions.Item>}
    </Descriptions>
    <Alert style={{margin:'12px 0'}} type="info" showIcon message="Struct의 필드를 펼쳐 수정한 뒤 전체 저장합니다."
      description="각 필드를 펼치면 상세 속성과 설계 메타데이터를 입력할 수 있습니다. 모든 변경은 전체 저장 시 함께 적용하며, 상속 필드는 부모 Struct에서 수정합니다."/>
    <Form form={form} layout="vertical" size="small">
      <Form.Item label="Struct Name" name="name"
        rules={[{ required:true }, {pattern:identifier, message:'IDL 이름만 입력할 수 있습니다.'}]}>
        <Input size="small"/>
      </Form.Item>
      <Form.Item label="Parent Struct (UML Generalization)" name="baseType">
        <Select showSearch allowClear size="small" placeholder="No inheritance"
          options={[
            ...(type.baseType && !candidates.some(t=>t.namespace+'::'+t.name===type.baseType)
              ? [{value:type.baseType,label:type.baseType+' · External Mock'}] : []),
            ...candidates.map(item=>({value:item.namespace+'::'+item.name,label:item.namespace+'::'+item.name})),
          ]}/>
      </Form.Item>
      <div className="struct-property-section-head">
        <Text strong>Declared Fields (전체)</Text>
        {selectedFieldName && <Text type="secondary">선택: {selectedFieldName}</Text>}
      </div>
      <Form.List name="fields">
        {(fields, {add, remove}) => <StructFieldAccordionList
          form={form} fields={fields} add={add} remove={remove}
          requestAdd={requestAdd} selectedFieldName={selectedFieldName}/>}
      </Form.List>
      <Space style={{marginTop:16}}>
        <Button type="primary" size="small" onClick={saveAll}>Struct 전체 저장</Button>
        <Button size="small" onClick={resetDraft}>변경 취소</Button>
      </Space>
    </Form>
    {type.source!=='custom' && <div style={{marginTop:12}}>
      <Text type="secondary" className="small-hint">ICD 기반 Mock은 공식 IDL을 변경하지 않고 프로젝트 Override로 저장합니다.</Text>
      {type.projectOverride && <Popconfirm
        title="프로젝트 변경을 취소하고 최초 ICD Mock으로 복원할까요?"
        onConfirm={onRestore}>
        <Button size="small" icon={<UndoOutlined/>} style={{marginTop:5}}>Mock 원본으로 복원</Button>
      </Popconfirm>}
    </div>}
  </div>;
}
