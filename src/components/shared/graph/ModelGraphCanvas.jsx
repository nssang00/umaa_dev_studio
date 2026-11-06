import { Background, Controls, MiniMap, ReactFlow } from '@xyflow/react';

/**
 * Shared ReactFlow presentation; domain-specific nodes, links, permissions,
 * actions, and validation remain with each feature editor.
 */
export function ModelGraphCanvas({
  graphKey, nodes, edges, nodeTypes, miniMap=false, controls=true,
  backgroundGap=18, backgroundColor='#dce6f2', children, ...flowProps
}) {
  return <ReactFlow key={graphKey} nodes={nodes} edges={edges}
    nodeTypes={nodeTypes} proOptions={{hideAttribution:true}} {...flowProps}>
    <Background gap={backgroundGap} color={backgroundColor}/>
    {controls&&<Controls showInteractive={false}/>}
    {miniMap&&<MiniMap pannable zoomable/>}
    {children}
  </ReactFlow>;
}
