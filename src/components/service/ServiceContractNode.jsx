import { Handle, Position } from '@xyflow/react';
import { Tag, Tooltip } from 'antd';
import { categoryLabel, flowLabel } from '../../model/icdConcepts.js';

/** Contract/flow-specific node. Each "interface" card projects an Operation. */
export function ServiceContractNode({ data, selected }) {
  const handle = (type, position) =>
    <Handle type={type} position={position} className="contract-relationship-handle" isConnectable={false}/>;
  if (data.kind === 'contractLane') return <div className={'service-contract-node lane ' + data.direction}>
    {handle('target', Position.Top)}
    <strong>{data.title}</strong><span>{data.count} Operation interfaces</span>
    {handle('source', Position.Bottom)}
  </div>;
  if (data.kind === 'flowActor') {
    const side = data.role === 'consumer' ? Position.Right : Position.Left;
    return <div className="service-contract-node flow-actor-node">
      <Handle id="flow-in" type="target" position={side} className="contract-relationship-handle" isConnectable={false}/>
      <strong>{data.title}</strong>
      <Handle id="flow-out" type="source" position={side} className="contract-relationship-handle" isConnectable={false}/>
      <Handle id="operations" type="source" position={Position.Bottom} className="contract-relationship-handle" isConnectable={false}/>
    </div>;
  }
  if (data.kind === 'flowPattern') {
    const reverse = data.flowType === 'report';
    return <div className="service-contract-node flow-pattern-node">
      <Handle id="in" type="target" position={reverse ? Position.Right : Position.Left} className="contract-relationship-handle" isConnectable={false}/>
      <strong>{data.title}</strong><small>{data.detail}</small>
      <Handle id="out" type="source" position={reverse ? Position.Left : Position.Right} className="contract-relationship-handle" isConnectable={false}/>
    </div>;
  }
  if (data.kind === 'serviceContract') return <div className={'service-contract-node service-root' + (selected ? ' is-selected' : '')}>
    {handle('target', Position.Top)}
    <div className="service-contract-eyebrow">{data.area} · SERVICE CONTRACT</div>
    <strong title={data.title}>{data.title}</strong>
    <div className="service-contract-chips">
      <Tag color={data.source === 'custom' ? 'purple' : 'blue'}>{data.source === 'custom' ? 'CUSTOM' : 'STANDARD · READ ONLY'}</Tag>
      <Tag>{categoryLabel({ name: data.title, serviceCategory: data.category })}</Tag>
      <Tag>{flowLabel(data.flowControl)}</Tag>
    </div>
    <small title={data.namespace}>{data.namespace}</small>
    <div className="service-contract-summary">{data.counts.input} INPUT · {data.counts.output} OUTPUT · {data.counts.unclassified} review</div>
    {handle('source', Position.Bottom)}
  </div>;
  return <div className={'service-contract-node interface-card' + (selected ? ' is-selected' : '')}>
    {handle('target', Position.Top)}
    <div className="service-contract-card-meta">
      <span>{data.direction?.toUpperCase() ?? 'UNCLASSIFIED'} · OPERATION</span>
      {data.optional && <Tag>Optional</Tag>}
    </div>
    <Tooltip title={data.title}><strong>{data.title}</strong></Tooltip>
    <div className="service-contract-card-chips">
      <Tag color={data.actor === 'provider' ? 'blue' : 'orange'}>{data.actor}</Tag>
      <Tag>{(data.action ?? 'unspecified').toUpperCase()}</Tag>
    </div>
    <small title={data.topicName ?? ''}>
      {data.action === 'dispose' ? 'Existing keyed instance · Dispose' :
       data.action === 'subscribe' ? 'Subscribe to referenced Topic' :
       data.topicName ? 'Topic ref: ' + data.topicName : 'No Topic reference'}
    </small>
    {data.typeName && <small>Data Type: {data.typeName}</small>}
    {handle('source', Position.Bottom)}
  </div>;
}
