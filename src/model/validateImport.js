import { seedWorkspace } from './seed.js';
import { upgradeWorkspace } from './workspaceSchema.js';
/** Defensive parsing for a user-selected JSON file (not a UMAA semantic compliance check). */
export function parseWorkspaceImport(value) {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
        throw new Error('프로젝트 JSON 객체가 아닙니다.');
    }
    const r = value;
    const project = r.project;
    if (!project || typeof project !== 'object' ||
        typeof project.id !== 'string' || typeof project.name !== 'string' ||
        typeof project.standardVersion !== 'string' ||
        !['linux', 'windows'].includes(String(project.targetPlatform)) ||
        !['fastdds', 'connext'].includes(String(project.ddsVendor))) {
        throw new Error('프로젝트 설정이 올바르지 않습니다.');
    }
    for (const k of ['components', 'services', 'operations', 'topics', 'messages', 'bindings', 'connections']) {
        if (!Array.isArray(r[k]))
            throw new Error(`${k} 배열이 없습니다.`);
    }
    if (!r.positions || typeof r.positions !== 'object' || Array.isArray(r.positions)) {
        throw new Error('노드 위치 정보가 없습니다.');
    }
    const rows = (key) => r[key];
    for (const k of ['components', 'services', 'operations', 'topics', 'messages', 'bindings', 'connections']) {
        for (const entry of rows(k)) {
            if (!entry || typeof entry !== 'object' || typeof entry.id !== 'string') {
                throw new Error(`${k}에 잘못된 항목이 포함되어 있습니다.`);
            }
        }
    }
    for (const entry of rows('messages')) {
        if (!Array.isArray(entry.fields))
            throw new Error('Message Type의 fields가 올바르지 않습니다.');
    }
    for (const entry of rows('bindings')) {
        if (typeof entry.componentId !== 'string' || typeof entry.serviceId !== 'string' ||
            !['provider', 'consumer'].includes(String(entry.role))) {
            throw new Error('Service Binding 정의가 올바르지 않습니다.');
        }
    }
    for (const entry of rows('operations')) {
        if (typeof entry.serviceId !== 'string' || typeof entry.topicId !== 'string' ||
            !['publish', 'subscribe', 'dispose'].includes(String(entry.action))) {
            throw new Error('Operation 정의가 올바르지 않습니다.');
        }
    }
    const legacy = value;
    const functionalAreas = Array.isArray(r.functionalAreas) ? legacy.functionalAreas : structuredClone(seedWorkspace.functionalAreas);
    const interfaces = Array.isArray(r.interfaces) ? legacy.interfaces : legacy.services.map(s => ({
        id: `if-${s.id}`, serviceId: s.id, name: `${s.name} · Operation Interface`,
        description: '기존 프로젝트로부터 복원한 도구 내 Operation 탐색 그룹',
        operationIds: legacy.operations.filter(o => o.serviceId === s.id).map(o => o.id),
    }));
    const topicRelations = Array.isArray(r.topicRelations) ? legacy.topicRelations : [];
    // Defensive structural check only. Business consistency is validated separately.
    return upgradeWorkspace({ ...legacy, functionalAreas, interfaces, topicRelations });
}
