import { Button, Card, Space, Tag, Typography } from 'antd';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
const {Text}=Typography;

/** Same feature block for Provider and Consumer; role only changes presentation. */
export function ServiceBindingSection({
  title, subtitle, role, rows, snapshot, onAdd, onRemove, onContract,
}) {
  return <Card className="journey-role-card" title={<>
    <div>{title} <Tag color={role==='provider'?'blue':'orange'}>{rows.length}</Tag></div>
    <Text type="secondary" style={{fontSize:11,fontWeight:400}}>{subtitle}</Text>
  </>} extra={<Button size="small" icon={<PlusOutlined/>} onClick={onAdd}>추가</Button>}>
    {rows.length===0 ? <div className="journey-empty">아직 선택된 기능이 없습니다.
      <Button type="link" onClick={onAdd}>서비스 선택하기</Button></div>
      : rows.map(binding=>{
        const service=snapshot.services.find(s=>s.id===binding.serviceId);
        return <div className="journey-binding" key={binding.id}>
          <div className="journey-binding-copy">
            <strong>{service?.name??'알 수 없는 서비스'}</strong>
            <small>{service?.description||service?.functionalArea||'서비스 계약'}</small>
          </div>
          <Space size={2}>
            <Button type="text" size="small" title="서비스 계약 확인" onClick={()=>onContract(service?.id)}>상세</Button>
            <Button size="small" type="text" danger icon={<DeleteOutlined/>}
              aria-label={service?.name+' 바인딩 삭제'} onClick={()=>onRemove(binding)}/>
          </Space>
        </div>;
      })}
  </Card>;
}
