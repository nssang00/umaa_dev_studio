import { Alert, Button, Descriptions, Space, Table, Tag, Typography } from 'antd';
import { useEditorStore } from '../stores/useEditorStore.js';
import { categoryForService, categoryLabel, flowLabel, serviceFlowProjection } from '../model/icdConcepts.js';
const {Text}=Typography;
/** Read-only projection of the ICD flow semantics. Not a runtime state machine. */
export function IcdFlowView({serviceId}) {
  const s=useEditorStore(x=>x.snapshot),select=useEditorStore(x=>x.select);
  if(!s)return null;
  const {service,operations,reports,commands,queries,disposes}=serviceFlowProjection(s,serviceId);
  if(!service)return null;
  return <div className="icd-flow-view">
    <Space wrap style={{marginBottom:12}}><Tag>{`Service Category: ${categoryLabel(service)}`}</Tag><Tag color="blue">{flowLabel(service.flowControl)}</Tag><Tag>{reports.length} Report Operations</Tag></Space>
    <Alert type="info" showIcon message="Status / Report는 Flow Control 종류가 아닙니다." description="ICD §3.4에서 Status / Report는 Service 명명·정보 제공 성격을 나타냅니다. 실제 보고는 reportXXX Operation으로 표현하고 Command / Response 또는 Request / Reply Flow Control의 동작에 포함됩니다."/>
    <div className="flow-mini-diagram" role="img" aria-label={`${flowLabel(service.flowControl)} flow conceptual diagram`}>
      <div className="flow-actor">Service Consumer</div>
      <div className="flow-exchanges">
        <div className="flow-arrow to-provider"><strong>{service.flowControl==='command-response'?'Command':'Query / Subscribe'}</strong><span>→</span></div>
        <div className="flow-arrow to-consumer"><strong>{service.flowControl==='command-response'?'Command Status / Ack / Execution Status':'Report / Status'}</strong><span>←</span></div>
        {service.flowControl==='command-response'&&<div className="flow-arrow to-provider"><strong>Cancel: DDS Dispose</strong><span>→</span></div>}
      </div>
      <div className="flow-actor">Service Provider</div>
    </div>
    <Text type="secondary" className="small-hint">개념 흐름도입니다. UML/ICD의 상태 전이와 정확한 시퀀스를 자동 인증하거나 실행하지 않습니다. Query는 대체로 Topic 구독, Cancel은 기존 명령 Dispose로 처리합니다.</Text>
    <h3>Operation 분류 · ICD 용어</h3>
    <Table size="small" pagination={false} rowKey="id" dataSource={operations} columns={[
      {title:'Operation',dataIndex:'name',render:(v,r)=><Button type="link" style={{padding:0}} onClick={()=>select({kind:'operation',id:r.id})}>{v}</Button>},
      {title:'Purpose',dataIndex:'purpose'},
      {title:'DDS Action',dataIndex:'action',render:v=><Tag>{v}</Tag>},
      {title:'Topic / Data Type',render:(_,r)=><div><Button size="small" type="link" onClick={()=>r.topicId&&select({kind:'topic',id:r.topicId})}>{r.topicName??'Not applicable'}</Button><div><Text type="secondary">{r.dataTypeName??'—'}</Text></div></div>},
    ]}/>
    {service.flowControl==='command-response'&&<Alert style={{marginTop:14}} type="warning" showIcon message="ICD §5.1 Command / Response 구현 요구" description="sessionID, destination GUID, CommandStatus 상태 전이, 업데이트, Cancel·Cleanup, 복구와 QoS를 실제 Runtime에서 구현해야 합니다."/>}
    {service.flowControl==='request-reply'&&<Alert style={{marginTop:14}} type="info" showIcon message="ICD §5.2 Request / Reply" description="UMAA 6.0은 Query Data가 없는 경우 구독으로 요청을 표현합니다. Query Data가 포함된 Request/Reply는 별도 구현 계약 확인이 필요합니다."/>}
    {categoryForService(service)==='status-report'&&<Text type="secondary" className="small-hint">Status / Report 서비스라도 Request / Reply라는 Flow Control과는 다른 분류입니다.</Text>}
  </div>;
}
