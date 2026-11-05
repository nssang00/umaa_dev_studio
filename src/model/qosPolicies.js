/**
 * A small, explicitly curated DDS QoS DESIGN catalog (not a vendor or OMG
 * DDS-JSON schema). Section and policy boundaries are also used by the editor.
 * Every editable value has a type contract and a persistable default.
 */
const choice = (key, label, values, initial) => ({
  key, label, type: 'select',
  options: values.map(value => ({ value, label: value })),
  defaultValue: initial,
});
const bool = (key, label, initial = false) => ({ key, label, type: 'boolean', defaultValue: initial });
const num = (key, label, initial, min = 0, nullable = false) => ({
  key, label, type: 'number', defaultValue: initial, min, nullable,
});
const str = (key, label, initial = '') => ({ key, label, type: 'text', defaultValue: initial });
const policy = (key, label, fields) => ({ key, label, fields });

const reliability = () => policy('reliability', 'Reliability', [
  choice('kind', 'Reliability kind', ['reliable', 'best_effort'], 'reliable'),
]);
const durability = () => policy('durability', 'Durability', [
  choice('kind', 'Durability kind', ['volatile', 'transient_local', 'transient', 'persistent'], 'volatile'),
]);
const history = () => policy('history', 'History', [
  choice('kind', 'History kind', ['keep_last', 'keep_all'], 'keep_last'),
  num('depth', 'History depth', 10, 1),
]);
const deadline = () => policy('deadline', 'Deadline', [
  num('period_ms', 'Period (ms; empty = unspecified)', null, 0, true),
]);
const presentation = () => policy('presentation', 'Presentation', [
  choice('access_scope', 'Access scope', ['instance', 'topic', 'group'], 'topic'),
  bool('ordered_access', 'Ordered access'),
  bool('coherent_access', 'Coherent access'),
]);

export const QOS_SECTION_CATALOG = Object.freeze([
  { key: 'domain_participant_qos', label: 'Domain Participant QoS', policies: [
    policy('user_data', 'User data', [str('value', 'Value (text)')]),
    policy('entity_factory', 'Entity factory', [bool('autoenable_created_entities', 'Auto-enable created entities', true)]),
  ]},
  { key: 'topic_qos', label: 'Topic QoS', policies: [
    durability(), reliability(), history(), deadline(),
    policy('ownership', 'Ownership', [choice('kind', 'Ownership kind', ['shared', 'exclusive'], 'shared')]),
  ]},
  { key: 'publisher_qos', label: 'Publisher QoS', policies: [
    presentation(), policy('partition', 'Partition', [str('names', 'Names (comma-separated)')]),
    policy('group_data', 'Group data', [str('value', 'Value (text)')]),
  ]},
  { key: 'subscriber_qos', label: 'Subscriber QoS', policies: [
    presentation(), policy('partition', 'Partition', [str('names', 'Names (comma-separated)')]),
    policy('group_data', 'Group data', [str('value', 'Value (text)')]),
  ]},
  { key: 'datawriter_qos', label: 'DataWriter QoS', policies: [
    durability(), reliability(), history(), deadline(),
    policy('liveliness', 'Liveliness', [
      choice('kind', 'Liveliness kind', ['automatic', 'manual_by_participant', 'manual_by_topic'], 'automatic'),
      num('lease_duration_ms', 'Lease duration (ms; empty = unspecified)', null, 0, true),
    ]),
    policy('ownership_strength', 'Ownership strength', [num('value', 'Strength', 0)]),
  ]},
  { key: 'datareader_qos', label: 'DataReader QoS', policies: [
    durability(), reliability(), history(), deadline(),
    policy('time_based_filter', 'Time-based filter', [
      num('minimum_separation_ms', 'Minimum separation (ms)', 0),
    ]),
  ]},
]);

