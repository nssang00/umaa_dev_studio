import { useMemo, useState } from 'react';
import { Alert, Button, Select, Table, Tag, Typography } from 'antd';
import { useEditorStore } from '../stores/useEditorStore.js';
import { configuredEndpoints } from '../model/endpointConfiguration.js';
import { RuntimeSettings } from './DesignDetails.jsx';
const {Text}=Typography;
/** Index of derived logical DDS endpoints; selecting a row opens sidebar Properties. */
export function DdsConfigurationWorkbench() {
  const s=useEditorStore(state=>state.snapshot);
  const select=useEditorStore(state=>state.select);
  const [componentId,setComponentId]=useState('all');
  const rows=useMemo(()=>s?.components.flatMap(c=>configuredEndpoints(s,c.id).map(e=>({
    ...e,componentName:c.name,qosName:s.qosProfiles.find(q=>q.id===e.qosProfileId)?.name??'Missing',
  })))??[],[s]);
  const filtered=componentId==='all'?rows:rows.filter(x=>x.componentId===componentId);
  return <div className="center-workbench dds-config-workbench">
    <div className="editor-heading"><div>
      <Text type="secondary" className="editor-eyebrow">SYSTEM MODEL · DDS CONFIGURATION</Text>
      <h2>DDS Endpoint Configuration</h2>
      <Text type="secondary">Component Binding → DataWriter / DataReader → Topic → QoS Profile</Text>
    </div></div>
    <Alert type="info" showIcon message="Endpoint는 Service Binding에서 자동 도출됩니다."
      description="표에서 선택하면 오른쪽 Properties에 Topic·Data Type·QoS가 표시됩니다. DDS 생성과 미들웨어 적용은 미구현입니다."/>
    <div className="dds-config-filter">
      <Text>Component</Text>
      <Select size="small" value={componentId} onChange={setComponentId} style={{minWidth:230}}
        options={[{value:'all',label:'All Components'},...s.components.map(c=>({value:c.id,label:c.name}))]}/>
    </div>
    <Table size="small" rowKey="key" pagination={{pageSize:12}}
      dataSource={filtered} scroll={{x:790}}
      onRow={e=>({onClick:()=>select({kind:'ddsConfig',id:'project',endpointKey:e.key})})}
      columns={[
        {title:'Component',dataIndex:'componentName'},
        {title:'Service',dataIndex:'serviceName'},
        {title:'DDS Endpoint',render:(_,e)=><Button type="link" size="small" onClick={()=>select({kind:'ddsConfig',id:'project',endpointKey:e.key})}>Data{e.direction==='writer'?'Writer':'Reader'}</Button>},
        {title:'Topic / Type',render:(_,e)=><><div>{e.topicName}</div><Text type="secondary" style={{fontSize:11}}>{e.typeName}</Text></>},
        {title:'QoS Profile',render:(_,e)=><><Tag>{e.qosName}</Tag>{e.qosSource==='endpoint'&&<Tag color="blue">Override</Tag>}</>},
      ]}/>
    {componentId!=='all'&&<div className="dds-overview-runtime">
      <RuntimeSettings componentId={componentId}/>
    </div>}
    <Text type="secondary" className="small-hint">Topic 이름/데이터 형식은 Service 계약을 참조합니다. Domain/Partition은 Component 단위, QoS는 Endpoint별 Override가 가능합니다.</Text>
  </div>;
}
