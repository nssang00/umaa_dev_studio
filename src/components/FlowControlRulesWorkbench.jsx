import { Alert, Descriptions, Table, Tag, Typography } from 'antd';
import { FLOW_CONTROLS } from '../model/icdConcepts.js';
const rows=[
  {key:'command-response',details:'Consumer command publish → Provider Command Status / Ack report; Cancel may use DDS Dispose on the existing keyed Command Topic.',caveat:'Command sessions, GUID routing, state transitions, cleanup and recovery require implementation.'},
  {key:'request-reply',details:'Provider report publish → Consumer subscription. Query without request data is typically a subscription rather than a separate request Topic.',caveat:'Queries carrying data need contract-specific handling; no artificial request Topic is generated.'},
];
export function FlowControlRulesWorkbench({ruleId}) {
  return <div className="center-workbench">
    <div className="editor-heading"><div>
      <Typography.Text type="secondary" className="editor-eyebrow">UMAA ICD · REFERENCE RULES</Typography.Text>
      <h2>Flow Control Rules</h2></div></div>
    <Alert type="info" showIcon message="Flow Control과 Service Type은 다른 개념입니다."
      description="Control / Config / Specs / Status·Report는 서비스 분류이며 Command / Response와 Request / Reply는 통신 흐름입니다. 이 화면은 내장된 ICD 부분 참조를 요약하며 전체 규격을 대체하지 않습니다."/>
    {rows.filter(r=>!ruleId || r.key===ruleId).map(r=><Descriptions key={r.key}
      bordered size="small" column={1} style={{marginTop:14}}>
      <Descriptions.Item label="Flow Control"><Tag>{FLOW_CONTROLS.find(x=>x.value===r.key)?.label}</Tag></Descriptions.Item>
      <Descriptions.Item label="Operation → DDS mapping">{r.details}</Descriptions.Item>
      <Descriptions.Item label="Implementation constraint">{r.caveat}</Descriptions.Item>
    </Descriptions>)}
    <Typography.Text type="secondary" className="small-hint">표준 계약 원본은 편집할 수 없으며, DDS 실행 및 Flow Control 상태 머신 검증은 별도입니다.</Typography.Text>
  </div>;
}