export const QOS_SECTION_KEYS = Object.freeze(QOS_SECTION_CATALOG.map(section => section.key));
const isRecord = value => value !== null && typeof value === 'object' && !Array.isArray(value);

function legacyValue(profile, section, policyKey, fieldKey) {
  if (!['topic_qos', 'datawriter_qos', 'datareader_qos'].includes(section)
    && !['publisher_qos', 'subscriber_qos'].includes(section)) return undefined;
  const old = {
    reliability: { kind: profile.reliability },
    durability: { kind: profile.durability },
    history: { kind: profile.historyKind, depth: profile.historyDepth },
    presentation: {
      access_scope: profile.presentationAccessScope,
      ordered_access: profile.orderedAccess,
      coherent_access: profile.coherentAccess,
    },
  };
  const eligible = ['publisher_qos', 'subscriber_qos'].includes(section)
    ? policyKey === 'presentation'
    : ['reliability', 'durability', 'history'].includes(policyKey);
  return eligible ? old[policyKey]?.[fieldKey] : undefined;
}

export function isValidQosFieldValue(definition, value) {
  if (!definition) return false;
  if (definition.type === 'text') return typeof value === 'string' && value.length <= 8192;
  if (definition.type === 'boolean') return typeof value === 'boolean';
  if (definition.type === 'number') {
    return value === null ? !!definition.nullable
      : Number.isSafeInteger(value) && value >= (definition.min ?? 0);
  }
  if (definition.type === 'select') return definition.options.some(option => option.value === value);
  return false;
}

/** Merge defaults into an old profile without destroying unknown existing data.
 * New entity-specific values always take priority over migrated legacy fields.
 */
export function withQosEntitySections(profile) {
  const result = { ...profile };
  for (const section of QOS_SECTION_CATALOG) {
    const previous = isRecord(profile[section.key]) ? profile[section.key] : {};
    const next = { ...previous };
    for (const p of section.policies) {
      const existing = isRecord(previous[p.key]) ? previous[p.key] : {};
      const merged = { ...existing };
      for (const field of p.fields) {
        if (Object.prototype.hasOwnProperty.call(existing, field.key)) continue;
        const oldValue = legacyValue(profile, section.key, p.key, field.key);
        merged[field.key] = isValidQosFieldValue(field, oldValue) ? oldValue : field.defaultValue;
      }
      next[p.key] = merged;
    }
    result[section.key] = next;
  }
  return result;
}

/** Atomic, typed, targeted update. Returns null for invalid or missing inputs. */
export function editQosEntityField(workspace, profileId, sectionKey, policyKey, fieldKey, value) {
  const section = QOS_SECTION_CATALOG.find(item => item.key === sectionKey);
  const policyDef = section?.policies.find(item => item.key === policyKey);
  const fieldDef = policyDef?.fields.find(item => item.key === fieldKey);
  const profile = workspace?.qosProfiles?.find(item => item.id === profileId);
  if (!profile || profile.source !== 'project' || !isValidQosFieldValue(fieldDef, value)) return null;
  const original = withQosEntitySections(profile);
  if (original[sectionKey][policyKey][fieldKey] === value) return workspace;
  const next = {
    ...original,
    [sectionKey]: {
      ...original[sectionKey],
      [policyKey]: { ...original[sectionKey][policyKey], [fieldKey]: value },
    },
  };
  return {
    ...workspace,
    qosProfiles: workspace.qosProfiles.map(item => item.id === profileId ? next : item),
  };
}

export function findInvalidQosEntityValues(profile) {
  const errors = [];
  for (const section of QOS_SECTION_CATALOG) {
    const values = profile?.[section.key];
    if (!values) continue;
    for (const p of section.policies) {
      if (!values[p.key]) continue;
      for (const field of p.fields) {
        const value = values[p.key][field.key];
        if (!isValidQosFieldValue(field, value))
          errors.push(section.key + '.' + p.key + '.' + field.key);
      }
    }
  }
  return errors;
}
