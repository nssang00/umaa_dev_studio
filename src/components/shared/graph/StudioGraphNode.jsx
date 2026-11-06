import { Handle, Position } from '@xyflow/react';
const colors={service:'#506a90',operation:'#3267ad',action:'#a46735',topic:'#267e7c',type:'#6a56a2',root:'#506a90',field:'#3267ad',dependent:'#6a56a2'};
export function StudioGraphNode({data,selected}){
  const color=colors[data.kind]??colors.type;
  return <div className={`studio-graph-node ${selected?'is-selected':''}`} style={{'--node-tone':color}}>
    <Handle type="target" position={Position.Left} id="in" className="graph-handle"/>
    <div className="graph-node-kind">{data.kind.toUpperCase()}</div>
    <div className="graph-node-name" title={data.title}>{data.title}</div>
    <div className="graph-node-detail" title={data.detail}>{data.detail}</div>
    <Handle type="source" position={Position.Right} id="out" className="graph-handle"/>
  </div>;
}
