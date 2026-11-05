import { useEffect, useMemo, useRef, useState } from 'react';
import { Button, Space, Tag, Tooltip, Typography } from 'antd';
import { CaretDownOutlined, CaretUpOutlined } from '@ant-design/icons';
import { useEditorStore } from '../stores/useEditorStore.js';
import { validateWorkspace } from '../logic/validation.js';

const { Text } = Typography;
/** Text-only diagnostic panel; no workbench or domain editing controls. */
export function BottomPanel() {
  const snapshot = useEditorStore(s => s.snapshot);
  const selection = useEditorStore(s => s.selection);
  const dirty = useEditorStore(s => s.dirty);
  const [collapsed, setCollapsed] = useState(true);
  const [tab, setTab] = useState('output');
  const [events, setEvents] = useState([]);
  const seq = useRef(0);
  const issues = useMemo(() => snapshot ? validateWorkspace(snapshot) : [], [snapshot]);
  const selectionKey = selection ? `${selection.kind}:${selection.id}${selection.fieldName ? '.' + selection.fieldName : ''}` : '';
  useEffect(() => {
    if (!snapshot) return;
    seq.current += 1;
    setEvents(previous => [...previous, { id: seq.current, text: `[INFO] Explorer selection: ${selectionKey || 'none'}` }].slice(-80));
  }, [snapshot?.project.id, selectionKey]);

  return <section className={`bottom-panel log-only-panel${collapsed ? ' is-collapsed' : ''}`} aria-label="Output / Console">
    <div className="log-panel-header">
      <Space size={6}>
        <Button type="text" size="small" className={tab === 'output' ? 'log-active-tab' : ''} onClick={() => { setCollapsed(false); setTab('output'); }}>OUTPUT {issues.length > 0 && <Tag color="orange">{issues.length}</Tag>}</Button>
        <Button type="text" size="small" className={tab === 'console' ? 'log-active-tab' : ''} onClick={() => { setCollapsed(false); setTab('console'); }}>CONSOLE</Button>
      </Space>
      <Space size={8}>
        <Text type="secondary" className="log-mode-caption">{tab === 'output' ? 'Static validation / diagnostic messages' : 'Local UI events (not DDS runtime)'}</Text>
        {tab === 'console' && !collapsed && <Button type="text" size="small" onClick={() => setEvents([])}>Clear</Button>}
        <Tooltip title={collapsed ? 'Console 펼치기' : 'Console 접기'}>
          <Button type="text" size="small" className="log-console-toggle"
            icon={collapsed ? <CaretUpOutlined /> : <CaretDownOutlined />}
            aria-label={collapsed ? 'Console 펼치기' : 'Console 접기'}
            aria-expanded={!collapsed} aria-controls="studio-console-content"
            onClick={() => setCollapsed(value => !value)} />
        </Tooltip>
      </Space>
    </div>
    {!collapsed && <div id="studio-console-content" className="log-stream" role="log" aria-label={tab === 'output' ? 'Output log' : 'Console log'}>
      {tab === 'output' ? <>
        <div className="log-line"><span className="log-info">[INFO]</span> UMAA Studio · model validation (mock schema, not compliance certification)</div>
        {issues.length === 0 ? <div className="log-line"><span className="log-success">[OK]</span> No static validation issues.</div>
          : issues.map((issue, i) => <div className="log-line" key={`${issue.code}-${i}`}><span className={issue.severity === 'error' ? 'log-error' : 'log-warn'}>[{issue.severity.toUpperCase()}]</span> {issue.code}: {issue.message}</div>)}
        <div className="log-line"><span className="log-info">[INFO]</span> {snapshot?.components.length ?? 0} components · {snapshot?.messages.length ?? 0} message types · {dirty ? 'unsaved project changes' : 'no pending project changes'}</div>
      </> : events.length ? events.map(item => <div className="log-line" key={item.id}>{item.text}</div>) : <div className="log-line log-muted">Console cleared. Waiting for local UI events.</div>}
    </div>}
  </section>;
}
