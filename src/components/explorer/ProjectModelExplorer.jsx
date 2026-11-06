import { useMemo, useState } from 'react';
import { Button, Input, Tag, Tree, Typography } from 'antd';
import { PlusOutlined } from '@ant-design/icons';
import { useEditorStore } from '../../stores/useEditorStore.js';
import { projectModelTree, expandedTreeKeys } from '../../model/projectNavigation.js';
const { Text } = Typography;

export function ProjectModelExplorer({ onNewComponent, onNewService, onCreate }) {
  const snapshot=useEditorStore(state=>state.snapshot);
  const selection=useEditorStore(state=>state.selection);
  const select=useEditorStore(state=>state.select);
  const [query,setQuery]=useState('');
  const [expanded,setExpanded]=useState([
    'root:catalog','root:project','root:system',
    'group:project-services','group:project-custom','group:system-components','group:system-dds',
  ]);
  const tree=useMemo(()=>snapshot?projectModelTree(snapshot,query):[],[snapshot,query]);
  const allKeys=useMemo(()=>expandedTreeKeys(tree),[tree]);
  const create=(kind)=>{
    if(kind==='component')onNewComponent?.();
    else if(kind==='service')onNewService?.();
    else onCreate?.(kind);
  };
  const activeNodes=[];
  const walk=nodes=>nodes.forEach(node=>{
    if(node.selection?.kind===selection?.kind && node.selection?.id===selection?.id)activeNodes.push(node.key);
    walk(node.children??[]);
  });
  walk(tree);
  return <div className="studio-navigator project-model-explorer">
    <div className="navigator-kicker">PROJECT EXPLORER</div>
    <Input.Search size="small" allowClear value={query}
      onChange={event=>setQuery(event.target.value)} placeholder="Catalog / Service / Component 검색"/>
    <Tree className="project-explorer-tree" blockNode showLine
      expandedKeys={query?allKeys:expanded} onExpand={keys=>setExpanded(keys)}
      selectedKeys={activeNodes.slice(-1)}
      treeData={tree.map(convertNode)}
      titleRender={node=><span className="project-explorer-row">
        <span className="project-explorer-label">{node.label}</span>
        {node.badge&&<Tag className="project-explorer-badge">{node.badge}</Tag>}
        {node.createKind&&<Button icon={<PlusOutlined/>} type="text" size="small"
          aria-label={node.label+' 추가'} onClick={event=>{event.stopPropagation();create(node.createKind);}}/>}
      </span>}
      onSelect={(_,info)=>info.node.selection&&select(info.node.selection)}/>
    <Text type="secondary" className="navigator-bottom-hint">
      표준 ICD는 읽기 전용 참조이며, Service 계약과 System Binding은 별도 모델입니다.
    </Text>
  </div>;
}
function convertNode(n) {
  return {
    key:n.key,label:n.label,badge:n.badge,createKind:n.createKind,selection:n.selection,
    selectable:Boolean(n.selection),children:n.children.map(convertNode),
  };
}
