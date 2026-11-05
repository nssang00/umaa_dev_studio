/** UMAA 6.0 ICD terminology and *Studio* projections.
 * Service Category is a UI classification inferred from ICD naming convention, not
 * a normative mandatory UMAA enumeration. Flow Control and data patterns are distinct.
 * References: UMAA 6.0 ICD §3.4, §3.8, §3.9, §5.1, §5.2, §6.1.
 */
export const SERVICE_CATEGORIES = [
  {value:'control',label:'Control'},
  {value:'config',label:'Config'},
  {value:'specs',label:'Specs'},
  {value:'status-report',label:'Status / Report'},
  {value:'other',label:'Other'},
];
export const FLOW_CONTROLS = [
  {value:'command-response',label:'Command / Response'},
  {value:'request-reply',label:'Request / Reply'},
];
export const TOPIC_RELATION_KINDS = [
  {value:'large-set-element',label:'Large Set — Metadata / Element'},
  {value:'large-list-element',label:'Large List — Metadata / Element'},
  {value:'specialization',label:'Generalization / Specialization'},
];
export function categoryForService(service) {
  if (!service) return 'other';
  if (SERVICE_CATEGORIES.some(c=>c.value===service.serviceCategory)) return service.serviceCategory;
  const n=String(service.name??'');
  if(/(Status|Report)$/i.test(n)) return 'status-report';
  if(/Specs$/i.test(n)) return 'specs';
  if(/Config$/i.test(n)) return 'config';
  if(/Control$/i.test(n)) return 'control';
  return 'other';
}
export function categoryLabel(service) {
  return SERVICE_CATEGORIES.find(x=>x.value===categoryForService(service))?.label??'Other';
}
export function flowLabel(flow) {
  return FLOW_CONTROLS.find(x=>x.value===flow)?.label??'Not specified';
}
export function operationPurpose(op) {
  if (!op) return 'Operation';
  if (/^report/.test(op.name)) {
    return /CommandStatus|ExecutionStatus|CancelCommandStatus/.test(op.name)
      ? 'Status Report Operation' : /CommandAck/.test(op.name)
      ? 'Command Ack Report Operation' : 'Report Operation';
  }
  if (/^query/.test(op.name)) return 'Query Operation';
  if (/^cancel/.test(op.name)) return 'Cancel Operation';
  return /^(set|add|delete|start|stop|update)/.test(op.name)?'Command Operation':'Operation';
}
export function serviceFlowProjection(snapshot, serviceId) {
  const service=snapshot.services.find(x=>x.id===serviceId);
  const operations=snapshot.operations.filter(op=>op.serviceId===serviceId).map(op=>{
    const topic=snapshot.topics.find(t=>t.id===op.topicId);
    const type=snapshot.messages.find(m=>m.id===topic?.messageTypeId);
    return {...op,purpose:operationPurpose(op),topicName:topic?.name??null,dataTypeName:type?.name??null};
  });
  return {service,category:categoryForService(service),flowControl:service?.flowControl,operations,
    reports:operations.filter(op=>op.name.startsWith('report')),
    commands:operations.filter(op=>op.action==='publish'&&op.actor==='consumer'),
    queries:operations.filter(op=>op.action==='subscribe'),
    disposes:operations.filter(op=>op.action==='dispose')};
}
export const isLargeCollection = r => ['large-set-element','large-list-element'].includes(r?.kind);
export const isSpecialization = r => r?.kind==='specialization';
