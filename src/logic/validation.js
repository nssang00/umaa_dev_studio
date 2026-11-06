import { isLargeCollection, isSpecialization } from '../model/icdConcepts.js';
import { findInvalidQosEntityValues } from '../model/qosPolicies.js';
import { configuredEndpoints } from '../model/endpointConfiguration.js';
import { INTERFACE_DIRECTIONS } from '../model/interfaceDirection.js';
import { ddsDesignPreflight } from './ddsDesignPreflight.js';
export function validateWorkspace(s) {
    const issues = [];
    const error = (code, message, entityId) => issues.push({ severity: 'error', code, message, entityId });
    const warn = (code, message, entityId) => issues.push({ severity: 'warning', code, message, entityId });
    for (const b of s.bindings) {
        if (!s.components.some(c => c.id === b.componentId))
            error('MISSING_COMPONENT', `Binding ${b.id}의 Component가 없습니다.`, b.id);
        if (!s.services.some(v => v.id === b.serviceId))
            error('MISSING_SERVICE', `Binding ${b.id}의 Service가 없습니다.`, b.id);
    }
    for (const op of s.operations) {
        if(op.interfaceDirection===null || op.interfaceDirection===undefined)
            warn('INTERFACE_DIRECTION_UNSPECIFIED', `${op.name}: 계약 INPUT/OUTPUT 방향을 확인해야 합니다.`,op.id);
        else if(!INTERFACE_DIRECTIONS.includes(op.interfaceDirection))
            error('INVALID_INTERFACE_DIRECTION', `${op.name}: Interface 방향은 INPUT 또는 OUTPUT이어야 합니다.`,op.id);
        if (!s.services.some(v => v.id === op.serviceId))
            error('MISSING_SERVICE', `Operation ${op.name}의 Service가 없습니다.`, op.id);
        if (!s.topics.some(t => t.id === op.topicId))
            error('MISSING_TOPIC', `Operation ${op.name}의 Topic이 없습니다.`, op.id);
    }
    for (const i of s.interfaces ?? []) {
        if (!s.services.some(v => v.id === i.serviceId))
            error('MISSING_SERVICE', `Interface ${i.name}의 Service가 없습니다.`, i.id);
        for (const opId of i.operationIds) {
            if (!s.operations.some(o => o.id === opId && o.serviceId === i.serviceId))
                error('INVALID_INTERFACE_OPERATION', `${i.name}에 속한 Operation ${opId}가 유효하지 않습니다.`, i.id);
        }
    }
    for (const relation of s.topicRelations ?? []) {
        if (!s.topics.some(t => t.id === relation.parentTopicId) || !s.topics.some(t => t.id === relation.relatedTopicId)) {
            error('INVALID_TOPIC_RELATION', `Topic 관계 ${relation.id}가 유효하지 않습니다.`, relation.id);
        }
    }
    for (const t of s.topics) {
        if (!s.messages.some(m => m.id === t.messageTypeId))
            error('MISSING_TYPE', `Topic ${t.name}의 Message Type이 없습니다.`, t.id);
    }
    for (const svc of s.services) {
        if (!s.operations.some(o => o.serviceId === svc.id))
            error('EMPTY_SERVICE', `Service ${svc.name}에 Operation이 없습니다.`, svc.id);
    }
    for (const t of [...s.messages,...(s.dataTypes??[])].filter(t=>t.projectOverride)) {
        warn('ICD_MOCK_OVERRIDE', `${t.name}: 프로젝트에서 수정된 ICD Mock은 공식 IDL이 아닙니다.`,t.id);
    }
    for (const m of s.messages.filter(m => m.source === 'custom')) {
        if (m.fields.length === 0)
            error('EMPTY_MESSAGE', `Custom Message ${m.name}에 Field가 없습니다.`, m.id);
        const names = new Set();
        for (const field of m.fields) {
            if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(field.name))
                error('INVALID_FIELD', `${m.name}.${field.name}는 IDL 식별자로 적합하지 않습니다.`, m.id);
            if (names.has(field.name))
                error('DUPLICATE_FIELD', `${m.name}.${field.name} 필드가 중복되었습니다.`, m.id);
            names.add(field.name);
            if (field.key && field.optional)
                error('INVALID_KEY', `${m.name}.${field.name}는 Key와 Optional을 동시에 지정할 수 없습니다.`, m.id);
        }
    }
    const customTypes = (s.dataTypes ?? []).map(t => `${t.namespace}::${t.name}`);
    for (const type of s.dataTypes ?? []) {
        if (type.source !== 'custom') continue;
        if (type.kind === 'struct' && (!Array.isArray(type.fields) || !type.fields.length))
            error('EMPTY_CUSTOM_TYPE', `Custom Struct ${type.name}은 Field가 필요합니다.`, type.id);
        for (const f of type.kind === 'struct' ? (type.fields ?? []) : []) {
            if (f.key && f.optional) error('INVALID_KEY', `${type.name}.${f.name}는 Key와 Optional을 동시에 지정할 수 없습니다.`, type.id);
        }
        if (type.kind === 'enum' && (!Array.isArray(type.members) || !type.members.length))
            error('EMPTY_CUSTOM_ENUM', `Custom Enum ${type.name}은 Enumerator가 필요합니다.`, type.id);
    }
    for (const field of [...s.messages.filter(m=>m.source==='custom').flatMap(m=>m.fields), ...(s.dataTypes??[]).filter(t=>t.kind==='struct').flatMap(t=>t.fields)]) {
        if (typeof field.type==='string' && field.type.startsWith('ProjectCustom::Types::') && !customTypes.includes(field.type))
            error('MISSING_CUSTOM_TYPE', `필드가 찾을 수 없는 Custom Type ${field.type}을 참조합니다.`);
    }
    for(const profile of s.qosProfiles??[]) {
        for (const path of findInvalidQosEntityValues(profile)) error('QOS_POLICY_VALUE', `${profile.name}: 유효하지 않은 QoS 값 ${path}`, profile.id);
        if(profile.baseProfileId && !s.qosProfiles.some(q=>q.id===profile.baseProfileId))error('QOS_BASE_MISSING',`${profile.name}의 상위 QoS Profile이 없습니다.`,profile.id);
        if(profile.historyKind==='keep_last' && (!Number.isInteger(profile.historyDepth)||profile.historyDepth<1))error('QOS_HISTORY',`${profile.name}의 History depth는 양의 정수여야 합니다.`,profile.id);
        if(profile.presentationAccessScope==='topic'&&profile.orderedAccess===true&&profile.coherentAccess===true)warn('QOS_VENDOR_CHECK',`${profile.name}의 Presentation 설정은 선택 DDS 벤더와 함께 검증하세요.`,profile.id);
    }
    for(const relation of s.topicRelations??[]) {
        if(isLargeCollection(relation)) {
            const collectionTopic=s.topics.find(t=>t.id===relation.parentTopicId),elementTopic=s.topics.find(t=>t.id===relation.relatedTopicId);
            if(collectionTopic&&elementTopic){
                const contentType=s.messages.find(m=>m.id===collectionTopic.messageTypeId);
                const elementType=s.messages.find(m=>m.id===elementTopic.messageTypeId);
                if(!contentType?.fields?.length||!elementType?.fields?.length)warn('COLLECTION_TYPE_REVIEW',`Large Collection의 Metadata / Element 정의가 비어 있습니다.`,relation.id);
                warn('COLLECTION_SYNC_TODO',`Large Collection ${collectionTopic.name} / ${elementTopic.name}: setID/listID·timestamp·순서 QoS 및 수신 동기화 로직 검증이 필요합니다.`,relation.id);
            }
        } else if(isSpecialization(relation)) {
            warn('SPECIALIZATION_SYNC_TODO',`Generalization/Specialization: specializationTopic·ID·Timestamp 동기화 구현이 필요합니다.`,relation.id);
        }
    }
    for (const component of s.components) {
        const runtime = s.componentRuntime?.[component.id];
        if (!runtime) continue;
        if (!s.qosProfiles?.some(q=>q.id===runtime.qosProfileId))
            error('MISSING_QOS', `${component.name}의 QoS Profile이 없습니다.`, component.id);
        if (!Number.isInteger(runtime.domainId) || runtime.domainId<0)
            error('INVALID_DOMAIN', `${component.name}의 DDS Domain ID가 유효하지 않습니다.`, component.id);
        if (runtime.commandArbitration==='user-implementation' && s.bindings.some(b=>b.componentId===component.id && b.role==='provider' && s.services.some(v=>v.id===b.serviceId && v.flowControl==='command-response')))
            warn('COMMAND_POLICY_TODO', `${component.name}의 Command 충돌 처리 구현 정책이 미확정입니다.`, component.id);
    }
    const validEndpointKeys=new Set(s.components.flatMap(c=>configuredEndpoints(s,c.id).map(e=>e.key)));
    for(const [key,config] of Object.entries(s.endpointConfigs??{})) {
        if(!validEndpointKeys.has(key))
            warn('ORPHAN_ENDPOINT_CONFIG', `더 이상 존재하지 않는 Endpoint 설정 ${key}입니다.`,key);
        if(!config || typeof config!=='object' || typeof config.qosProfileId!=='string' ||
            !s.qosProfiles?.some(q=>q.id===config.qosProfileId))
            error('ENDPOINT_QOS_MISSING', `Endpoint ${key}의 QoS Profile 참조가 유효하지 않습니다.`,key);
    }
    for (const c of s.connections) {
        const p = s.bindings.find(b => b.id === c.providerBindingId);
        const u = s.bindings.find(b => b.id === c.consumerBindingId);
        if (!p || !u)
            error('ORPHAN_CONNECTION', `연결 ${c.id}의 Binding이 없습니다.`, c.id);
        else if (p.role !== 'provider' || u.role !== 'consumer' || p.serviceId !== u.serviceId) {
            error('INVALID_CONNECTION', `연결 ${c.id}: 동일 Service의 Provider → Consumer만 허용합니다.`, c.id);
        }
    }
    for (const b of s.bindings.filter(b => b.role === 'consumer')) {
        if (!s.connections.some(c => c.consumerBindingId === b.id)) {
            const svc = s.services.find(v => v.id === b.serviceId);
            warn('UNCONNECTED_CONSUMER', `${svc?.name || b.serviceId} Consumer가 Provider에 연결되지 않았습니다.`, b.id);
        }
    }
    for (const b of s.bindings.filter(b => b.role === 'provider')) {
        if (!s.connections.some(c => c.providerBindingId === b.id)) {
            const svc = s.services.find(v => v.id === b.serviceId);
            warn('UNUSED_PROVIDER', `${svc?.name || b.serviceId} Provider에 연결된 Consumer가 없습니다.`, b.id);
        }
    }
    return [...issues,...ddsDesignPreflight(s)];
}
export function canConnect(s, sourceBindingId, targetBindingId) {
    const a = s.bindings.find(b => b.id === sourceBindingId);
    const b = s.bindings.find(b => b.id === targetBindingId);
    return Boolean(a && b && a.role === 'provider' && b.role === 'consumer' && a.serviceId === b.serviceId && a.componentId !== b.componentId && !s.connections.some(c => c.providerBindingId === a.id && c.consumerBindingId === b.id));
}
