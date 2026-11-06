import { Alert, Button, Descriptions, Select, Tag, Typography, message } from 'antd';
import { useEditorStore } from '../stores/useEditorStore.js';
import { findConfiguredEndpoint } from '../model/endpointConfiguration.js';
const {Text}=Typography;

/** Selection-specific QoS override; effective QoS inherits the Component default. */
export function EndpointProperties({ snapshot, endpointKey }) {
  const endpoint=findConfiguredEndpoint(snapshot,endpointKey);
  const change=useEditorStore(state=>state.updateEndpointQosProfile);
  const select=useEditorStore(state=>state.select);
  if(!endpoint)return <Alert showIcon type="warning" message="선택한 Endpoint를 찾지 못했습니다."/>;
  const component=snapshot.components.find(c=>c.id===endpoint.componentId);
  const effective=snapshot.qosProfiles.find(p=>p.id===endpoint.qosProfileId);
  const topic=snapshot.topics.find(t=>t.id===endpoint.topicId);
  return <div className="inspector context-properties endpoint-properties">
    <Text type="secondary" className="side-label">DDS ENDPOINT PROPERTIES</Text>
    <h3>Data{endpoint.direction==='writer'?'Writer':'Reader'}</h3>
    <Tag color={endpoint.direction==='writer'?'blue':'cyan'}>{endpoint.role.toUpperCase()}</Tag>
    <Descriptions size="small" bordered column={1} style={{marginTop:10}}>
      <Descriptions.Item label="Component">{component?.name}</Descriptions.Item>
      <Descriptions.Item label="Service">{endpoint.serviceName}</Descriptions.Item>
      <Descriptions.Item label="Topic">{topic?.name??endpoint.topicName}</Descriptions.Item>
      <Descriptions.Item label="Data Type">{endpoint.typeName}</Descriptions.Item>
      <Descriptions.Item label="Domain">{snapshot.componentRuntime?.[endpoint.componentId]?.domainId??0}</Descriptions.Item>
      <Descriptions.Item label="Partition">{snapshot.componentRuntime?.[endpoint.componentId]?.partition||'(default)'}</Descriptions.Item>
    </Descriptions>
    <label className="endpoint-qos-select">Endpoint QoS Profile
      <Select allowClear size="small" style={{width:'100%'}}
        placeholder="Component 기본 Profile 상속"
        value={endpoint.explicitQosProfileId??undefined}
        onChange={value=>{
          if(!change(endpoint.componentId,endpoint.key,value??null))
            message.error('QoS Profile 참조를 저장하지 못했습니다.');
        }}
        options={snapshot.qosProfiles.map(q=>({label:q.name,value:q.id}))}/>
    </label>
    <Text type="secondary" className="small-hint">
      Effective: {effective?.name??'No QoS'} · {endpoint.qosSource==='endpoint'?'Endpoint override':'Component inheritance'}
      {' · '}적용 영역: {endpoint.direction==='writer'?'datawriter_qos':'datareader_qos'}
    </Text>
    {effective&&<Button size="small" onClick={()=>select({kind:'qos',id:effective.id})}>QoS Profile 편집 열기</Button>}
    {topic&&<Button style={{marginLeft:6}} size="small" onClick={()=>select({kind:'topic',id:topic.id})}>Topic 계약 열기</Button>}
    <Alert type="info" style={{marginTop:12}} showIcon message="DDS 설계 데이터"
      description="이 선택은 QoS Profile 참조를 저장하지만 실제 DataWriter/DataReader 생성, 프로파일 병합 및 Requested/Offered 검증은 구현하지 않습니다."/>
  </div>;
}
