import { useEffect, useRef, useState } from 'react';
import { Button, Collapse, Tag, Typography, Form } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { StructFieldEditor } from './StructFieldEditor.jsx';

const blankField = () => ({
  name:'', type:'double', key:false, optional:false, description:'', defaultValue:'',
});

/** Expand/collapse is view state. Field values live in one parent Form.List draft. */
export function StructFieldAccordionList({
  form, fields, add, remove, selectedFieldName, requestAdd,
}) {
  const [openKeys, setOpenKeys] = useState([]);
  const lastAddRequest = useRef(false);
  const expandNext = useRef(false);
  const watched = Form.useWatch('fields', form) ?? [];

  const addExpanded = () => {
    expandNext.current = true;
    add(blankField());
  };
  useEffect(() => {
    if (requestAdd && !lastAddRequest.current) addExpanded();
    lastAddRequest.current = requestAdd;
  }, [requestAdd, add]);
  useEffect(() => {
    if (!expandNext.current || !fields.length) return;
    expandNext.current = false;
    const newKey = String(fields[fields.length - 1].key);
    setOpenKeys(previous => previous.includes(newKey) ? previous : [...previous, newKey]);
  }, [fields.length, fields[fields.length - 1]?.key]);
  useEffect(() => {
    if (!selectedFieldName) return;
    const index = watched.findIndex(field => field?.name === selectedFieldName);
    if (index < 0 || !fields[index]) return;
    const key = String(fields[index].key);
    setOpenKeys(previous => previous.includes(key) ? previous : [...previous, key]);
  }, [selectedFieldName, fields, watched]);

  const removeField = (field) => {
    remove(field.name);
    setOpenKeys(current => current.filter(key => key !== String(field.key)));
  };
  return <>
    <div className="struct-property-list">
      {!fields.length && <Typography.Text type="secondary">선언된 필드가 없습니다.</Typography.Text>}
      <Collapse size="small" className="struct-field-accordion"
        activeKey={openKeys}
        onChange={keys=>setOpenKeys(Array.isArray(keys)?keys.map(String):[String(keys)])}
        items={fields.map((field,index)=>{
          const data = watched[field.name] ?? {};
          const label = data.name || ('New Field ' + (index+1));
          return {
            key: String(field.key),
            forceRender: true,
            label: <span className="struct-field-summary">
              <strong>{label}</strong>
              <code>{data.type || '—'}</code>
              {data.key && <Tag color="blue">key</Tag>}
              {data.optional && <Tag color="purple">optional</Tag>}
            </span>,
            children: <StructFieldEditor index={field.name}
              onRemove={()=>removeField(field)}/>,
          };
        })}/>
    </div>
    <Button type="dashed" block icon={<PlusOutlined/>} style={{marginTop:9}}
      onClick={addExpanded}>필드 추가</Button>
  </>;
}
