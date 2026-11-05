import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Collapse, Empty, Form, Input, Modal, Select, Space, Steps, Tag, Typography, message } from 'antd';
import { ApartmentOutlined, ArrowLeftOutlined, ArrowRightOutlined, CheckCircleOutlined, CloudDownloadOutlined, CodeOutlined, DeleteOutlined, PlusOutlined, SettingOutlined } from '@ant-design/icons';
import { useEditorStore } from '../stores/useEditorStore.js';
import { componentProgress, issueDestination } from '../logic/journeyModel.js';
import { RuntimeSettings } from './DesignDetails.jsx';
const { Text, Title } = Typography;

function ServiceAddModal({ open, onClose, component, snapshot, initialRole }) {
  const addBinding = useEditorStore(x => x.addBinding);
  const [query, setQuery] = useState('');
  const [area, setArea] = useState('all');
  const [role, setRole] = useState('provider');
  useEffect(()=>{if(open)setRole(initialRole);},[open,initialRole]);
  const existing = useMemo(() => new Set(snapshot.bindings.filter(b => b.componentId === component.id)
    .map(b => `${b.serviceId}:${b.role}`)), [snapshot, component.id]);
  const candidates = useMemo(() => snapshot.services.filter(s => (area === 'all' || s.functionalArea === area) &&
    `${s.name} ${s.description ?? ''}`.toLowerCase().includes(query.toLowerCase())), [snapshot.services, area, query]);
  const attach = service => {
    if (addBinding(component.id, service.id, role, { stayOnComponent: true })) {
      message.success(`${service.name} · ${role === 'provider' ? '제공' : '사용'} 추가됨`);
    } else message.warning('이미 추가한 서비스입니다.');
  };
  return <Modal open={open} onCancel={onClose} footer={<Button onClick={onClose}>완료</Button>} width={680} title={`${component.name} · 서비스 선택`} destroyOnClose>
    <div className="journey-helper">어떤 기능을 제공하거나 사용할지 선택하세요. Operation, Topic, Type 계약은 자동 연결되며 표준 원본은 변경되지 않습니다.</div>
    <div className="service-picker-controls">
      <Select aria-label="서비스 역할" value={role} onChange={setRole} style={{width:155}} options={[
        {value:'provider',label:'제공하는 기능'},{value:'consumer',label:'사용하는 기능'}]}/>
      <Select aria-label="기능 영역" value={area} onChange={setArea} style={{width:190}} options={[{value:'all',label:'모든 기능 영역'},...snapshot.functionalAreas.map(a=>({value:a.id,label:`${a.id} · ${a.name}`}))]}/>
      <Input.Search aria-label="서비스 검색" value={query} onChange={e=>setQuery(e.target.value)} allowClear placeholder="기능 또는 서비스 이름" style={{flex:1,minWidth:150}}/>
    </div>
    <div className="service-picker-list">
      {candidates.map(service => {
        const already = existing.has(`${service.id}:${role}`);
        return <div className="picker-service" key={service.id}>
          <div className="picker-service-info"><Space size={6}><Text strong>{service.name}</Text><Tag>{service.functionalArea}</Tag>{service.source === 'custom' && <Tag color="purple">Custom</Tag>}</Space>
            <Text type="secondary">{service.description || 'UMAA 서비스 계약'}</Text></div>
          <Button size="small" type={already?'default':'primary'} disabled={already} icon={already?<CheckCircleOutlined/>:<PlusOutlined/>} onClick={()=>attach(service)}>{already?'추가됨':'추가'}</Button>
        </div>;
      })}
      {!candidates.length && <Empty description="검색과 일치하는 서비스가 없습니다."/>}
    </div>
  </Modal>;
}

function BindingColumn({ title, subtitle, role, rows, snapshot, onAdd, onRemove, onContract }) {
  return <Card className="journey-role-card" title={<><div>{title} <Tag color={role === 'provider' ? 'blue' : 'orange'}>{rows.length}</Tag></div><Text type="secondary" style={{fontSize:11,fontWeight:400}}>{subtitle}</Text></>} extra={<Button size="small" icon={<PlusOutlined/>} onClick={onAdd}>추가</Button>}>
    {rows.length === 0 ? <div className="journey-empty">아직 선택된 기능이 없습니다.<br/><Button type="link" onClick={onAdd}>서비스 선택하기</Button></div> : rows.map(binding => {
      const service = snapshot.services.find(s=>s.id===binding.serviceId);
      return <div className="journey-binding" key={binding.id}>
        <div className="journey-binding-copy"><strong>{service?.name ?? '알 수 없는 서비스'}</strong><small>{service?.description || service?.functionalArea || '서비스 계약'}</small></div>
        <Space size={2}><Button type="text" size="small" title="서비스 계약 확인" onClick={()=>onContract(service?.id)}>상세</Button><Button size="small" type="text" danger icon={<DeleteOutlined/>} aria-label={`${service?.name} 바인딩 삭제`} onClick={()=>onRemove(binding)}/></Space>
      </div>;
    })}
  </Card>;
}

