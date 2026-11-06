import { Form, Select, Typography } from 'antd';

export const OPERATION_DEFAULT_VALUES = Object.freeze({
  action:'publish',direction:'output',actor:'provider',optionalConsumer:false,
});
const ACTION_OPTIONS=['publish','subscribe','dispose'].map(value=>({label:value,value}));
const DIRECTION_OPTIONS=[
  {label:'INPUT · Consumer → Provider',value:'input'},
  {label:'OUTPUT · Provider → Consumer',value:'output'},
];
const ACTOR_OPTIONS=[
  {label:'Consumer',value:'consumer'},
  {label:'Provider',value:'provider'},
];

/**
 * Reused by ContractGraph and CustomServiceEditor. Both dialogs own their Form,
 * submit action and topic filtering; this component owns only the fields.
 * Interface direction never derives from DDS action or actor.
 */
export function OperationFields({
  topics=[],topicLabel='DDS Topic',directionLabel='Interface Direction · Provider 기준',
  help=true,
}) {
  return <>
    <Form.Item name="topicId" label={topicLabel} rules={[{required:true}]}>
      <Select showSearch optionFilterProp="label" options={topics.map(t=>({label:t.name,value:t.id}))}/>
    </Form.Item>
    <Form.Item name="action" label="DDS Action" rules={[{required:true}]}>
      <Select options={ACTION_OPTIONS}/>
    </Form.Item>
    <Form.Item name="direction" label={directionLabel} rules={[{required:true}]}>
      <Select options={DIRECTION_OPTIONS}/>
    </Form.Item>
    <Form.Item name="actor" label="DDS Actor (독립 지정)" rules={[{required:true}]}>
      <Select options={ACTOR_OPTIONS}/>
    </Form.Item>
    {help&&<Typography.Text type="secondary" className="small-hint">
      INPUT/OUTPUT은 Service 계약 방향입니다. Query가 INPUT이어도 DDS 동작은 Consumer Subscribe일 수 있습니다.
    </Typography.Text>}
  </>;
}
