import { Handle, Position } from '@xyflow/react';
import { Tag, Tooltip } from 'antd';
export function ComponentNode({ data, selected }) {
  const providers=data.ports.filter(p=>p.role==='provider').length;
  const consumers=data.ports.filter(p=>p.role==='consumer').length;
  return <div className={'component-node' + (selected ? ' selected' : '')}>
    <div className="component-node-title">
      <div className="component-node-label">COMPONENT · P {providers} / C {consumers}</div>
      <Tooltip title={data.description}><strong>{data.title}</strong></Tooltip>
    </div>
    <div className="component-node-ports">
      {data.ports.length === 0 && <div className="empty-node-ports">아직 Service Binding이 없습니다.</div>}
      {data.ports.map((p,index)=><Tooltip key={p.id}
        title={(p.origin==='standard'?'UMAA Standard':'Custom')+' / '+p.role+' · '+p.name}>
        <div className="component-node-port">
          {p.role==='consumer'&&<Handle type="target" position={Position.Left} id={p.id}
            className="binding-handle" style={{top:64+index*33,left:-7}}/>}
          <span className="port-text">{p.name}</span>
          <Tag color={p.role==='provider'?'blue':'orange'}
            style={{fontSize:10,lineHeight:'16px',marginRight:0}}>{p.role==='provider'?'P':'C'}</Tag>
          {p.role==='provider'&&<Handle type="source" position={Position.Right} id={p.id}
            className="binding-handle" style={{top:64+index*33,right:-7}}/>}
        </div>
      </Tooltip>)}
    </div>
    <div className="component-node-summary">
      <span>{data.connectionCount ?? 0} logical links</span>
      <span>{data.endpointCount ?? 0} derived DDS endpoints</span>
    </div>
  </div>;
}
