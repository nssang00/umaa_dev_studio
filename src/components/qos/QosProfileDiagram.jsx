import { useMemo } from 'react';
import { Alert, Typography } from 'antd';
import { ModelGraphCanvas } from '../shared/graph/ModelGraphCanvas.jsx';
import { useEditorStore } from '../../stores/useEditorStore.js';
import { QosEntitySections } from '../QosEntitySections.jsx';
import { QosProfileFields } from '../QosProfileFields.jsx';
const { Text } = Typography;

function QosProfileNode({ data }) {
  const { profile, profiles, onMetaChange, onPolicyChange } = data;
  return <section className="qos-profile-editor-node nodrag nowheel nopan"
    aria-label={'QoS Profile ' + profile.name}
    onWheel={event => event.stopPropagation()}>
    <header className="qos-profile-editor-head">
      <Text type="secondary">qos_profile</Text>
      <h3>{profile.name}</h3>
      <QosProfileFields profile={profile} profiles={profiles} onMetaChange={onMetaChange}/>
    </header>
    <QosEntitySections key={profile.id} profile={profile} onChange={onPolicyChange}/>
    <div className="qos-profile-node-foot">정책값은 Profile에 저장됩니다. DDS Runtime 적용 및 호환성 검증은 별도입니다.</div>
  </section>;
}
const nodeTypes = { qosProfile: QosProfileNode };

/** Single React Flow diagram with an editable, nested QoS profile node. */
export function QosProfileDiagram({ profileId }) {
  const snapshot = useEditorStore(state => state.snapshot);
  const updateProfile = useEditorStore(state => state.updateQosProfile);
  const updateEntity = useEditorStore(state => state.updateQosEntityField);
  const profile = snapshot?.qosProfiles.find(item => item.id === profileId);
  const nodes = useMemo(() => profile ? [{
    id: 'profile:' + profile.id, type: 'qosProfile', position: {x:0,y:0},
    draggable: false, selectable: false, focusable: false,
    // React Flow v12 sets pointer-events:none when neither selectable nor
    // draggable. Override the wrapper style so nested Ant Design controls work.
    style: { pointerEvents: 'all' },
    data: {
      profile, profiles: snapshot.qosProfiles,
      onMetaChange: patch => updateProfile(profileId, patch),
      onPolicyChange: (section, policy, field, value) =>
        updateEntity(profileId, section, policy, field, value),
    },
  }] : [], [profile, snapshot?.qosProfiles, profileId, updateProfile, updateEntity]);
  if (!profile) return <Alert type="warning" message="QoS Profile을 찾지 못했습니다."/>;
  return <div className="qos-profile-diagram">
    <Text type="secondary">하나의 Profile 노드 안에서 섹션과 Policy를 순서대로 펼쳐 값을 편집합니다.</Text>
    <div className="qos-profile-canvas">
      <ModelGraphCanvas graphKey={profileId} nodes={nodes} edges={[]} nodeTypes={nodeTypes}
        fitView fitViewOptions={{padding:0.08}} minZoom={0.35} maxZoom={1.5}
        nodesDraggable={false} nodesConnectable={false} elementsSelectable={false}
        nodesFocusable={false} panOnDrag={false} zoomOnDoubleClick={false}
        zoomOnScroll={false} panOnScroll={false} backgroundColor="#d6e3ef"/>
    </div>
    <Alert style={{marginTop:12}} type="info" showIcon message="설계용 QoS 설정"
      description="정책 항목은 편집 가능한 설계 데이터입니다. 표준 DDS-JSON 전체 스키마, 엔터티 생성·배포, Requested/Offered 검증 및 벤더별 적용을 보증하지 않습니다."/>
  </div>;
}
