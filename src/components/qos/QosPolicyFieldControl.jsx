import { Checkbox, Input, InputNumber, Select } from 'antd';

/** Pure field control: editor passes only a typed value and change callback. */
export function QosPolicyFieldControl({ field, value, onChange }) {
  const common = { size: 'small', className: 'nodrag nowheel nopan' };
  if (field.type === 'boolean') {
    return <Checkbox checked={Boolean(value)} onChange={event => onChange(event.target.checked)}
      className="nodrag nopan">{field.label}</Checkbox>;
  }
  if (field.type === 'select') {
    return <label className="qos-policy-field"><span>{field.label}</span>
      <Select {...common} value={value} options={field.options} onChange={onChange}/></label>;
  }
  if (field.type === 'number') {
    return <label className="qos-policy-field"><span>{field.label}</span>
      <InputNumber {...common} style={{width:'100%'}} min={field.min ?? 0} precision={0}
        value={value} placeholder={field.nullable ? 'Unspecified' : undefined} onChange={onChange}/></label>;
  }
  return <label className="qos-policy-field"><span>{field.label}</span>
    <Input {...common} value={value ?? ''} onChange={event => onChange(event.target.value)}/></label>;
}
