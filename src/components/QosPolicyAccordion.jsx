import { Collapse, Tag } from 'antd';
import { QosPolicyFieldControl } from './QosPolicyFieldControl.jsx';

/** Nested accordion. Policy values are scoped to the owning QoS entity. */
export function QosPolicyAccordion({ section, values, onChange }) {
  return <Collapse size="small" ghost className="qos-policy-accordion"
    items={section.policies.map(policy => ({
      key: policy.key,
      label: <span className="qos-policy-title">{policy.label} <Tag>{policy.key}</Tag></span>,
      children: <div className="qos-policy-controls">
        {policy.fields.map(field => <QosPolicyFieldControl key={field.key} field={field}
          value={values?.[policy.key]?.[field.key]}
          onChange={value => onChange(section.key, policy.key, field.key, value)}/>)}
      </div>,
    }))}/>;
}
