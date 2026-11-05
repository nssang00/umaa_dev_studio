import { Button, Checkbox, Form, Input, Space, Typography } from 'antd';

/** Presentation-only field editor: it writes to the enclosing Struct draft form. */
export function StructFieldEditor({ index, onRemove }) {
  return <div className="struct-field-detail">
    <Form.Item name={[index, '_originalName']} hidden><Input/></Form.Item>
    <div className="struct-property-field-grid">
      <Form.Item label="Field Name" name={[index, 'name']}
        rules={[{required:true},{pattern:/^[A-Za-z_][A-Za-z0-9_]*$/,message:'IDL 이름 형식이어야 합니다.'}]}>
        <Input size="small" placeholder="fieldName"/>
      </Form.Item>
      <Form.Item label="IDL Type" name={[index, 'type']} rules={[{required:true}]}>
        <Input size="small" placeholder="double / MyType"/>
      </Form.Item>
    </div>
    <Space size={16}>
      <Form.Item name={[index,'key']} valuePropName="checked" noStyle>
        <Checkbox>@key</Checkbox>
      </Form.Item>
      <Form.Item name={[index,'optional']} valuePropName="checked" noStyle>
        <Checkbox>@optional</Checkbox>
      </Form.Item>
    </Space>
    <Form.Item label="Description" name={[index, 'description']} style={{marginTop:10,marginBottom:10}}>
      <Input.TextArea autoSize={{minRows:2,maxRows:4}} maxLength={4000}
        placeholder="Field 설명 (설계 메타데이터)"/>
    </Form.Item>
    <Form.Item label="Default value (design text)" name={[index, 'defaultValue']} style={{marginBottom:9}}>
      <Input size="small" maxLength={2048}
        placeholder="선택사항 · DDS IDL 기본값으로 컴파일되지 않음"/>
    </Form.Item>
    <div className="struct-field-commands">
      <Typography.Text type="secondary" className="small-hint">
        변경 내용은 'Struct 전체 저장' 시 검증·반영됩니다.
      </Typography.Text>
      <Button danger size="small" onClick={onRemove}>이 필드 제거</Button>
    </div>
  </div>;
}
