import { Typography } from 'antd';

/** Composable inspector frame; feature-specific controls are passed as children. */
export function ModelPropertiesPanel({eyebrow,title,className='',children}) {
  return <div className={['inspector','context-properties',className].filter(Boolean).join(' ')}>
    {eyebrow&&<Typography.Text type="secondary" className="side-label">{eyebrow}</Typography.Text>}
    <h3>{title}</h3>
    {children}
  </div>;
}
