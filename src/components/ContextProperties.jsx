import { Button, Descriptions, Divider, Empty, Space, Tag, Typography } from 'antd';
import { useEditorStore } from '../stores/useEditorStore.js';
import { deriveEndpoints } from '../logic/endpoints.js';
import { Inspector } from './Inspector.jsx';
import { TypeProperties } from './TypeProperties.jsx';
const {Text}=Typography;
export function ContextProperties() {
  const s=useEditorStore(x=>x.snapshot);
  const selection=useEditorStore(x=>x.selection);
  const select=useEditorStore(x=>x.select);
  const highlightedComponentId=useEditorStore(x=>x.highlightedComponentId);
  if(!s)return null;
  const kind=selection?.kind;
  if((kind==='diagram'||!kind)&&highlightedComponentId){
    const component=s.components.find(c=>c.id===highlightedComponentId);
    if(component){const bs=s.bindings.filter(b=>b.componentId===component.id);return <div className="inspector context-properties"><Text type="secondary" className="side-label">COMPONENT SELECTED ON CANVAS</Text><h3>{component.name}</h3><Descriptions size="small" bordered column={1}><Descriptions.Item label="Provider">{bs.filter(b=>b.role==='provider').length}</Descriptions.Item><Descriptions.Item label="Consumer">{bs.filter(b=>b.role==='consumer').length}</Descriptions.Item></Descriptions><Button style={{marginTop:12}} type="primary" block onClick={()=>select({kind:'component',id:component.id})}>Component 편집 열기</Button><Text className="small-hint">더블클릭으로도 Component 편집기로 이동할 수 있습니다. Single-click은 Assembly 캔버스를 유지합니다.</Text></div>;}
  }
  if(['component','binding'].includes(kind))return <Inspector/>;
  if(['message','dataType'].includes(kind)){
    const type=kind==='message'?s.messages.find(x=>x.id===selection.id):s.dataTypes.find(x=>x.id===selection.id);
    return type?<TypeProperties key={type.id} snapshot={s} type={type} kind={kind} selection={selection}/>:null;
  }
  const name=kind==='service'?s.services.find(x=>x.id===selection.id)?.name:
    kind==='message'?s.messages.find(x=>x.id===selection.id)?.name:
    kind==='dataType'?s.dataTypes.find(x=>x.id===selection.id)?.name:
    kind==='topic'?s.topics.find(x=>x.id===selection.id)?.name:
    kind==='qos'?s.qosProfiles.find(x=>x.id===selection.id)?.name:
    kind==='connection'?'DDS Communication':kind==='operation'?s.operations.find(x=>x.id===selection.id)?.name:
    kind==='functionalArea'?s.functionalAreas.find(x=>x.id===selection.id)?.name:kind==='assetLibrary'?'Asset Library':kind==='dataPatterns'?'Data Patterns':'System Diagram';
  const svc=kind==='service'?s.services.find(x=>x.id===selection.id):null;
  const op=kind==='operation'?s.operations.find(x=>x.id===selection.id):null;
  const topic=kind==='topic'?s.topics.find(x=>x.id===selection.id):null;
  const type=kind==='message'?s.messages.find(x=>x.id===selection.id):kind==='dataType'?s.dataTypes.find(x=>x.id===selection.id):null;
  return <div className="inspector context-properties"><Text type="secondary" className="side-label">SELECTION PROPERTIES</Text><h3>{name}</h3>
    {svc&&<><Space wrap><Tag>{svc.functionalArea}</Tag><Tag color={svc.source==='custom'?'purple':'blue'}>{svc.source}</Tag></Space>
      <Descriptions size="small" bordered column={1} style={{marginTop:14}}><Descriptions.Item label="Namespace">{svc.namespace}</Descriptions.Item><Descriptions.Item label="Pattern template">{svc.flowControl}</Descriptions.Item><Descriptions.Item label="Operations">{s.operations.filter(o=>o.serviceId===svc.id).length}</Descriptions.Item><Descriptions.Item label="Usage">{s.bindings.filter(b=>b.serviceId===svc.id).length} bindings</Descriptions.Item></Descriptions></>}
    {topic&&<><Descriptions bordered column={1} size="small"><Descriptions.Item label="Topic Name">{topic.name}</Descriptions.Item><Descriptions.Item label="Type">{s.messages.find(m=>m.id===topic.messageTypeId)?.name??'—'}</Descriptions.Item></Descriptions><Button size="small" style={{marginTop:10}} onClick={()=>select({kind:'message',id:topic.messageTypeId})}>Data Type 열기</Button></>}
    {op&&<><Tag>{op.action}</Tag><Descriptions bordered size="small" column={1} style={{marginTop:12}}><Descriptions.Item label="Actor">{op.actor}</Descriptions.Item><Descriptions.Item label="DDS Action">{op.action}</Descriptions.Item></Descriptions><Button style={{marginTop:10}} size="small" onClick={()=>select({kind:'service',id:op.serviceId})}>Service 계약 열기</Button></>}
    {kind==='connection'&&<><Text>서비스 사용 관계의 DDS Topic 채널을 중앙에서 확인할 수 있습니다.</Text><p className="small-hint">선의 방향은 실제 Command 흐름을 의미하지 않습니다. Command는 Consumer→Provider, Status는 Provider→Consumer입니다.</p></>}
    {kind==='qos'&&<><Text>QoS Profile은 중앙에서 편집합니다.</Text><p className="small-hint">실제 Writer/Reader 호환성과 UMAA ICD별 필수 QoS는 별도 검증해야 합니다.</p></>}
    {(kind==='diagram'||!kind)&&<><Text type="secondary">왼쪽 Catalog에서 Service를 선택해 계약을 확인하거나 Component Diagram으로 드래그하세요.</Text><Divider/><Text>현재 모델</Text><div className="property-metrics">{s.components.length} Components · {s.connections.length} Connections · {s.services.length} Services</div></>}
    {kind==='assetLibrary'&&<Text type="secondary">Service / Topic / Data Type / QoS를 Component에 종속되지 않게 만들고 재사용할 수 있습니다. 공식 ICD 계약은 보호됩니다.</Text>}
    {kind==='dataPatterns'&&<Text type="secondary">Large Collections와 Generalization / Specialization은 Data Pattern이며, DDS Topic 관계와 수신 동기화 제약을 표현합니다.</Text>}
    {kind==='build'&&<Text type="secondary">중앙 Build 화면에서 대상 Component 및 생성 산출물을 확인합니다.</Text>}
  </div>;
}
