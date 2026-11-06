import { useEffect, useMemo, useState } from 'react';
import { Button, Input, Tabs, Tag, Tree, Typography } from 'antd';
import {
  ApiOutlined, ApartmentOutlined, ArrowDownOutlined, ArrowUpOutlined,
  BranchesOutlined, CodeOutlined, DatabaseOutlined, DeploymentUnitOutlined,
  FileTextOutlined, FolderOpenOutlined, LinkOutlined, NodeIndexOutlined,
  PlusOutlined, ReadOutlined, SettingOutlined, ShareAltOutlined,
} from '@ant-design/icons';
import { useEditorStore } from '../../stores/useEditorStore.js';
import { projectModelTree, expandedTreeKeys } from '../../model/projectNavigation.js';
const { Text } = Typography;

/** Icon mapping is presentation-only and never stored in the model. */
const iconForNode = node => {
  const kind = node.selection?.kind;
  const key = node.key;
  if (key === 'root:catalog') return <ReadOutlined/>;
  if (key === 'root:project') return <ApiOutlined/>;
  if (key === 'root:system') return <ApartmentOutlined/>;
  if (key.includes(':provider:')) return <ArrowUpOutlined/>;
  if (key.includes(':consumer:')) return <ArrowDownOutlined/>;
  if (key.startsWith('group:')) {
    if (key.includes('types')) return <CodeOutlined/>;
    if (key.includes('topics')) return <DatabaseOutlined/>;
    if (key.includes('qos') || key.includes('dds')) return <SettingOutlined/>;
    if (key.includes('connection')) return <LinkOutlined/>;
    if (key.includes('component')) return <ApartmentOutlined/>;
    return <FolderOpenOutlined/>;
  }
  if (key.includes(':interfaces:') || key.includes(':input:') || key.includes(':output:'))
    return <DeploymentUnitOutlined/>;
  if (key.includes(':category:') || key.includes(':flow:')) return <BranchesOutlined/>;
  switch (kind) {
    case 'diagram': return <NodeIndexOutlined/>;
    case 'functionalArea': return <FolderOpenOutlined/>;
    case 'service': return <ApiOutlined/>;
    case 'interface': return <DeploymentUnitOutlined/>;
    case 'operation': return <BranchesOutlined/>;
    case 'topic': return <DatabaseOutlined/>;
    case 'message':
    case 'dataType': return <CodeOutlined/>;
    case 'component': return <ApartmentOutlined/>;
    case 'binding': return <ShareAltOutlined/>;
    case 'connection': return <LinkOutlined/>;
    case 'ddsConfig':
    case 'qos': return <SettingOutlined/>;
    case 'build': return <CodeOutlined/>;
    case 'flowRules': return <BranchesOutlined/>;
    default: return <FileTextOutlined/>;
  }
};
const tabForKind = kind => (
  ['diagram','component','binding','connection','ddsConfig','qos','dataPatterns','build'].includes(kind)
    ? 'components' : 'services'
);
const START_EXPANDED = {
  services: ['root:catalog', 'root:project', 'group:catalog-services', 'group:project-services','group:project-custom'],
  components: ['root:system', 'group:system-components', 'group:system-dds'],
};

/** Two workflows, one source of truth: existing catalog/project/system model tree. */
export function ProjectModelExplorer({ onNewComponent, onNewService, onCreate }) {
  const snapshot=useEditorStore(state=>state.snapshot);
  const selection=useEditorStore(state=>state.selection);
  const select=useEditorStore(state=>state.select);
  const [tab,setTab]=useState(()=>tabForKind(selection?.kind ?? 'diagram'));
  const [query,setQuery]=useState('');
  const [expanded,setExpanded]=useState(START_EXPANDED);
  useEffect(()=>{ if (selection?.kind) setTab(tabForKind(selection.kind)); },[selection?.kind,selection?.id]);
  const fullTree=useMemo(()=>snapshot?projectModelTree(snapshot,query):[],[snapshot,query]);
  const tree=useMemo(()=>fullTree.filter(node=>tab==='services'
    ? node.key==='root:catalog'||node.key==='root:project'
    : node.key==='root:system'),[fullTree,tab]);
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
    <Tabs className="project-explorer-tabs" size="small" activeKey={tab}
      onChange={value=>{setTab(value);setQuery('');}}
      items={[{key:'services',label:<><ApiOutlined/> Services</>},
        {key:'components',label:<><ApartmentOutlined/> Components</>}]}/>
    <div className="project-explorer-search">
      <Input.Search size="small" allowClear value={query}
        onChange={event=>setQuery(event.target.value)}
        placeholder={tab==='services'?'Service / Interface / Type 검색':'Component / Binding 검색'}/>
      <Button size="small" type="primary" icon={<PlusOutlined/>}
        aria-label={tab==='services'?'Custom Service 추가':'Component 추가'}
        onClick={()=>create(tab==='services'?'service':'component')}/>
    </div>
    <Tree className="project-explorer-tree" showIcon blockNode showLine
      expandedKeys={query?allKeys:expanded[tab]}
      onExpand={keys=>setExpanded(prev=>({...prev,[tab]:keys}))}
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
      {tab==='services'
        ? 'UMAA ICD는 읽기 전용이며 Custom Service만 편집합니다.'
        : 'Component에 Service 역할을 바인딩하고 System Assembly에서 연결합니다.'}
    </Text>
  </div>;
}
function convertNode(n) {
  return {
    key:n.key,label:n.label,badge:n.badge,createKind:n.createKind,
    selection:n.selection,icon:iconForNode(n),
    selectable:Boolean(n.selection),children:n.children.map(convertNode),
  };
}
