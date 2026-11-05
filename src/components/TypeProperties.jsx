import { useEffect } from 'react';
import { Button, Checkbox, Collapse, Descriptions, Divider, Form, Input, Popconfirm, Select, Space, Tag, Typography, message } from 'antd';
import { PlusOutlined, UndoOutlined } from '@ant-design/icons';
import { useEditorStore } from '../stores/useEditorStore.js';
import { effectiveTypeFields } from '../model/mockIdlCatalog.js';
const {Text}=Typography;
const identifier=/^[A-Za-z_][A-Za-z0-9_]*$/;

export function TypeProperties({ snapshot, type, kind, selection }) {
  const select=useEditorStore(s=>s.select);
  const applyField=useEditorStore(s=>s.applyTypeFieldEdit);
  const updateType=useEditorStore(s=>s.updateTypeDefinition);
  const restoreType=useEditorStore(s=>s.restoreTypeOverride);
  const [form]=Form.useForm();
  const [metaForm]=Form.useForm();
  const isEnum=type.kind==='enum';
  const fields=isEnum?(type.members??[]).map(name=>({name,type:'enumerator'})):(type.fields??[]);
  const field=fields.find(f=>f.name===selection.fieldName);
  const creating=selection.fieldEditor==='create';
  const editing=creating||Boolean(field);
  const inheritedCount=effectiveTypeFields(snapshot,type).filter(f=>f.inherited).length;
  const candidates=[...snapshot.messages,...snapshot.dataTypes].filter(t=>t.id!==type.id&&t.kind!=='enum');
  useEffect(()=>{
    form.setFieldsValue({name:creating?'':field?.name??'',type:creating?'double':field?.type??'double',key:creating?false:!!field?.key,optional:creating?false:!!field?.optional});
  },[type.id,selection.fieldName,selection.fieldEditor,field?.name,field?.type,field?.key,field?.optional,creating,form]);
  useEffect(()=>metaForm.setFieldsValue({name:type.name,baseType:type.baseType??''}),[type.id,type.name,type.baseType,metaForm]);
  async function saveField(){
    let v;try{v=await form.validateFields();}catch{return;}
    if(v.key&&v.optional){message.error('@key와 @optional을 함께 지정할 수 없습니다.');return;}
    const ok=applyField(kind,type.id,creating?'add':'update',{
      originalName:field?.name,name:v.name,type:isEnum?'enumerator':v.type,key:!!v.key,optional:!!v.optional
    });
    if(!ok){message.error('중복 이름, 부모 필드 충돌 또는 IDL 식별자를 확인하세요.');return;}
    select({kind,id:type.id,fieldName:v.name});message.success(type.source==='custom'?'필드 저장':'프로젝트 Override 저장');
  }
  function removeField(){
    if(!field)return;
    if(!applyField(kind,type.id,'remove',{originalName:field.name})){message.error('마지막 enum 값을 삭제할 수 없습니다.');return;}
    select({kind,id:type.id});
  }
  async function saveType(){
    let v;try{v=await metaForm.validateFields();}catch{return;}
    if(!updateType(kind,type.id,{name:v.name,baseType:v.baseType||null})){message.error('이름 중복, 잘못된 부모 구조체 또는 상속 순환을 확인하세요.');return;}
    message.success('Type Definition 저장');
  }
  return <div className="inspector context-properties type-properties">
    <Text type="secondary" className="side-label">TYPE PROPERTIES</Text><h3>{type.name}</h3>
    <Space wrap size={4}>
      <Tag color={type.source==='custom'?'purple':type.projectOverride?'gold':'blue'}>{type.source==='custom'?'CUSTOM':type.projectOverride?'ICD MOCK · OVERRIDDEN':'ICD MOCK · PROJECT OVERRIDE AVAILABLE'}</Tag>
      <Tag>{isEnum?'Enum':'Struct'}</Tag>
    </Space>
    <Descriptions className="type-properties-meta" bordered column={1} size="small" style={{marginTop:12}}>
      <Descriptions.Item label="Namespace">{type.namespace}</Descriptions.Item>
      <Descriptions.Item label="Declared">{fields.length}</Descriptions.Item>
      {!isEnum&&<Descriptions.Item label="Inherited">{inheritedCount}</Descriptions.Item>}
      {type.reference&&<Descriptions.Item label="ICD Reference">{type.reference}</Descriptions.Item>}
    </Descriptions>
    <Collapse size="small" style={{marginTop:10}} items={[{key:'definition',label:'Type Definition / 상속 설정',children:<Form layout="vertical" size="small" form={metaForm}>
      <Form.Item name="name" label="Struct / Enum Name" rules={[{required:true},{pattern:identifier,message:'IDL 이름만 입력할 수 있습니다.'}]}><Input size="small"/></Form.Item>
      {!isEnum&&<Form.Item name="baseType" label="Parent Struct (UML Generalization)"><Select size="small" showSearch allowClear placeholder="No inheritance" options={[
        ...(type.baseType&&!candidates.some(t=>`${t.namespace}::${t.name}`===type.baseType)?[{value:type.baseType,label:`${type.baseType} · External Mock` }]:[]),
        ...candidates.map(t=>({value:`${t.namespace}::${t.name}`,label:`${t.namespace}::${t.name}`}))
      ]}/></Form.Item>}
      <Button size="small" type="primary" onClick={saveType}>Type 정보 적용</Button>
    </Form>}]}/>
    {type.source!=='custom'&&<div style={{marginTop:10}}><Text type="secondary" className="small-hint">ICD Mock 원본은 유지하고 변경 사항을 프로젝트에 보관합니다.</Text>
      {type.projectOverride&&<Popconfirm title="이 Type의 프로젝트 수정을 취소하고 최초 ICD Mock으로 복원할까요?" onConfirm={()=>{
        if(restoreType(kind,type.id)){select({kind,id:type.id});message.success('ICD Mock 원본으로 복원했습니다.');}
      }}><Button size="small" icon={<UndoOutlined/>} style={{marginTop:5}}>Mock 원본으로 복원</Button></Popconfirm>}
    </div>}
    <Divider style={{margin:'14px 0 10px'}}/>
    <div className="type-field-property-head"><Text strong>{creating?'새 필드':field?`Field · ${field.name}`:'Field Details'}</Text>
      {!creating&&<Button type="text" size="small" icon={<PlusOutlined/>} onClick={()=>select({kind,id:type.id,fieldEditor:'create'})}>{isEnum?'Member':'Field'} 추가</Button>}
    </div>
    {editing?<Form layout="vertical" form={form} className="type-field-edit-form">
      <Form.Item label={isEnum?'Enumerator':'Field Name'} name="name" rules={[{required:true},{pattern:identifier,message:'IDL 이름 형식이어야 합니다.'}]}><Input size="small"/></Form.Item>
      {!isEnum&&<><Form.Item label="IDL Field Type" name="type" rules={[{required:true}]}><Input size="small" placeholder="GeoPosition2D / double / ..."/></Form.Item>
        <Space size={3} direction="vertical"><Form.Item name="key" valuePropName="checked" noStyle><Checkbox>@key</Checkbox></Form.Item><Form.Item name="optional" valuePropName="checked" noStyle><Checkbox>@optional</Checkbox></Form.Item></Space></>}
      <Space style={{marginTop:14}}><Button size="small" type="primary" onClick={saveField}>저장</Button><Button size="small" onClick={()=>select({kind,id:type.id})}>취소</Button>
        {field&&!creating&&<Popconfirm title="이 필드를 삭제할까요?" onConfirm={removeField}><Button size="small" danger>삭제</Button></Popconfirm>}</Space>
    </Form>:<p className="small-hint">UML 구조체의 필드를 선택해 수정하거나, 추가 버튼으로 새 필드를 만들 수 있습니다. 부모 필드는 부모 Struct에서 수정합니다.</p>}
  </div>;
}
