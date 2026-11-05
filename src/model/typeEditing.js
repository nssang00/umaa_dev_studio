/** Editable project overrides for ICD-derived mock types. The bundled reference catalog stays untouched.
 * All helpers return a new workspace or null when the requested edit is invalid. */
import { effectiveTypeFields } from './mockIdlCatalog.js';
import { isValidIdlName } from './workspaceSchema.js';
const listKey = kind => kind === 'message' ? 'messages' : kind === 'dataType' ? 'dataTypes' : null;
const qualify = t => `${t.namespace}::${t.name}`;
const validBase = (workspace, current, value) => {
  if (!value || value === current.baseType) return true;
  const types = [...workspace.messages, ...workspace.dataTypes];
  let next = types.find(x => qualify(x) === value);
  if (!next || next.kind === 'enum' || next.id === current.id) return false;
  const seen = new Set([current.id]);
  while (next) {
    if (seen.has(next.id)) return false;
    seen.add(next.id);
    next = types.find(x => qualify(x) === next.baseType);
  }
  return true;
};
function edited(t) {
  if (t.source === 'custom' || t.projectOverride) return { ...t };
  return { ...t, projectOverride: true, mockBaseline: {
    name: t.name, baseType: t.baseType ?? null,
    fields: structuredClone(t.fields ?? []), members: structuredClone(t.members ?? [])
  } };
}
function change(workspace, kind, id, fn) {
  const key = listKey(kind);
  const type = key && workspace[key]?.find(t => t.id === id);
  if (!type) return null;
  const result = fn(type);
  if (!result) return null;
  return { ...workspace, [key]: workspace[key].map(t => t.id === id ? result : t) };
}
const validField = f => isValidIdlName(f.name) && String(f.type ?? '').trim() && !(f.key && f.optional);
export function editTypeField(workspace, kind, id, action, payload = {}) {
  return change(workspace, kind, id, t => {
    const isEnum = t.kind === 'enum';
    const entries = isEnum ? (t.members ?? []).map(name => ({name, type:'enumerator'})) : t.fields ?? [];
    const old = entries.find(f => f.name === payload.originalName);
    if (action !== 'add' && !old) return null;
    if (!['add', 'update', 'remove'].includes(action)) return null;
    if (action === 'remove') {
      if (isEnum && entries.length <= 1) return null;
      const result = edited(t);
      if (isEnum) result.members = t.members.filter(v => v !== payload.originalName);
      else result.fields = entries.filter(f => f.name !== payload.originalName);
      return result;
    }
    const field = isEnum ? {name:String(payload.name??'').trim(),type:'enumerator'} : {
      name:String(payload.name??'').trim(),type:String(payload.type??'').trim(),
      key:!!payload.key, optional:!!payload.optional
    };
    if (!validField(field)) return null;
    if (entries.some(f => f.name === field.name && (action === 'add' || f.name !== payload.originalName))) return null;
    if (!isEnum) {
      const inherited = effectiveTypeFields(workspace, t).filter(f => f.inherited);
      if (inherited.some(f => f.name === field.name)) return null;
    }
    const result = edited(t);
    if (isEnum) result.members = action === 'add' ? [...(t.members??[]),field.name] : t.members.map(v=>v===payload.originalName?field.name:v);
    else result.fields = action === 'add' ? [...entries,field] : entries.map(f=>f.name===payload.originalName?{...f,...field}:f);
    return result;
  });
}
function replaceReferences(workspace, oldName, oldQualified, nextName, nextQualified, sourceNamespace) {
  function changeType(t) {
    const baseType=t.baseType === oldQualified ? nextQualified : t.baseType;
    const fields=(t.fields ?? []).map(f => ({...f,type:f.type === oldQualified ? nextQualified :
      (f.type === oldName && t.namespace === sourceNamespace ? nextName : f.type)}));
    if(baseType===t.baseType && fields.every((f,i)=>f.type===t.fields[i].type))return t;
    return {...edited(t),baseType,fields};
  }
  return {...workspace, messages:workspace.messages.map(changeType),dataTypes:workspace.dataTypes.map(changeType)};
}

export function editTypeDefinition(workspace, kind, id, patch = {}) {
  const key = listKey(kind);
  const type = key && workspace[key]?.find(t=>t.id===id);
  if (!type) return null;
  const name = String(patch.name ?? type.name).trim();
  const baseType = type.kind === 'enum' ? null : (patch.baseType ?? null);
  if (!isValidIdlName(name) || !validBase(workspace,type,baseType)) return null;
  if ([...workspace.messages,...workspace.dataTypes].some(t=>t.id!==id && t.namespace===type.namespace && t.name===name)) return null;
  const result = change(workspace,kind,id,t=>({...edited(t),name,baseType}));
  if (!result || name === type.name) return result;
  return replaceReferences(result,type.name,qualify(type),name,`${type.namespace}::${name}`,type.namespace);
}
export function restoreTypeMock(workspace, kind, id) {
  const key=listKey(kind), type=key&&workspace[key]?.find(t=>t.id===id);
  if (!type || type.source==='custom' || !type.projectOverride || !type.mockBaseline) return null;
  const baseline=type.mockBaseline;
  const reverted=change(workspace,kind,id,t=>{
    const next={...t,name:baseline.name,baseType:baseline.baseType,
      fields:structuredClone(baseline.fields),members:structuredClone(baseline.members)};
    delete next.projectOverride; delete next.mockBaseline;
    return next;
  });
  return baseline.name===type.name ? reverted : replaceReferences(reverted,type.name,qualify(type),baseline.name,`${type.namespace}::${baseline.name}`,type.namespace);
}
