import { useEffect, useMemo, useState } from 'react';
import { Alert, Badge, Button, Card, Collapse, Empty, Form, Input, Modal, Select, Space, Steps, Tag, Typography, message } from 'antd';
import { ApartmentOutlined, ArrowLeftOutlined, ArrowRightOutlined, CheckCircleOutlined, CloudDownloadOutlined, CodeOutlined, DeleteOutlined, PlusOutlined, SettingOutlined } from '@ant-design/icons';
import { useEditorStore } from '../../stores/useEditorStore.js';
import { componentProgress, issueDestination } from '../../logic/journeyModel.js';
import { ServiceAddModal } from './ServicePicker.jsx';
import { ServiceBindingSection } from './ServiceBindingSection.jsx';

const { Text, Title } = Typography;

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
          <ServiceBindingSection title="제공하는 기능" subtitle="이 컴포넌트가 구현할 서비스" role="provider" rows={progress.providers} snapshot={snapshot} onAdd={()=>{setPickerRole('provider');setPicker(true);}} onRemove={remove} onContract={openContract}/>
          <ServiceBindingSection title="사용하는 기능" subtitle="다른 컴포넌트에서 가져올 서비스" role="consumer" rows={progress.consumers} snapshot={snapshot} onAdd={()=>{setPickerRole('consumer');setPicker(true);}} onRemove={remove} onContract={openContract}/>
        </div>
        <div className="journey-inline-summary"><CheckCircleOutlined/> {progress.bindings.length}개 Service Binding · {progress.endpoints.length}개 자동 파생 DDS Endpoint</div>
        <Collapse ghost items={[{key:'dds-preview',label:<span>자동 DDS Endpoint 미리보기 ({progress.endpoints.length})</span>,children:<div className="journey-derived-endpoints">
          {progress.endpoints.slice(0,6).map(e=><div key={e.bindingId+'|'+e.topicId+'|'+e.direction} className="journey-derived-endpoint-row">
            <Tag color={e.direction==='writer'?'blue':'cyan'}>{e.direction==='writer'?'DataWriter':'DataReader'}</Tag>
            <span>{e.serviceName} · {e.topicName}</span>
          </div>)}
          {progress.endpoints.length>6&&<Text type="secondary">외 {progress.endpoints.length-6}개 Endpoint</Text>}
          <Button size="small" onClick={()=>select({kind:'ddsConfig',id:'project',componentId:component.id})}>고급 DDS 설정에서 전체 보기</Button>
          <Text type="secondary" className="small-hint">이 목록은 Service 역할에서 자동 도출한 설계 결과이며, 실제 DDS 엔터티는 아닙니다.</Text>
        </div>}]} />
      </section>}
      {step===2&&<section className="journey-step-content">
        <div className="step-heading"><h2>설정을 확인하고 코드 골격을 생성하세요</h2><Text type="secondary">생성된 파일을 C++ 프로젝트에서 구현하고 컴파일하면 DLL/SO를 만들 수 있습니다.</Text></div>
        <div className="journey-config-grid">
          <Card size="small" title="빌드 대상"><div className="journey-field"><Text type="secondary">운영체제 / 산출물</Text><Select style={{width:'100%'}} value={snapshot.project.targetPlatform} onChange={changePlatform} options={[{value:'linux',label:'Linux · lib*.so'},{value:'windows',label:'Windows · *.dll'}]}/></div>
            <div className="journey-field"><Text type="secondary">DDS 구현체 (설계 메타데이터)</Text><Select style={{width:'100%'}} value={snapshot.project.ddsVendor} onChange={changeVendor} options={[{value:'fastdds',label:'eProsima Fast DDS'},{value:'connext',label:'RTI Connext DDS'}]}/></div></Card>
          <Card size="small" title="생성 대상 요약"><div className="journey-metric"><span>Component</span><strong>{component.name}</strong></div><div className="journey-metric"><span>Service Binding</span><strong>{progress.bindings.length}</strong></div><div className="journey-metric"><span>Endpoint 명세</span><strong>{progress.endpoints.length}</strong></div><div className="journey-metric"><span>정적 모델 오류 (프로젝트 전체)</span><strong>{progress.blockingErrors.length}</strong></div></Card>
        </div>
        <div className="journey-advanced-dds">
          <Text type="secondary">Domain, Partition과 Endpoint QoS는 공통 DDS Configuration에서 관리합니다. Component 조립의 필수 단계가 아닙니다.</Text>
          <Button icon={<SettingOutlined/>} size="small" onClick={()=>select({kind:'ddsConfig',id:'project',componentId:component.id})}>고급 DDS 설정 열기</Button>
        </div>
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
