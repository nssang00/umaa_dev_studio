import { withMockIdlTypes } from './mockIdlCatalog.js';
/** Project extensions and DDS runtime configuration are deliberately separate from
 * the immutable, curated UMAA standard catalog. This is a UI/model schema, not
 * a claim that official IDL files or DDS middleware are bundled. */
export const DEFAULT_QOS_PROFILE = {
  id: 'qos-project-default', name: 'Project Default', source: 'project',
  reliability: 'reliable', durability: 'volatile', historyKind: 'keep_last',
  historyDepth: 10, libraryName:'Project QoS', baseProfileId:null, presentationAccessScope:'topic', orderedAccess:false, coherentAccess:false, note: 'Example QoS; validate actual matching and ICD constraints before deployment.',
};
export const defaultRuntime = () => ({
  domainId: 0, partition: '', qosProfileId: DEFAULT_QOS_PROFILE.id,
  sourceGuid: '', destinationGuid: '', commandArbitration: 'user-implementation',
  artifact: 'shared-library', hostMode: 'shared-process',
});
export function upgradeWorkspace(value) {
  const s = structuredClone(value);
  s.schemaVersion = 3;
  s.functionalAreas = (s.functionalAreas ?? []).map(x => ({ ...x, source: x.source || 'standard' }));
  s.dataTypes ??= [];
  s.qosProfiles ??= [structuredClone(DEFAULT_QOS_PROFILE)];
  s.qosProfiles = s.qosProfiles.map(q=>({libraryName:'Project QoS',baseProfileId:null,presentationAccessScope:'topic',orderedAccess:false,coherentAccess:false,...q}));
  if (!s.qosProfiles.some(q => q.id === DEFAULT_QOS_PROFILE.id)) s.qosProfiles.unshift(structuredClone(DEFAULT_QOS_PROFILE));
  s.componentRuntime ??= {};
  s.behaviorDiagrams ??= {};
  for (const c of s.components ?? []) {
    s.componentRuntime[c.id] = { ...defaultRuntime(), ...s.componentRuntime[c.id] };
  }
  return withMockIdlTypes(s);
}
export const isValidIdlName = value => /^[A-Za-z_][A-Za-z0-9_]*$/.test(value);
