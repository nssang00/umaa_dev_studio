/**
 * Curated examples from UMAA 6.0 ICDs and Component Definitions v1.0.
 * This is a PARTIAL model: operation names/topics are cross-checked, but IDL
 * fields are hydrated from selected ICD attribute tables as MOCK examples.
 * They are not the original official IDL source. ServiceInterface entries are tool
 * navigation groupings, NOT independently published normative UMAA interfaces.
 */
import { upgradeWorkspace } from './workspaceSchema.js';
const state = {
    project: {
        id: 'demo-usv', name: 'UMAA 6.0 Autopilot Component Reference Assembly', standardVersion: 'UMAA 6.0',
        targetPlatform: 'linux', ddsVendor: 'fastdds',
    },
    functionalAreas: [
        { id: 'MM', name: 'Mission Management', icd: 'UMAA-SPEC-MMICD-v6.0' },
        { id: 'MO', name: 'Maneuver Operations', icd: 'UMAA-SPEC-MOICD-v6.0' },
        { id: 'EO', name: 'Engineering Operations', icd: 'UMAA-SPEC-EOICD-v6.0' },
        { id: 'SEM', name: 'Sensor and Effector Management', icd: 'UMAA-SPEC-SEMICD-v6.0' },
        { id: 'CO', name: 'Communications Operations', icd: 'UMAA-SPEC-COICD-v6.0' },
        { id: 'SA', name: 'Situational Awareness', icd: 'UMAA-SPEC-SAICD-v6.0' },
        { id: 'PO', name: 'Processing Operations', icd: 'No separate public ICD verified' },
        { id: 'SO', name: 'Support Operations', icd: 'UMAA-SPEC-SOICD-v6.0' },
    ],
    components: [
        { id: 'nav', name: 'USV Navigation', description: 'GlobalPose/Speed/Velocity 상태 보고 (공개 참조 컴포넌트)' },
        { id: 'autopilot', name: 'Autopilot', description: 'Component Definitions v1.0 §3.1.3의 7 Provider / 7 Consumer 전체 Service 바인딩' },
        { id: 'mission', name: 'Mission Executor', description: '임무 관리, 기동 명령 소비 및 상태 서비스 소비' },
        { id: 'weather', name: 'Weather', description: 'WindStatus 제공 (공개 참조 컴포넌트)' },
        { id: 'water', name: 'Water Environment', description: 'WaterCurrentStatus 제공 (공개 참조 컴포넌트)' },
        { id: 'logging', name: 'Logging', description: 'LogReport Consumer 전용 컴포넌트 예시' },
        { id: 'colregs', name: 'COLREGS and Hazard Avoidance', description: '기동·항법 서비스 제공/소비 참조 구성' },
    ],
    services: [], operations: [], interfaces: [], topics: [], messages: [], topicRelations: [],
    bindings: [], connections: [], positions: {},
};
function service(name, area, flow, description) {
    const id = `svc-${name}`;
    const ns = `UMAA::${area}::${name}`;
    const svc = { id, name, functionalArea: area, namespace: ns, source: 'standard', version: '6.0', flowControl: flow, description };
    state.services.push(svc);
    state.interfaces.push({ id: `if-${name}`, serviceId: id,
        name: `${name} Svc IF · InterfaceBlock`,
        description: 'ICD Service Operation 전체를 묶는 InterfaceBlock 탐색 투영. 공식 SysML/SoaML 모델의 고유 식별자는 포함하지 않습니다.', operationIds: [] });
    return id;
}
function topic(serviceId, name) {
    const topicId = `topic-${serviceId}-${name}`;
    if (state.topics.some(t => t.id === topicId))
        return topicId;
    const svc = state.services.find(s => s.id === serviceId);
    const typeId = `type-${serviceId}-${name}`;
    state.messages.push({ id: typeId, name, namespace: svc.namespace, source: 'standard', fields: [],
        externalIdlPath: `${svc.functionalArea} ICD 6.0 official IDL: ${svc.namespace}::${name}` });
    state.topics.push({ id: topicId, name, messageTypeId: typeId });
    return topicId;
}
function op(serviceId, name, topicName, action, actor, optionalConsumer = false) {
    const tid = topic(serviceId, topicName);
    const id = `op-${serviceId}-${name}`;
    const item = { id, serviceId, name, topicId: tid, action, actor, ...(optionalConsumer ? { optionalConsumer } : {}) };
    state.operations.push(item);
    state.interfaces.find(i => i.serviceId === serviceId).operationIds.push(id);
}
function status(name, area, report, reportType, query, description) {
    const id = service(name, area, 'request-reply', description);
    op(id, report, reportType, 'publish', 'provider');
    op(id, query, reportType, 'subscribe', 'consumer');
    return id;
}
function command(name, area, prefix, description) {
    const id = service(name, area, 'command-response', description);
    op(id, `set${prefix}`, `${prefix}CommandType`, 'publish', 'consumer');
    op(id, `report${prefix}CommandStatus`, `${prefix}CommandStatusType`, 'publish', 'provider');
    op(id, `report${prefix}CommandAck`, `${prefix}CommandAckReportType`, 'publish', 'provider', true);
    op(id, `report${prefix}ExecutionStatus`, `${prefix}ExecutionStatusReportType`, 'publish', 'provider', true);
    op(id, `query${prefix}CommandAck`, `${prefix}CommandAckReportType`, 'subscribe', 'consumer', true);
    op(id, `query${prefix}ExecutionStatus`, `${prefix}ExecutionStatusReportType`, 'subscribe', 'consumer', true);
    op(id, `cancel${prefix}Command`, `${prefix}CommandType`, 'dispose', 'consumer');
    return id;
}
// SA / request-reply: no separate query message on the DDS bus.
status('GlobalPoseStatus', 'SA', 'reportGlobalPose', 'GlobalPoseReportType', 'queryGlobalPose', '전역 위치 및 자세 정보');
status('SpeedStatus', 'SA', 'reportSpeed', 'SpeedReportType', 'querySpeed', '자함 순간 속력');
status('VelocityStatus', 'SA', 'reportVelocity', 'VelocityReportType', 'queryVelocity', '선속도 및 회전각속도');
status('WindStatus', 'SA', 'reportWind', 'WindReportType', 'queryWind', '풍향·풍속 정보');
status('WaterCurrentStatus', 'SA', 'reportWaterCurrent', 'WaterCurrentReportType', 'queryWaterCurrent', '해류 상태');
// SO / request-reply.
status('HealthReport', 'SO', 'reportHealth', 'HealthReportType', 'queryHealth', '자원·코드 건강 상태');
status('LogReport', 'SO', 'reportLogReport', 'LogReportType', 'queryLogReport', '운용 로그 보고');
// EO / two report operations in one service.
const platform = service('UVPlatformSpecs', 'EO', 'request-reply', '자함 운용능력 및 물리적 제원');
for (const [verb, type, query] of [
    ['reportUVPlatformCapabilities', 'UVPlatformCapabilitiesReportType', 'queryUVPlatformCapabilities'],
    ['reportUVPlatformSpecs', 'UVPlatformSpecsReportType', 'queryUVPlatformSpecs'],
]) {
    op(platform, verb, type, 'publish', 'provider');
    op(platform, query, type, 'subscribe', 'consumer');
}
// MM / large set (metadata topic + element topic); no fictitious query topic.
const conditional = status('ConditionalReport', 'MM', 'reportConditional', 'ConditionalReportType', 'queryConditional', '미션 조건 집합, Large Set으로 표현');
const elementTopic = topic(conditional, 'ConditionalReportTypeConditionalsSetElement');
state.topicRelations.push({ id: 'rel-conditional-large-set', kind: 'large-set-element',
    parentTopicId: topic(conditional, 'ConditionalReportType'), relatedTopicId: elementTopic,
    description: 'ConditionalReportType.conditionals Large Set의 요소 Topic. Metadata/Element의 동기화 규칙은 ICD 3.8 참조.' });
