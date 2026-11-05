import { Badge, Divider, Select, Typography } from 'antd';
import { JourneyGuide } from './JourneyGuide.jsx';
import { ContextProperties } from './ContextProperties.jsx';

/** Public props are supplied by the app composer; feature editors remain independent. */
export function SelectionPropertiesPanel({
  selection, project, issues = [], onGenerate, onChangePlatform, onChangeVendor,
}) {
  return <>
    {selection?.kind === 'component' ? <JourneyGuide onGenerate={onGenerate}/> : <ContextProperties/>}
    {(!selection || ['diagram', 'build'].includes(selection.kind)) && <>
      <Divider style={{ margin: '10px 0' }}/>
      <div className="project-settings">
        <Typography.Text strong>빌드 대상 / DDS 설정</Typography.Text>
        <div style={{ marginTop: 10 }}>
          <Typography.Text type="secondary">운영체제</Typography.Text>
          <Select style={{ width: '100%', marginTop: 4 }} value={project?.targetPlatform} onChange={onChangePlatform}
            options={[{ label: 'Linux (.so)', value: 'linux' }, { label: 'Windows (.dll)', value: 'windows' }]}/>
        </div>
        <div style={{ marginTop: 10 }}>
          <Typography.Text type="secondary">DDS Vendor</Typography.Text>
          <Select style={{ width: '100%', marginTop: 4 }} value={project?.ddsVendor} onChange={onChangeVendor}
            options={[{ label: 'eProsima Fast DDS', value: 'fastdds' }, { label: 'RTI Connext DDS', value: 'connext' }]}/>
        </div>
        <div style={{ marginTop: 14 }}>
          <Badge status={issues.some(i => i.severity === 'error') ? 'error' : issues.length ? 'warning' : 'success'}
            text={<Typography.Text type="secondary">정적 검사 {issues.filter(i => i.severity === 'error').length} errors / {issues.filter(i => i.severity === 'warning').length} warnings</Typography.Text>}/>
        </div>
      </div>
    </>}
  </>;
}
