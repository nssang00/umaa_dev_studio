import { useEffect, useMemo, useState } from 'react';
import { Alert, Button, Divider, Drawer, Empty, Select, Space, Tag, Typography, message } from 'antd';
import { DownloadOutlined, FileTextOutlined } from '@ant-design/icons';
import JSZip from 'jszip';
import { generateAllComponentFiles, generateComponentFiles, componentBuildSummary } from '../logic/codegen.js';
import { validateWorkspace } from '../logic/validation.js';
import { useEditorStore } from '../stores/useEditorStore.js';
const { Text } = Typography;
export function GenerationPanel({ open, onClose, initialComponentId = 'all' }) {
    const snapshot = useEditorStore(x => x.snapshot);
    const [componentId, setComponentId] = useState('all');
    const [activeFile, setActiveFile] = useState();
    useEffect(()=>{if(open)setComponentId(initialComponentId);},[open,initialComponentId]);
    const [busy, setBusy] = useState(false);
    const errors = useMemo(() => snapshot ? validateWorkspace(snapshot).filter(v => v.severity === 'error') : [], [snapshot]);
    const files = useMemo(() => {
        if (!snapshot || errors.length)
            return [];
        try {
            return componentId === 'all' ? generateAllComponentFiles(snapshot) : generateComponentFiles(snapshot, componentId);
        }
        catch {
            return [];
        }
    }, [snapshot, errors.length, componentId]);
    useEffect(() => { setActiveFile(files[0]?.path); }, [componentId, snapshot, open]);
    const codeFile = files.find(f => f.path === activeFile) ?? files[0];
    const download = async () => {
        if (!snapshot || errors.length)
            return;
        setBusy(true);
        try {
            const zip = new JSZip();
            for (const f of files)
                zip.file(f.path, f.content);
            const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
            const url = URL.createObjectURL(blob);
            const el = document.createElement('a');
            el.href = url;
            el.download = componentId === 'all' ? 'umaa-components-mock.zip' : `umaa-${componentId}-mock.zip`;
            document.body.appendChild(el);
            el.click();
            el.remove();
            setTimeout(() => URL.revokeObjectURL(url), 1000);
            message.success('Mock C++ 프로젝트 파일을 내려받았습니다.');
        }
        catch (e) {
            message.error(e instanceof Error ? e.message : 'ZIP 생성 오류');
        }
        finally {
            setBusy(false);
        }
    };
    return <Drawer title="Component 코드 골격 생성" width={760} open={open} onClose={onClose}>
    <Alert type="warning" showIcon message="Mock 코드 생성기" description="CMake로 빌드 가능한 DLL/SO 골격과 Custom IDL, DDS Endpoint 명세를 만듭니다. 실제 DDS 메시지 송수신, 표준 IDL 타입 코드 및 UMAA 적합성은 구현되지 않았습니다." style={{ marginBottom: 18 }}/>
    <Space style={{ width: '100%' }} align="start">
      <div style={{ minWidth: 280 }}>
        <Text strong>생성 대상</Text>
        <Select style={{ width: '100%', marginTop: 8 }} value={componentId} onChange={setComponentId} options={[
            { label: '전체 Component', value: 'all' },
            ...(snapshot?.components ?? []).map(c => ({ label: c.name, value: c.id })),
        ]}/>
      </div>
      <Button type="primary" icon={<DownloadOutlined />} disabled={Boolean(errors.length || !files.length)} loading={busy} onClick={download} style={{ marginTop: 27 }}>코드 골격 ZIP 다운로드</Button>
    </Space>
    <div style={{ marginTop: 14 }}><Text type="secondary">{snapshot && componentId !== 'all' ? componentBuildSummary(snapshot, componentId) : `${snapshot?.components.length ?? 0}개 Component · ${files.length}개 생성 파일`}</Text></div>
    {errors.length > 0 && <Alert showIcon type="error" style={{ marginTop: 14 }} message={`${errors.length}개 모델 오류로 생성을 차단했습니다.`} description={errors.map(e => e.message).join(' / ')}/>}
    <Divider orientation="left">생성 파일 미리보기 <Tag>{files.length}</Tag></Divider>
    {files.length === 0 ? <Empty description="생성할 파일이 없습니다."/> : <>
      <Select showSearch optionFilterProp="label" style={{ width: '100%' }} value={codeFile?.path} onChange={setActiveFile} options={files.map(f => ({ label: f.path, value: f.path }))}/>
      <div className="file-preview-heading"><FileTextOutlined /> {codeFile?.path}</div>
      <pre className="code-preview">{codeFile?.content}</pre>
    </>}
  </Drawer>;
}
