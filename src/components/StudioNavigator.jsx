import { useState } from 'react';
import { Button, Collapse, Input, Tag, Typography } from 'antd';
import { AppstoreOutlined, ApartmentOutlined, BuildOutlined, FolderOpenOutlined, NodeIndexOutlined, PlusOutlined, DatabaseOutlined, BranchesOutlined } from '@ant-design/icons';
import { ProjectExplorer } from './ProjectExplorer.jsx';
import { useEditorStore } from '../stores/useEditorStore.js';
const { Text } = Typography;
export function StudioNavigator({ onNewComponent, onNewService, onCreate }) {
  const snapshot = useEditorStore(s=>s.snapshot);
  const selection = useEditorStore(s=>s.selection);
  const select = useEditorStore(s=>s.select);
  const setJourneyStep = useEditorStore(s=>s.setJourneyStep);
  const [query,setQuery] = useState('');
  const [advancedOpen,setAdvancedOpen] = useState(false);
  const choose = (kind,id) => {select({kind,id}); if(kind==='component')setJourneyStep(0);};
  const isComponent = selection?.kind === 'component';
  return <div className="studio-navigator">
    <div className="navigator-kicker">PROJECT WORKSPACE</div>
    <div className="navigator-root"><button className={`navigator-link ${isComponent?'selected':''}`} onClick={()=>snapshot.components[0]?choose('component',snapshot.components[0].id):onNewComponent()}><ApartmentOutlined/> 내 컴포넌트 <Tag>{snapshot.components.length}</Tag></button></div>
    <div className="navigator-list-header"><span>COMPONENTS</span><Button title="컴포넌트 생성" type="text" size="small" icon={<PlusOutlined/>} onClick={onNewComponent}/></div>
    <div className="navigator-search"><Input.Search size="small" value={query} onChange={e=>setQuery(e.target.value)} allowClear placeholder="컴포넌트 검색"/></div>
    <div className="navigator-component-list">
      {snapshot.components.filter(c=>c.name.toLowerCase().includes(query.toLowerCase())).map(c=>{
        const bindings=snapshot.bindings.filter(b=>b.componentId===c.id);
        return <button key={c.id} className={`navigator-component ${selection?.kind==='component'&&selection.id===c.id?'selected':''}`} onClick={()=>choose('component',c.id)}>
          <span className="navigator-component-mark"><ApartmentOutlined/></span><span className="navigator-component-text"><strong>{c.name}</strong><small>제공 {bindings.filter(b=>b.role==='provider').length} · 사용 {bindings.filter(b=>b.role==='consumer').length}</small></span>
        </button>;
      })}
      {snapshot.components.length===0&&<Text type="secondary" className="navigator-empty">+ 버튼으로 첫 컴포넌트를 만들어보세요.</Text>}
    </div>
    <div className="navigator-divider"/>
    <button className={`navigator-link ${selection?.kind==='diagram'||selection?.kind==='connection'?'selected':''}`} onClick={()=>choose('diagram','system')}><NodeIndexOutlined/> 시스템 연결</button>
    <button className={`navigator-link ${selection?.kind==='assetLibrary'?'selected':''}`} onClick={()=>choose('assetLibrary','project')}><DatabaseOutlined/> Asset Library <Tag>{snapshot.services.length+snapshot.topics.length+snapshot.messages.length+(snapshot.dataTypes??[]).length+(snapshot.qosProfiles??[]).length}</Tag></button>
    <button className={`navigator-link ${selection?.kind==='dataPatterns'?'selected':''}`} onClick={()=>choose('dataPatterns','project')}><BranchesOutlined/> Data Patterns</button>
    <button className={`navigator-link ${selection?.kind==='build'?'selected':''}`} onClick={()=>choose('build','project')}><BuildOutlined/> 코드 생성 / 산출물</button>
    <Collapse className="navigator-expert" ghost activeKey={advancedOpen?['advanced']:[]} onChange={keys=>setAdvancedOpen(keys.includes('advanced'))} items={[{key:'advanced',label:<><FolderOpenOutlined/> 고급 모델 도구</>,children:<>
      <Text type="secondary" style={{fontSize:11}}>Service, Topic, Data Type, QoS의 상세 관계를 확인합니다.</Text>
      <ProjectExplorer onCreate={onCreate}/>
      <Button size="small" style={{marginTop:10}} onClick={onNewService}>Custom Service 추가</Button>
    </>}]} />
    <div className="navigator-bottom-hint"><AppstoreOutlined/> UMAA 표준 계약은 읽기 전용으로 유지됩니다.</div>
  </div>;
}
