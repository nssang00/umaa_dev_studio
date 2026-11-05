import { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Badge, Button, ConfigProvider, Divider, Dropdown, Flex, Form, Input, Layout, Modal, Select, Space, Spin, Table, Tabs, Tag, Tooltip, Typography, message } from 'antd';
import { ApiOutlined, ApartmentOutlined, AppstoreOutlined, CloudDownloadOutlined, DatabaseOutlined, DownloadOutlined, FileAddOutlined, PlusOutlined, ReloadOutlined, SaveOutlined, SafetyCertificateOutlined, ShareAltOutlined, UploadOutlined, FolderAddOutlined, ControlOutlined } from '@ant-design/icons';
import { WorkspaceWorkbench } from './components/WorkspaceWorkbench.jsx';
import { StudioNavigator } from './components/StudioNavigator.jsx';
import { JourneyGuide } from './components/JourneyGuide.jsx';
import { GenerationPanel } from './components/GenerationPanel.jsx';
import { ContextProperties } from './components/ContextProperties.jsx';
import { ProjectExplorer } from './components/ProjectExplorer.jsx';
import { StudioShell } from './components/StudioShell.jsx';
import { BottomPanel } from './components/BottomPanel.jsx';
import { validateWorkspace } from './logic/validation.js';
import { useEditorStore } from './stores/useEditorStore.js';
import { canPersistLocally } from './repository/mockRepository.js';
import './styles.css';
const { Header, Content } = Layout;
const { Text, Title } = Typography;
function AddCustomServiceModal({ open, onClose }) {
    const [form] = Form.useForm();
    const createService = useEditorStore(s => s.addCustomService);
    const snapshot = useEditorStore(s => s.snapshot);
    return <Modal title="Custom Service 생성" open={open} okText="생성" onCancel={onClose} destroyOnClose onOk={async () => {
            try {
                const v = await form.validateFields();
                if (createService(v.name, v.flow, v.area)) {
                    message.success('Custom Service 및 메시지 정의를 생성했습니다.');
                    form.resetFields();
                    onClose();
                }
                else
                    message.error('서비스명 중복 또는 식별자 형식 오류');
            }
            catch { /* validation */ }
        }}>
    <Alert type="info" showIcon message="Custom Service는 UMAA 표준 Service가 아닙니다." description="생성되는 IDL은 프로젝트 정의이며, 규격 준수는 별도 검토해야 합니다." style={{ marginBottom: 16 }}/>
    <Form layout="vertical" form={form} initialValues={{ flow: 'request-reply', area: 'CUSTOM' }}>
      <Form.Item name="name" label="Service Name" rules={[{ required: true }, { pattern: /^[A-Za-z][A-Za-z0-9_]*$/, message: '영문자로 시작하는 이름을 사용하세요' }]}><Input placeholder="CustomSensorStatus"/></Form.Item>
      <Form.Item name="area" label="Functional Area 분류" rules={[{required:true}]}><Select options={[{value:'CUSTOM',label:'Project Extensions (독립)'},...(snapshot?.functionalAreas??[]).filter(a=>a.id!=='CUSTOM').map(a=>({value:a.id,label:`${a.id} — ${a.name} ${a.source==='custom'?'(Custom)':'(UMAA 분류 참조)'}`}))]}/></Form.Item>
      <Form.Item name="flow" label="Flow Control · ICD §5 (Status/Report와 별개)"><Select options={[{ label: 'Request / Reply (구독 기반 조회 템플릿)', value: 'request-reply' }, { label: 'Command / Response (명령/상태 템플릿)', value: 'command-response' }]}/></Form.Item>
    </Form>
  </Modal>;
}
export default function App() {
    const snapshot = useEditorStore(s => s.snapshot);
    const selection = useEditorStore(s => s.selection);
    const loading = useEditorStore(s => s.loading);
    const saving = useEditorStore(s => s.saving);
    const dirty = useEditorStore(s => s.dirty);
    const load = useEditorStore(s => s.load);
    const save = useEditorStore(s => s.save);
    const reset = useEditorStore(s => s.reset);
    const importSnapshot = useEditorStore(s => s.importSnapshot);
    const jsonInputRef = useRef(null);
    const [canUseLocalStorage] = useState(() => canPersistLocally());
    const addComponent = useEditorStore(s => s.addComponent);
    const autoLayout = useEditorStore(s => s.autoLayout);
    const changeVendor = useEditorStore(s => s.changeVendor);
    const changePlatform = useEditorStore(s => s.changePlatform);
    const [componentModal, setComponentModal] = useState(false);
    const [serviceModal, setServiceModal] = useState(false);
    const [generationOpen, setGenerationOpen] = useState(false);
    const [generationTarget, setGenerationTarget] = useState('all');
    const openGenerator = (id = 'all') => { setGenerationTarget(id); setGenerationOpen(true); };
    const [createKind, setCreateKind] = useState(null);
    const [createForm] = Form.useForm();
    const addFunctionalArea = useEditorStore(s => s.addFunctionalArea);
    const addDataType = useEditorStore(s => s.addDataType);
    const addStandaloneDataType=useEditorStore(s=>s.addStandaloneDataType);
    const addStandaloneTopic=useEditorStore(s=>s.addStandaloneTopic);
    const addQosProfile = useEditorStore(s => s.addQosProfile);
    const [componentForm] = Form.useForm();
    const issues = useMemo(() => snapshot ? validateWorkspace(snapshot) : [], [snapshot]);
    useEffect(() => { void load(); }, [load]);
    const exportJson = () => {
        if (!snapshot)
            return;
        const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `${snapshot.project.id}-workspace.json`;
        document.body.appendChild(link);
        link.click();
        link.remove();
        window.setTimeout(() => URL.revokeObjectURL(url), 2000);
        message.success('프로젝트 JSON을 내보냈습니다.');
    };
    const importJson = async (file) => {
        if (!file)
            return;
        try {
            if (file.size > 8 * 1024 * 1024)
                throw new Error('8MB 이하의 프로젝트 JSON만 가져올 수 있습니다.');
            const json = JSON.parse(await file.text());
            importSnapshot(json);
            await useEditorStore.getState().save();
            message.success('프로젝트 JSON을 가져왔습니다.');
        }
        catch (error) {
            message.error(error instanceof Error ? error.message : '프로젝트를 가져올 수 없습니다.');
        }
        finally {
            if (jsonInputRef.current)
                jsonInputRef.current.value = '';
        }
    };
    return <ConfigProvider theme={{ token: { colorPrimary: '#3267ad', borderRadius: 8, colorBgLayout: '#f3f6fa', fontSize: 13 } }}>
    <Layout className="app-shell">
      <input ref={jsonInputRef} type="file" accept=".json,application/json" aria-label="프로젝트 JSON 가져오기" style={{ display: 'none' }} onChange={e => { void importJson(e.target.files?.[0]); }}/>
      <Header className="app-header">
        <Flex justify="space-between" align="center" gap={14} style={{ height: '100%' }}>
          <Space size={12} align="center"><div className="app-logo"><ShareAltOutlined /></div><div><div className="app-title">UMAA Development Studio</div><div className="app-subtitle">Component 제작 · Asset Library · ICD Data Patterns</div></div></Space>
          <Space size={8} wrap>
            <Tag color="processing">{snapshot?.project.standardVersion ?? 'UMAA 6.0'}</Tag>
            <Tag color={dirty?'gold':'success'}>{dirty?'저장하지 않은 변경사항':'저장됨'}</Tag>
            <Button size="small" icon={<SaveOutlined />} loading={saving} disabled={!snapshot} onClick={async()=>{await save();message.success('브라우저 Mock 저장소에 저장했습니다.');}}>저장</Button>
            <Button type="primary" size="small" icon={<CloudDownloadOutlined/>} disabled={!snapshot} onClick={()=>openGenerator(selection?.kind==='component'?selection.id:'all')}>코드 골격 생성</Button>
            <Dropdown menu={{items:[
              {key:'export',label:'프로젝트 JSON 내보내기',icon:<DownloadOutlined/>,onClick:exportJson},
              {key:'import',label:'프로젝트 JSON 가져오기',icon:<UploadOutlined/>,onClick:()=>jsonInputRef.current?.click()},
              {type:'divider'},
              {key:'reset',label:'ICD 예제 초기화',danger:true,icon:<ReloadOutlined/>,onClick:()=>Modal.confirm({title:'ICD 예제 데이터 다시 적용',content:'저장된 변경 사항을 삭제하고 예제 데이터를 재설정합니다.',okText:'초기화',cancelText:'취소',onOk:async()=>{await reset();message.success('초기화했습니다.');}})},
            ]}}><Button size="small">프로젝트 관리 ···</Button></Dropdown>
          </Space>
        </Flex>
      </Header>
      {!snapshot || loading ? <Content className="loading-content"><Spin size="large" tip="Mock 프로젝트 로딩 중"><div style={{ width: 300, height: 160 }}/></Spin></Content> : <StudioShell
        explorer={<>
          <StudioNavigator onNewComponent={()=>setComponentModal(true)} onNewService={()=>setServiceModal(true)} onCreate={kind=>kind==='component'?setComponentModal(true):kind==='service'?setServiceModal(true):setCreateKind(kind)}/>
          <div className="side-footer"><Text type="secondary">Project 편집 가능 · 표준 ICD 읽기 전용</Text><br/><Text type="secondary" style={{fontSize:11}}>{canUseLocalStorage?'브라우저 Mock 저장소 · JSON 백업 지원':'localStorage 제한 · JSON 백업 권장'}</Text></div>
        </>}
        workbench={<WorkspaceWorkbench onNewComponent={()=>setComponentModal(true)} onNewService={()=>setServiceModal(true)} onGenerate={openGenerator} onCreate={setCreateKind}/>}
        bottomPanel={<BottomPanel/>}
        properties={<>
          {selection?.kind==='component'?<JourneyGuide onGenerate={openGenerator}/>:<ContextProperties/>}
          {(!selection||['diagram','build'].includes(selection.kind))&&<><Divider style={{margin:'10px 0'}}/>
            <div className="project-settings"><Text strong>빌드 대상 / DDS 설정</Text>
              <div style={{marginTop:10}}><Text type="secondary">운영체제</Text><Select style={{width:'100%',marginTop:4}} value={snapshot.project.targetPlatform} onChange={changePlatform} options={[{label:'Linux (.so)',value:'linux'},{label:'Windows (.dll)',value:'windows'}]}/></div>
              <div style={{marginTop:10}}><Text type="secondary">DDS Vendor</Text><Select style={{width:'100%',marginTop:4}} value={snapshot.project.ddsVendor} onChange={changeVendor} options={[{label:'eProsima Fast DDS',value:'fastdds'},{label:'RTI Connext DDS',value:'connext'}]}/></div>
              <div style={{marginTop:14}}><Badge status={issues.some(i=>i.severity==='error')?'error':issues.length?'warning':'success'} text={<Text type="secondary">정적 검사 {issues.filter(i=>i.severity==='error').length} errors / {issues.filter(i=>i.severity==='warning').length} warnings</Text>}/></div>
            </div></>}
        </>}
      />}
    </Layout>
    <Modal title="새 Component 만들기" open={componentModal} okText="생성하고 시작" destroyOnClose onCancel={() => setComponentModal(false)} onOk={async () => {
            try {
                const v = await componentForm.validateFields();
                const id=addComponent(v.name,v.templateId);
                if(!id){message.error('동일한 이름의 Component가 있거나 올바르지 않습니다.');return;}
                setComponentModal(false);
                componentForm.resetFields();
                message.success('Component를 만들었습니다. 이제 서비스를 조립하세요.');
            }
            catch { /* validation */ }
        }}><div className="journey-helper" style={{marginBottom:16}}>새 컴포넌트를 빈 상태로 시작하거나 기존 컴포넌트의 서비스 구성을 복사할 수 있습니다. 원본 Service 계약은 복제·변경되지 않습니다.</div><Form form={componentForm} layout="vertical"><Form.Item name="name" label="Component 이름" rules={[{ required: true, message: '이름을 입력하세요' }]}><Input placeholder="My Autopilot"/></Form.Item><Form.Item name="templateId" label="서비스 구성 가져오기 (선택)"><Select allowClear placeholder="빈 Component로 시작" options={(snapshot?.components??[]).map(c=>({value:c.id,label:`${c.name} · ${snapshot.bindings.filter(b=>b.componentId===c.id).length}개 서비스`}))}/></Form.Item></Form></Modal>
    <AddCustomServiceModal open={serviceModal} onClose={() => setServiceModal(false)}/>
    <GenerationPanel open={generationOpen} initialComponentId={generationTarget} onClose={() => setGenerationOpen(false)}/>
    <Modal title={createKind==='area'?'사용자 정의 Functional Area':createKind==='topic'?'DDS Topic 추가':createKind==='topicDataType'?'Topic용 Data Type 추가':createKind==='type'?'공통 Data Type 추가':'DDS QoS Profile 추가'}
      open={!!createKind} onCancel={()=>{setCreateKind(null);createForm.resetFields();}} okText="추가" destroyOnClose onOk={async()=>{
        try{
          const v=await createForm.validateFields();
          const ok=createKind==='area'?addFunctionalArea(v.code,v.name):createKind==='type'?addDataType(v.name,v.typeKind):createKind==='topicDataType'?addStandaloneDataType(v.name):createKind==='topic'?addStandaloneTopic(v.name,v.typeId):addQosProfile(v.name);
          if(!ok){message.error('중복된 이름 또는 잘못된 값입니다.');return;}
          createForm.resetFields();setCreateKind(null);message.success('Project Extension에 추가했습니다.');
        }catch{}
      }}>
      <Alert type="info" showIcon style={{marginBottom:12}} message="공식 UMAA Catalog는 변경하지 않습니다." description="사용자가 만든 영역·타입·QoS Profile은 프로젝트 확장 항목이며, 표준 UMAA 명세로 표시하지 않습니다."/>
      <Form form={createForm} layout="vertical" key={createKind} initialValues={{typeKind:'struct'}}>
        {createKind==='area'&&<Form.Item label="영역 코드" name="code" rules={[{required:true},{pattern:/^[A-Za-z][A-Za-z0-9_]{1,11}$/}]}><Input placeholder="SF"/></Form.Item>}
        <Form.Item label={createKind==='area'?'영역 이름':['type','topicDataType'].includes(createKind)?'Data Type 이름':createKind==='topic'?'Topic 이름':'QoS Profile 이름'} name="name" rules={[{required:true}]}><Input placeholder={createKind==='area'?'Sensor Fusion':['type','topicDataType'].includes(createKind)?'FusionMeasurementType':createKind==='topic'?'FusionMeasurementTopic':'LowLatencyReliable'}/></Form.Item>
        {createKind==='topic'&&<Form.Item label="Data Type" name="typeId" rules={[{required:true}]}><Select showSearch optionFilterProp="label" options={(snapshot?.messages??[]).filter(m=>m.source==='custom').map(m=>({label:`${m.namespace}::${m.name}`,value:m.id}))}/></Form.Item>}
        {createKind==='type'&&<Form.Item label="Type Kind" name="typeKind"><Select options={[{label:'Struct',value:'struct'},{label:'Enum',value:'enum'}]}/></Form.Item>}
      </Form>
    </Modal>
  </ConfigProvider>;
}
