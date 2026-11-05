import { useMemo } from 'react';
import { Alert, Input, Select, Typography } from 'antd';
import { Background, Controls, ReactFlow } from '@xyflow/react';
import { useEditorStore } from '../stores/useEditorStore.js';
import { QosEntitySections } from './QosEntitySections.jsx';
const { Text } = Typography;

function QosProfileNode({ data }) {
  const { profile, profiles, onMetaChange, onPolicyChange } = data;
  return <section className="qos-profile-editor-node nodrag nowheel nopan"
    aria-label={'QoS Profile ' + profile.name}
    onWheel={event => event.stopPropagation()} onPointerDown={event => event.stopPropagation()}>
    <header className="qos-profile-editor-head">
      <Text type="secondary">qos_profile</Text>
      <h3>{profile.name}</h3>
      <div className="qos-profile-meta-grid">
        <label>QoS Library
          <Input className="nodrag nopan" size="small" value={profile.libraryName ?? ''}
            onChange={event => onMetaChange({libraryName:event.target.value})}/>
        </label>
        <label>Base Profile (reference only)
          <Select className="nodrag nopan" size="small" allowClear value={profile.baseProfileId ?? undefined}
            placeholder="None" onChange={value => onMetaChange({baseProfileId:value ?? null})}
            options={profiles.filter(item => item.id !== profile.id)
              .map(item => ({value:item.id,label:item.name}))}/>
        </label>
      </div>
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
    draggable: false, selectable: false,
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
      <ReactFlow key={profileId} nodes={nodes} edges={[]} nodeTypes={nodeTypes}
        fitView fitViewOptions={{padding:0.08}} minZoom={0.35} maxZoom={1.5}
        nodesDraggable={false} nodesConnectable={false} elementsSelectable={false}
        zoomOnScroll={false} panOnScroll={false} proOptions={{hideAttribution:true}}>
        <Background gap={18} color="#d6e3ef"/><Controls showInteractive={false}/>
      </ReactFlow>
    </div>
    <Alert style={{marginTop:12}} type="info" showIcon message="설계용 QoS 설정"
      description="정책 항목은 편집 가능한 설계 데이터입니다. 표준 DDS-JSON 전체 스키마, 엔터티 생성·배포, Requested/Offered 검증 및 벤더별 적용을 보증하지 않습니다."/>
  </div>;
}
