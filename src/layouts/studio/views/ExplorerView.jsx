import { Typography } from 'antd';
import { StudioNavigator } from '../../../components/StudioNavigator.jsx';
const { Text } = Typography;

/** Explorer view: a project tree plus storage / reference status, no domain logic. */
export function ExplorerView({canUseLocalStorage = true, ...navigatorProps}) {
  return <>
    <StudioNavigator {...navigatorProps}/>
    <div className="side-footer">
      <Text type="secondary">Project 편집 가능 · 표준 ICD 읽기 전용</Text>
      <br/>
      <Text type="secondary" style={{fontSize:11}}>
        {canUseLocalStorage
          ? '브라우저 Mock 저장소 · JSON 백업 지원'
          : 'localStorage 제한 · JSON 백업 권장'}
      </Text>
    </div>
  </>;
}
