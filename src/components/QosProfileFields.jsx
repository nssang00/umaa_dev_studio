import { Input, Select } from 'antd';

/** Shared Profile metadata fields for diagram node and Properties panel. */
export function QosProfileFields({ profile, profiles, onMetaChange }) {
  return <div className="qos-profile-meta-grid">
    <label>QoS Library
      <Input className="nodrag nopan" size="small" value={profile.libraryName ?? ''}
        onChange={event => onMetaChange({libraryName:event.target.value})}/>
    </label>
    <label>Base Profile (reference only)
      <Select className="nodrag nopan" size="small" allowClear
        value={profile.baseProfileId ?? undefined} placeholder="None"
        onChange={value => onMetaChange({baseProfileId:value ?? null})}
        options={profiles.filter(item => item.id !== profile.id)
          .map(item => ({value:item.id,label:item.name}))}/>
    </label>
  </div>;
}