// MM / Autopilot provider — exactly three published Topic types.
// ActiveConstraintsControl does not define an ExecutionStatus topic.
const active = service('ActiveConstraintsControl', 'MM', 'command-response', '활성 제약조건 설정; MM ICD 6.1.1 (Command, Status, Ack)');
op(active, 'setActiveConstraints', 'ActiveConstraintsCommandType', 'publish', 'consumer');
op(active, 'reportActiveConstraintsCommandStatus', 'ActiveConstraintsCommandStatusType', 'publish', 'provider');
op(active, 'reportActiveConstraintsCommandAck', 'ActiveConstraintsCommandAckReportType', 'publish', 'provider', true);
op(active, 'queryActiveConstraintsCommandAck', 'ActiveConstraintsCommandAckReportType', 'subscribe', 'consumer', true);
op(active, 'cancelActiveConstraintsCommand', 'ActiveConstraintsCommandType', 'dispose', 'consumer');
// MM / Autopilot consumer — two independent Command/Response flows (Add, Delete).
// There is no single generic MissionPlanConstraintCommandType topic.
const constraints = service('MissionPlanConstraintControl', 'MM', 'command-response', '임무계획 제약조건 추가/삭제; MM ICD 6.1.4 (Add/Delete 별개 메시지)');
for (const suffix of ['Add', 'Delete']) {
    const prefix = `MissionPlanConstraint${suffix}`;
    op(constraints, `set${prefix}`, `${prefix}CommandType`, 'publish', 'consumer');
    op(constraints, `report${prefix}CommandStatus`, `${prefix}CommandStatusType`, 'publish', 'provider');
    op(constraints, `report${prefix}CommandAck`, `${prefix}CommandAckReportType`, 'publish', 'provider', true);
    op(constraints, `query${prefix}CommandAck`, `${prefix}CommandAckReportType`, 'subscribe', 'consumer', true);
    op(constraints, `cancel${prefix}Command`, `${prefix}CommandType`, 'dispose', 'consumer');
}
// MO / command-response, with distinct Command, Status, Ack and Execution topics.
command('GlobalVectorControl', 'MO', 'GlobalVector', '전역 벡터 기동 명령 및 상태');
command('GlobalHoverControl', 'MO', 'GlobalHover', '위치·반경 유지 명령 및 상태');
command('PrimitiveDriverControl', 'MO', 'PrimitiveDriver', '6자유도 노력(Effort) 기반 직접 기동 제어; MO ICD 6.1.7');
function bind(componentId, name, role) {
    const id = `bind-${componentId}-${name}-${role}`;
    state.bindings.push({ id, componentId, serviceId: `svc-${name}`, role });
    return id;
}
const p = (c, s) => bind(c, s, 'provider');
const u = (c, s) => bind(c, s, 'consumer');
function connect(providerId, consumerId, name) {
    const from = state.bindings.find(b => b.componentId === providerId && b.serviceId === `svc-${name}` && b.role === 'provider');
    const to = state.bindings.find(b => b.componentId === consumerId && b.serviceId === `svc-${name}` && b.role === 'consumer');
    if (!from || !to)
        throw new Error(`Invalid mock wiring: ${name} ${providerId}→${consumerId}`);
    state.connections.push({ id: `conn-${name}-${providerId}-${consumerId}`, providerBindingId: from.id, consumerBindingId: to.id });
}
// Selected reference bindings (NOT a complete copy of every public component's definition).
for (const s of ['GlobalPoseStatus', 'SpeedStatus', 'VelocityStatus']) {
    p('nav', s);
    for (const c of ['autopilot', 'mission', 'colregs']) {
        u(c, s);
        connect('nav', c, s);
    }
}
for (const [name, provider] of [['WindStatus', 'weather'], ['WaterCurrentStatus', 'water']]) {
    p(provider, name);
    for (const consumer of ['autopilot', 'mission']) {
        u(consumer, name);
        connect(provider, consumer, name);
    }
}
for (const name of ['GlobalVectorControl', 'GlobalHoverControl']) {
    p('autopilot', name);
    u('mission', name);
    connect('autopilot', 'mission', name);
}
u('colregs', 'GlobalHoverControl');
connect('autopilot', 'colregs', 'GlobalHoverControl');
p('autopilot', 'UVPlatformSpecs');
for (const c of ['mission', 'colregs']) {
    u(c, 'UVPlatformSpecs');
    connect('autopilot', c, 'UVPlatformSpecs');
}
p('mission', 'ConditionalReport');
for (const c of ['autopilot', 'colregs']) {
    u(c, 'ConditionalReport');
    connect('mission', c, 'ConditionalReport');
}
u('logging', 'LogReport');
for (const c of ['nav', 'autopilot', 'mission', 'weather', 'water', 'colregs']) {
    p(c, 'LogReport');
    connect(c, 'logging', 'LogReport');
}
// Autopilot Component Definitions v1.0 §3.1.3: exactly 7 Provider + 7 Consumer.
// The other mock components are partial and only supply enough peers for examples.
p('autopilot', 'ActiveConstraintsControl');
u('mission', 'ActiveConstraintsControl');
connect('autopilot', 'mission', 'ActiveConstraintsControl');
p('autopilot', 'PrimitiveDriverControl'); // no matching consumer defined in this demo
p('mission', 'MissionPlanConstraintControl');
u('autopilot', 'MissionPlanConstraintControl');
connect('mission', 'autopilot', 'MissionPlanConstraintControl');
// HealthReport is intentionally modelled with no consumer; not every publisher needs a wired subscriber.
for (const c of ['nav', 'autopilot', 'mission'])
    p(c, 'HealthReport');
export const seedWorkspace = upgradeWorkspace(state);
