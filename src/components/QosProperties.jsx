import { Divider, Tag, Typography, message } from 'antd';
import { useEditorStore } from '../stores/useEditorStore.js';
import { QosEntitySections } from './QosEntitySections.jsx';
import { QosProfileFields } from './QosProfileFields.jsx';
const { Text } = Typography;

/** The diagram and Properties share the same Profile and narrow store actions. */
export function QosProperties({ snapshot, profile }) {
  const updateProfile = useEditorStore(state => state.updateQosProfile);
  const updatePolicy = useEditorStore(state => state.updateQosEntityField);
  const updateMeta = patch => {
    if (!updateProfile(profile.id, patch))
      message.error('QoS 상위 Profile 참조 또는 설정을 확인하세요.');
  };
  const updateField = (section, policy, field, value) => {
    if (!updatePolicy(profile.id, section, policy, field, value))
      message.error('QoS 입력값이 유효하지 않습니다.');
  };
  return <div className="inspector context-properties qos-properties">
    <Text className="side-label" type="secondary">QOS PROFILE PROPERTIES</Text>
    <h3>{profile.name}</h3>
    <Tag color="purple">Project QoS Profile</Tag>
    <div className="qos-properties-metadata">
      <QosProfileFields profile={profile} profiles={snapshot.qosProfiles} onMetaChange={updateMeta}/>
    </div>
    <Divider style={{margin:'14px 0 10px'}}/>
    <Text strong>Entity QoS Policies</Text>
    <Text type="secondary" className="small-hint">섹션과 정책을 펼쳐 값을 편집하세요. 다이어그램과 동일한 Profile에 즉시 반영됩니다.</Text>
    <QosEntitySections key={profile.id} profile={profile} onChange={updateField}/>
    <Text type="secondary" className="small-hint">
      프로젝트 저장 시 변경값이 보존됩니다. DDS 벤더 적용 및 Requested/Offered 호환성 검사는 별도입니다.
    </Text>
  </div>;
}
