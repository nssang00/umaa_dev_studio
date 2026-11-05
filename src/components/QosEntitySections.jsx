import { Collapse, Tag } from 'antd';
import { QOS_SECTION_CATALOG } from '../model/qosPolicies.js';
import { QosPolicyAccordion } from './QosPolicyAccordion.jsx';

/** One profile owns all six collapsible QoS entity sections. */
export function QosEntitySections({ profile, onChange }) {
  return <Collapse className="qos-entity-accordion nodrag nopan" size="small"
    defaultActiveKey={['topic_qos']}
    items={QOS_SECTION_CATALOG.map(section => ({
      key: section.key,
      label: <span className="qos-entity-title">{section.key}
        <Tag color="blue">{section.policies.length} policies</Tag></span>,
      children: <QosPolicyAccordion section={section} values={profile[section.key]} onChange={onChange}/>,
    }))}/>;
}
