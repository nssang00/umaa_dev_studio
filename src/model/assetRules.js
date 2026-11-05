import { isValidIdlName } from './workspaceSchema.js';
import { SERVICE_CATEGORIES, TOPIC_RELATION_KINDS } from './icdConcepts.js';
export function canCreateTopic(snapshot,name,typeId) {
  const n=String(name??'').trim();
  const type=snapshot.messages.find(m=>m.id===typeId);
  return isValidIdlName(n)&&!!type && type.source==='custom' &&
    !snapshot.topics.some(t=>t.name.toLowerCase()===n.toLowerCase() && snapshot.messages.find(m=>m.id===t.messageTypeId)?.namespace===type.namespace);
}
export function canCreateTopicRelation(snapshot,kind,parentId,relatedId) {
  if(!TOPIC_RELATION_KINDS.some(x=>x.value===kind)||parentId===relatedId)return false;
  if(!snapshot.topics.some(t=>t.id===parentId)||!snapshot.topics.some(t=>t.id===relatedId))return false;
  if(snapshot.topicRelations?.some(r=>r.kind===kind&&r.parentTopicId===parentId&&r.relatedTopicId===relatedId))return false;
  const a=snapshot.topics.find(t=>t.id===parentId),b=snapshot.topics.find(t=>t.id===relatedId);
  return [a,b].every(t=>snapshot.messages.find(m=>m.id===t.messageTypeId)?.source==='custom');
}
export function canAssignServiceCategory(snapshot,serviceId,category) {
  return SERVICE_CATEGORIES.some(x=>x.value===category) && snapshot.services.some(s=>s.id===serviceId&&s.source==='custom');
}
export function isQosAncestor(profiles,profileId,candidateId) {
  const seen=new Set([profileId]);let current=profiles.find(p=>p.id===candidateId);
  while(current){if(seen.has(current.id))return true;seen.add(current.id);current=profiles.find(p=>p.id===current.baseProfileId);}
  return false;
}