export function ComponentJourney({ component, onGenerate, onAdvanced }) {
  const snapshot = useEditorStore(x=>x.snapshot);
  const updateComponent = useEditorStore(x=>x.updateComponent);
  const removeBinding = useEditorStore(x=>x.removeBinding);
  const changeVendor = useEditorStore(x=>x.changeVendor);
  const changePlatform = useEditorStore(x=>x.changePlatform);
  const select = useEditorStore(x=>x.select);
  const progress = useMemo(()=>componentProgress(snapshot, component.id),[snapshot,component.id]);
  const step = useEditorStore(x => x.journeyStep);
  const setStep = useEditorStore(x => x.setJourneyStep);
  const [picker, setPicker] = useState(false);
  const [pickerRole, setPickerRole] = useState('provider');
  const [edit, setEdit] = useState(false);
  const [form] = Form.useForm();
  useEffect(()=>{setPicker(false);},[component.id]);
  const remove = b => Modal.confirm({title:'서비스 연결을 제거할까요?',content:'해당 Provider/Consumer 바인딩과 연결된 서비스 관계가 제거됩니다. 표준 서비스 계약은 유지됩니다.',okText:'제거',okType:'danger',onOk:()=>removeBinding(b.id,{stayOnComponent:true})});
  const openContract = id => id && select({kind:'service',id});
  const move = next => setStep(Math.max(0,Math.min(2,next)));
  return <div className="journey-page">
    <div className="journey-heading"><div><div className="journey-eyebrow">내 컴포넌트 / 제작 워크벤치</div><Title level={3} style={{margin:'4px 0'}}>{component.name}</Title><Text type="secondary">Component를 만들고, 서비스를 조립하고, C++ 코드 골격을 생성합니다.</Text></div>
      <Button onClick={onAdvanced} icon={<CodeOutlined/>}>고급 편집기</Button></div>
    <div className="journey-main">
      <Steps className="journey-steps" size="small" current={step} onChange={move} responsive={false} items={[
        {title:'Component 정의',description:'무엇을 만들까?'},
        {title:'Service 조립',description:'어떤 기능을 쓸까?'},
        {title:'검증 및 생성',description:'무엇을 내보낼까?'}]}/>
      {step===0&&<section className="journey-step-content">
        <div className="step-heading"><h2>만들 컴포넌트를 확인하세요</h2><Text type="secondary">이름과 역할을 정하면 다음 단계에서 표준 기능을 바로 추가할 수 있습니다.</Text></div>
        <Card className="journey-summary-card"><div className="journey-summary-top"><div className="journey-summary-icon"><ApartmentOutlined /></div><div><h3>{component.name}</h3><Text type="secondary">{component.description || '아직 설명을 입력하지 않았습니다.'}</Text></div></div>
          <div className="journey-stat-row"><span>제공하는 기능 <strong>{progress.providers.length}</strong></span><span>사용하는 기능 <strong>{progress.consumers.length}</strong></span><span>DDS 채널 엔드포인트 <strong>{progress.endpoints.length}</strong></span></div>
          <Button onClick={()=>{form.setFieldsValue({name:component.name,description:component.description});setEdit(true);}}>이름과 설명 수정</Button>
        </Card>
        <Alert type="info" showIcon message="UMAA 서비스를 처음부터 설계할 필요는 없습니다." description="다음 단계에서 서비스만 선택하면 공식 계약에 정의된 Operation, Topic, Data Type 참조를 자동으로 연결합니다."/>
      </section>}
      {step===1&&<section className="journey-step-content">
        <div className="step-heading"><h2>어떤 기능을 제공하거나 사용하나요?</h2><Text type="secondary">제공(Provider)은 컴포넌트가 구현하는 기능, 사용(Consumer)은 다른 컴포넌트의 기능입니다.</Text></div>
        <div className="journey-binding-grid">
          <BindingColumn title="제공하는 기능" subtitle="이 컴포넌트가 구현할 서비스" role="provider" rows={progress.providers} snapshot={snapshot} onAdd={()=>{setPickerRole('provider');setPicker(true);}} onRemove={remove} onContract={openContract}/>
          <BindingColumn title="사용하는 기능" subtitle="다른 컴포넌트에서 가져올 서비스" role="consumer" rows={progress.consumers} snapshot={snapshot} onAdd={()=>{setPickerRole('consumer');setPicker(true);}} onRemove={remove} onContract={openContract}/>
        </div>
        <div className="journey-inline-summary"><CheckCircleOutlined/> {progress.bindings.length}개 Service Binding · {progress.endpoints.length}개 파생 DDS Endpoint <Button type="link" onClick={onAdvanced}>Operation / Topic 상세 보기</Button></div>
      </section>}
      {step===2&&<section className="journey-step-content">
        <div className="step-heading"><h2>설정을 확인하고 코드 골격을 생성하세요</h2><Text type="secondary">생성된 파일을 C++ 프로젝트에서 구현하고 컴파일하면 DLL/SO를 만들 수 있습니다.</Text></div>
        <div className="journey-config-grid">
          <Card size="small" title="빌드 대상"><div className="journey-field"><Text type="secondary">운영체제 / 산출물</Text><Select style={{width:'100%'}} value={snapshot.project.targetPlatform} onChange={changePlatform} options={[{value:'linux',label:'Linux · lib*.so'},{value:'windows',label:'Windows · *.dll'}]}/></div>
            <div className="journey-field"><Text type="secondary">DDS 구현체 (설계 메타데이터)</Text><Select style={{width:'100%'}} value={snapshot.project.ddsVendor} onChange={changeVendor} options={[{value:'fastdds',label:'eProsima Fast DDS'},{value:'connext',label:'RTI Connext DDS'}]}/></div></Card>
          <Card size="small" title="생성 대상 요약"><div className="journey-metric"><span>Component</span><strong>{component.name}</strong></div><div className="journey-metric"><span>Service Binding</span><strong>{progress.bindings.length}</strong></div><div className="journey-metric"><span>Endpoint 명세</span><strong>{progress.endpoints.length}</strong></div><div className="journey-metric"><span>정적 모델 오류 (프로젝트 전체)</span><strong>{progress.blockingErrors.length}</strong></div></Card>
        </div>
        <Collapse ghost items={[{key:'runtime',label:<><SettingOutlined/> 고급 DDS Runtime / QoS 설정</>,children:<RuntimeSettings componentId={component.id}/>}]} />
        {!progress.hasServices&&<Alert style={{marginTop:12}} type="warning" showIcon message="아직 서비스가 없습니다." description="이 컴포넌트가 제공하거나 사용하는 서비스를 하나 이상 선택하세요." action={<Button size="small" onClick={()=>move(1)}>서비스 선택</Button>}/>}
        {progress.blockingErrors.length>0&&<Alert style={{marginTop:12}} showIcon type="error" message={`프로젝트 정적 검사 오류 ${progress.blockingErrors.length}건`} description={<div>현재 생성기는 프로젝트 전체를 검증합니다. 아래 오류 항목을 확인하세요.<div className="journey-error-links">{progress.blockingErrors.slice(0,6).map((i,n)=><Button key={`${i.code}-${n}`} size="small" onClick={()=>{const d=issueDestination(snapshot,i);if(d)select(d);}} disabled={!issueDestination(snapshot,i)}>{i.message}</Button>)}</div></div>}/>}
        {progress.hasServices&&progress.blockingErrors.length===0&&<Alert style={{marginTop:12}} type="success" showIcon message="코드 골격 생성 준비 완료" description="정적 스키마 검증 결과입니다. 컴파일 성공, DDS 통신 동작 또는 UMAA 공식 적합성을 의미하지 않습니다."/>}
        <Card className="journey-export-card"><div><h3>Component C++ 골격 ZIP</h3><p>헤더·소스, CMake, Endpoint 명세, Custom IDL을 생성합니다. DDS Runtime 및 제어 알고리즘 구현은 별도로 필요합니다.</p></div><Button type="primary" size="large" icon={<CloudDownloadOutlined/>} disabled={!progress.canGenerate} onClick={()=>onGenerate(component.id)}>파일 생성 및 미리보기</Button></Card>
      </section>}
      <div className="journey-footer"><Button disabled={step===0} onClick={()=>move(step-1)} icon={<ArrowLeftOutlined/>}>이전</Button><Text type="secondary">{step+1} / 3</Text>{step<2?<Button type="primary" onClick={()=>move(step+1)}>다음 단계 <ArrowRightOutlined/></Button>:<Button onClick={()=>move(1)}>서비스 구성 수정</Button>}</div>
    </div>
    <ServiceAddModal open={picker} onClose={()=>setPicker(false)} component={component} snapshot={snapshot} initialRole={pickerRole}/>
    <Modal title="Component 정보 수정" open={edit} onCancel={()=>setEdit(false)} okText="저장" onOk={async()=>{
      try {const values=await form.validateFields(); if(updateComponent(component.id,values)){setEdit(false);message.success('Component 정보가 변경되었습니다.');}else message.error('같은 이름의 Component가 있거나 이름이 올바르지 않습니다.');} catch { /* form validation */ }
    }}><Form form={form} layout="vertical"><Form.Item name="name" label="Component 이름" rules={[{required:true,message:'이름을 입력하세요'}]}><Input maxLength={80}/></Form.Item><Form.Item name="description" label="어떤 기능을 하나요?"><Input.TextArea rows={3} maxLength={500}/></Form.Item></Form></Modal>
  </div>;
}
