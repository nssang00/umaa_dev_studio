import { useEffect, useRef } from 'react';
import { Alert, Button, Checkbox, Descriptions, Form, Input, Popconfirm, Select, Space, Tag, Typography } from 'antd';
import { PlusOutlined, UndoOutlined } from '@ant-design/icons';
import { effectiveTypeFields } from '../model/mockIdlCatalog.js';
const { Text } = Typography;
const identifier = /^[A-Za-z_][A-Za-z0-9_]*$/;

const initialFields = type => (type.fields ?? []).map(field => ({
  ...field, _originalName: field.name, key: !!field.key, optional: !!field.optional,
}));
const blankField = () => ({ name: '', type: 'double', key: false, optional: false });

/** Entire Struct draft is local to this editor; onApply commits one validated model transaction. */
export function StructPropertiesEditor({
  snapshot, type, requestAdd = false, selectedFieldName, onApply, onRestore,
}) {
  const [form] = Form.useForm();
  const lastAddRequest = useRef(false);
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

  useEffect(() => {
    if (requestAdd && !lastAddRequest.current) {
      const fields = form.getFieldValue('fields') ?? initialFields(type);
      form.setFieldsValue({ fields: [...fields, blankField()] });
    }
    lastAddRequest.current = requestAdd;
  }, [requestAdd, form, type]);

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
    <Alert style={{margin:'12px 0'}} type="info" showIcon message="Struct 단위로 편집하고 한 번에 저장합니다."
      description="선언 필드 전체와 Struct 이름·부모 타입을 한 트랜잭션으로 적용합니다. 상속 필드는 부모 Struct에서 수정합니다."/>
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
        {(fields, {add, remove}) => <>
          <div className="struct-property-list">
            {fields.length === 0 && <Text type="secondary">선언된 필드가 없습니다.</Text>}
            {fields.map((field, index) => <div className="struct-property-row" key={field.key}>
              <div className="struct-property-row-head">
                <Text strong>#{index + 1}</Text>
                <Button type="text" danger size="small" onClick={() => remove(field.name)}>제거</Button>
              </div>
              <Form.Item name={[field.name, '_originalName']} hidden><Input/></Form.Item>
              <div className="struct-property-field-grid">
                <Form.Item name={[field.name, 'name']} label="Field Name"
                  rules={[{required:true}, {pattern:identifier,message:'IDL 식별자 형식이어야 합니다.'}]}>
                  <Input size="small" placeholder="fieldName"/>
                </Form.Item>
                <Form.Item name={[field.name, 'type']} label="IDL Type" rules={[{required:true}]}>
                  <Input size="small" placeholder="double / MyType"/>
                </Form.Item>
              </div>
              <Space size={16}>
                <Form.Item name={[field.name,'key']} valuePropName="checked" noStyle><Checkbox>@key</Checkbox></Form.Item>
                <Form.Item name={[field.name,'optional']} valuePropName="checked" noStyle><Checkbox>@optional</Checkbox></Form.Item>
              </Space>
            </div>)}
          </div>
          <Button type="dashed" block icon={<PlusOutlined/>} style={{marginTop:9}} onClick={() => add(blankField())}>
            필드 추가
          </Button>
        </>}
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
