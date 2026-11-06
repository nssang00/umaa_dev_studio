import { create } from 'zustand';
import { repository } from '../repository/mockRepository.js';
import { parseWorkspaceImport } from '../model/validateImport.js';
import { canConnect } from '../logic/validation.js';
import { ensureComponentPositions, layoutComponentPositions } from '../logic/layout.js';
import { uuid } from '../model/types.js';
import { defaultRuntime, isValidIdlName } from '../model/workspaceSchema.js';
import { editTypeField, editTypeDefinition, restoreTypeMock, editStructDefinition } from '../model/typeEditing.js';
import { canCreateTopic, canCreateTopicRelation, canAssignServiceCategory, isQosAncestor } from '../model/assetRules.js';
import { editQosEntityField, withQosEntitySections } from '../model/qosPolicies.js';
import { INTERFACE_DIRECTIONS, legacyDirectionFromName } from '../model/interfaceDirection.js';
import { editEndpointQosProfile, removeBindingEndpointConfigs } from '../model/endpointConfiguration.js';
const projectId = 'demo-usv';
const update = (set, transform) => {
    set(s => s.snapshot ? { snapshot: transform(s.snapshot), dirty: true } : {});
};
const makeField = (name, type, key = false) => ({ name, type, key, optional: false });
// Topology/port changes change the Dagre node sizes and ranks. Relayout together.
const updateTopology = (set, transform) => {
    set(s => {
        if (!s.snapshot)
            return {};
        const changed = transform(s.snapshot);
        return {
            snapshot: { ...changed, positions: layoutComponentPositions(changed) },
            dirty: true,
            layoutRevision: s.layoutRevision + 1,
        };
    });
};
export const useEditorStore = create((set, get) => ({
    snapshot: null,
    selection: null,
    journeyStep: 0,
    setJourneyStep(step) { set({ journeyStep: Math.max(0, Math.min(2, step)) }); },
    highlightedComponentId: null,
    loading: false,
    saving: false,
    dirty: false,
    layoutRevision: 0,
    autoLayout() {
        const snapshot = get().snapshot;
        if (!snapshot)
            return;
        set(s => ({
            snapshot: { ...snapshot, positions: layoutComponentPositions(snapshot) },
            layoutRevision: s.layoutRevision + 1,
            dirty: true,
        }));
    },
    async load() {
        set({ loading: true });
        try {
            const snapshot = ensureComponentPositions(await repository.load(projectId));
            set(s => ({ snapshot, dirty: false, selection: { kind: snapshot.components.length ? 'component' : 'diagram', id: snapshot.components.find(c => c.id === 'autopilot')?.id ?? snapshot.components[0]?.id ?? 'system' }, layoutRevision: s.layoutRevision + 1 }));
        }
        finally {
            set({ loading: false });
        }
    },
    async save() {
        const snapshot = get().snapshot;
        if (!snapshot)
            return;
        set({ saving: true });
        try {
            await repository.save(projectId, snapshot);
            set({ dirty: false });
        }
        finally {
            set({ saving: false });
        }
    },
    async reset() {
        set({ loading: true });
        try {
            const snapshot = ensureComponentPositions(await repository.reset(projectId));
            set(s => ({ snapshot, dirty: false, selection: { kind: snapshot.components.length ? 'component' : 'diagram', id: snapshot.components.find(c => c.id === 'autopilot')?.id ?? snapshot.components[0]?.id ?? 'system' }, layoutRevision: s.layoutRevision + 1 }));
        }
        finally {
            set({ loading: false });
        }
    },
    importSnapshot(value) {
        const snapshot = parseWorkspaceImport(value);
        set(s => ({ snapshot: ensureComponentPositions(structuredClone(snapshot)), dirty: true, selection: { kind: snapshot.components.length ? 'component' : 'diagram', id: snapshot.components[0]?.id ?? 'system' }, layoutRevision: s.layoutRevision + 1 }));
    },
    select(selection) { set({ selection, highlightedComponentId: null }); },
    highlightComponent(id) { set({ highlightedComponentId: id }); },
    addComponent(name, templateId = null) {
        const trimmed = String(name ?? '').trim();
        const snapshot = get().snapshot;
        if (!snapshot || !trimmed || snapshot.components.some(c => c.name.toLocaleLowerCase() === trimmed.toLocaleLowerCase())) return null;
        const component = { id: uuid(), name: trimmed, description: '', source: 'project' };
        // Template copies the roles, not the immutable standard service definitions.
        const copiedBindings = snapshot.bindings.filter(b => b.componentId === templateId)
            .map(b => ({ id: uuid(), componentId: component.id, serviceId: b.serviceId, role: b.role }));
        updateTopology(set, s => ({ ...s,
            components: [...s.components, component],
            bindings: [...s.bindings, ...copiedBindings],
            componentRuntime: { ...s.componentRuntime, [component.id]: defaultRuntime() },
        }));
        set({ selection: { kind: 'component', id: component.id }, journeyStep: 0 });
        return component.id;
    },
    updateComponent(componentId, patch) {
        const s = get().snapshot;
        const c = s?.components.find(x => x.id === componentId);
        if (!c) return false;
        const name = String(patch.name ?? c.name).trim();
        if (!name || s.components.some(x => x.id !== componentId && x.name.toLocaleLowerCase() === name.toLocaleLowerCase())) return false;
        update(set, old => ({ ...old, components: old.components.map(x => x.id === componentId ? {
            ...x, name, description: patch.description ?? x.description,
        } : x) }));
        return true;
    },
    addBinding(componentId, serviceId, role, options = {}) {
        const s = get().snapshot;
        if (!s || !s.components.some(c => c.id === componentId) || !s.services.some(v => v.id === serviceId))
            return false;
        if (s.bindings.some(b => b.componentId === componentId && b.serviceId === serviceId && b.role === role))
            return false;
        const binding = { id: uuid(), componentId, serviceId, role };
        updateTopology(set, old => ({ ...old, bindings: [...old.bindings, binding] }));
        if (!options.stayOnComponent) set({ selection: { kind: 'binding', id: binding.id } });
        return true;
    },
    removeBinding(bindingId, options = {}) {
        updateTopology(set, s => ({
            ...s,
            bindings: s.bindings.filter(b => b.id !== bindingId),
            connections: s.connections.filter(c => c.providerBindingId !== bindingId && c.consumerBindingId !== bindingId),
            endpointConfigs:removeBindingEndpointConfigs(s.endpointConfigs,bindingId),
        }));
        if (!options.stayOnComponent) set({ selection: null });
    },
    addFunctionalArea(code, name) {
        const s = get().snapshot;
        const id = String(code ?? '').trim().toUpperCase();
        const label = String(name ?? '').trim();
        if (!s || !/^[A-Z][A-Z0-9_]{1,11}$/.test(id) || !label || s.functionalAreas.some(a => a.id === id)) return false;
        update(set, old => ({ ...old, functionalAreas: [...old.functionalAreas, {
            id, name: label, icd: 'Project extension — not an official UMAA ICD', source: 'custom',
        }] }));
        set({ selection: { kind: 'functionalArea', id } });
        return true;
    },
    addStandaloneDataType(name) {
        const s=get().snapshot;
        const n=String(name??'').trim();
        if(!s||!isValidIdlName(n)||[...s.messages,...s.dataTypes].some(m=>m.namespace==='ProjectCustom::Types'&&m.name===n))return false;
        const item={id:uuid(),name:n,namespace:'ProjectCustom::Types',kind:'struct',source:'custom',fields:[]};
        update(set,old=>({...old,messages:[...old.messages,item]}));
        set({selection:{kind:'message',id:item.id}});return true;
    },
    addStandaloneTopic(name, messageTypeId) {
        const s=get().snapshot;
        if(!s||!canCreateTopic(s,name,messageTypeId))return false;
        const type=s.messages.find(m=>m.id===messageTypeId);
        const t={id:uuid(),name:String(name).trim(),namespace:type.namespace,source:'custom',messageTypeId};
        update(set,old=>({...old,topics:[...old.topics,t]}));
        set({selection:{kind:'topic',id:t.id}});return true;
    },
    updateStandaloneTopicType(id, typeId) {
        const s=get().snapshot;
        const t=s?.topics.find(x=>x.id===id&&x.source==='custom');
        const next=s?.messages.find(x=>x.id===typeId&&x.source==='custom');
        if(!t||!next||t.namespace!==next.namespace||s.operations.some(o=>o.topicId===id&&s.services.find(v=>v.id===o.serviceId)?.source==='standard'))return false;
        update(set,old=>({...old,topics:old.topics.map(x=>x.id===id?{...x,messageTypeId:typeId}:x)}));return true;
    },
    addTopicRelation(kind, parentTopicId, relatedTopicId) {
        const s=get().snapshot;
        if(!s||!canCreateTopicRelation(s,kind,parentTopicId,relatedTopicId))return false;
        const relation={id:uuid(),kind,parentTopicId,relatedTopicId,source:'custom',description:'Project-defined Topic relationship; validate against UMAA ICD and DDS runtime.'};
        update(set,old=>({...old,topicRelations:[...(old.topicRelations??[]),relation]}));
        set({selection:{kind:'dataPatterns',id:'project'}});return true;
    },
    removeTopicRelation(id) {
        const s=get().snapshot;
        if(!s?.topicRelations?.some(r=>r.id===id&&r.source==='custom'))return false;
        update(set,old=>({...old,topicRelations:old.topicRelations.filter(r=>r.id!==id)}));return true;
    },
    updateServiceCategory(serviceId, category) {
        const s=get().snapshot;
        if(!s||!canAssignServiceCategory(s,serviceId,category))return false;
        update(set,old=>({...old,services:old.services.map(s=>s.id===serviceId?{...s,serviceCategory:category}:s)}));return true;
    },
    updateStructDefinition(kind, typeId, patch) {
        const current=get().snapshot;
        const next=current&&editStructDefinition(current,kind,typeId,patch);
        if(!next)return false;
        if(next!==current)set({snapshot:next,dirty:true});
        return true;
    },
    applyTypeFieldEdit(kind, typeId, action, payload) {
        const s=get().snapshot;const next=s&&editTypeField(s,kind,typeId,action,payload);
        if(!next)return false;set({snapshot:next,dirty:true});return true;
    },
    updateTypeDefinition(kind,id,patch) {
        const s=get().snapshot;const next=s&&editTypeDefinition(s,kind,id,patch);
        if(!next)return false;set({snapshot:next,dirty:true});return true;
    },
    restoreTypeOverride(kind,id) {
        const s=get().snapshot;const next=s&&restoreTypeMock(s,kind,id);
        if(!next)return false;set({snapshot:next,dirty:true});return true;
    },
    addQosProfile(name) {
        const s = get().snapshot;
        const trimmed = String(name ?? '').trim();
        if (!s || !trimmed || s.qosProfiles.some(q => q.name.toLowerCase() === trimmed.toLowerCase())) return false;
        const profile = withQosEntitySections({ id: uuid(), name: trimmed, source: 'project', libraryName: 'Project QoS', baseProfileId: null, reliability: 'reliable', durability: 'volatile', historyKind: 'keep_last', historyDepth: 10, presentationAccessScope:'topic', orderedAccess:false, coherentAccess:false, note: 'User-defined DDS QoS configuration' });
        update(set, old => ({ ...old, qosProfiles: [...old.qosProfiles, profile] }));
        set({ selection: { kind: 'qos', id: profile.id } });
        return true;
    },
    updateQosProfile(id, patch) {
        const s=get().snapshot,profile=s?.qosProfiles.find(q=>q.id===id);
        if(!profile||profile.source!=='project')return false;
        if('baseProfileId' in patch && patch.baseProfileId && (!s.qosProfiles.some(q=>q.id===patch.baseProfileId)||isQosAncestor(s.qosProfiles,id,patch.baseProfileId)))return false;
        if('historyDepth' in patch && (!Number.isInteger(patch.historyDepth)||patch.historyDepth<1))return false;
        update(set,old=>({...old,qosProfiles:old.qosProfiles.map(q=>q.id===id?{...q,...patch}:q)}));return true;
    },
    updateQosEntityField(profileId, sectionKey, policyKey, fieldKey, value) {
        const snapshot = get().snapshot;
        const next = snapshot && editQosEntityField(snapshot, profileId, sectionKey, policyKey, fieldKey, value);
        if (!next) return false;
        if (next !== snapshot) set({ snapshot: next, dirty: true });
        return true;
    },
    updateEndpointQosProfile(componentId, key, qosProfileId) {
        const snapshot=get().snapshot;
        const next=snapshot&&editEndpointQosProfile(snapshot,componentId,key,qosProfileId);
        if(!next)return false;
        if(next!==snapshot)set({snapshot:next,dirty:true});
        return true;
    },
    updateComponentRuntime(id, patch) {
        update(set, old => ({ ...old, componentRuntime: { ...old.componentRuntime,
            [id]: { ...defaultRuntime(), ...old.componentRuntime[id], ...patch } } }));
    },
    addDataType(name, kind = 'struct') {
        const s = get().snapshot;
        const trimmed = String(name ?? '').trim();
        if (!s || !isValidIdlName(trimmed) || !['struct','enum'].includes(kind) ||
            s.dataTypes.some(t => t.name.toLowerCase() === trimmed.toLowerCase()) ||
            s.messages.some(t => t.name.toLowerCase() === trimmed.toLowerCase())) return false;
        const type = { id: uuid(), name: trimmed, kind, namespace: 'ProjectCustom::Types', source: 'custom',
            fields: kind === 'struct' ? [makeField('value', 'double')] : [],
            members: kind === 'enum' ? ['UNKNOWN'] : [] };
        update(set, old => ({ ...old, dataTypes: [...old.dataTypes, type] }));
        set({ selection: { kind: 'dataType', id: type.id } });
        return true;
    },
    // v0.8.3 editor uses these generic actions for ICD-derived mock project overrides.
    // Custom-only legacy field actions remain for backwards compatibility.
    addDataTypeField(typeId, name, type, options = {}) {
        const s = get().snapshot;
        const obj = s?.dataTypes.find(t => t.id === typeId && t.kind === 'struct' && t.source === 'custom');
        if (!obj || !isValidIdlName(name) || !String(type??'').trim() || (options.key && options.optional) || obj.fields.some(f => f.name === name)) return false;
        update(set, old => ({ ...old, dataTypes: old.dataTypes.map(t => t.id === typeId ? { ...t, fields: [...t.fields, { ...makeField(name, type), key: !!options.key, optional: !!options.optional }] } : t) }));
        return true;
    },
    updateDataTypeField(typeId, originalName, patch) {
        const s=get().snapshot;
        const t=s?.dataTypes.find(t=>t.id===typeId && t.kind==='struct' && t.source==='custom');
        if(!t || !t.fields.some(f=>f.name===originalName) || !isValidIdlName(patch.name) || !String(patch.type??'').trim() || (patch.key && patch.optional) || t.fields.some(f=>f.name===patch.name && f.name!==originalName)) return false;
        update(set,old=>({...old,dataTypes:old.dataTypes.map(t=>t.id===typeId?{...t,fields:t.fields.map(f=>f.name===originalName?{...f,...patch}:f)}:t)}));
        return true;
    },
    removeDataTypeField(typeId, name) {
        const s=get().snapshot;
        if(!s?.dataTypes.some(t=>t.id===typeId&&t.source==='custom'&&t.kind==='struct')) return false;
        update(set,old=>({...old,dataTypes:old.dataTypes.map(t=>t.id===typeId?{...t,fields:t.fields.filter(f=>f.name!==name)}:t)}));
        return true;
    },
    updateEnumMember(typeId, originalName, name) {
        const s=get().snapshot;
        const t=s?.dataTypes.find(t=>t.id===typeId&&t.kind==='enum'&&t.source==='custom');
        if(!t || !t.members.includes(originalName) || !isValidIdlName(name) || t.members.some(v=>v===name&&v!==originalName)) return false;
        update(set,old=>({...old,dataTypes:old.dataTypes.map(t=>t.id===typeId?{...t,members:t.members.map(x=>x===originalName?name:x)}:t)}));
        return true;
    },
    removeEnumMember(typeId, name) {
        const s=get().snapshot;
        const t=s?.dataTypes.find(t=>t.id===typeId&&t.kind==='enum'&&t.source==='custom');
        if(!t || !t.members.includes(name) || t.members.length<=1) return false;
        update(set,old=>({...old,dataTypes:old.dataTypes.map(t=>t.id===typeId?{...t,members:t.members.filter(x=>x!==name)}:t)}));
        return true;
    },
    addEnumMember(typeId, name) {
        const s = get().snapshot;
        const obj = s?.dataTypes.find(t => t.id === typeId && t.kind === 'enum');
        if (!obj || !isValidIdlName(name) || obj.members.includes(name)) return false;
        update(set, old => ({ ...old, dataTypes: old.dataTypes.map(t => t.id === typeId ? { ...t, members: [...t.members, name] } : t) }));
        return true;
    },
    addCustomMessageType(serviceId, name) {
        const s = get().snapshot;
        const svc = s?.services.find(v => v.id === serviceId && v.source === 'custom');
        const trimmed = String(name ?? '').trim();
        if (!svc || !isValidIdlName(trimmed) || s.messages.some(m => m.name === trimmed && m.namespace === svc.namespace)) return false;
        const obj = { id: uuid(), name: trimmed, namespace: svc.namespace, source: 'custom',
            fields: [makeField('value', 'double')] };
        update(set, old => ({ ...old, messages: [...old.messages, obj] }));
        set({ selection: { kind: 'message', id: obj.id } });
        return true;
    },
    addCustomTopic(serviceId, name, messageTypeId) {
        const s = get().snapshot;
        const svc = s?.services.find(v => v.id === serviceId && v.source === 'custom');
        const msg = s?.messages.find(v => v.id === messageTypeId);
        const trimmed = String(name ?? '').trim();
        if (!svc || !msg || !isValidIdlName(trimmed) || s.topics.some(t => t.name === trimmed &&
            s.operations.some(o => o.topicId === t.id && o.serviceId === serviceId))) return false;
        const obj = { id: uuid(), name: trimmed, namespace: svc.namespace, source: 'custom', messageTypeId };
        update(set, old => ({ ...old, topics: [...old.topics, obj] }));
        set({ selection: { kind: 'topic', id: obj.id } });
        return true;
    },
    addCustomOperation(serviceId, name, topicId, action, actor, optionalConsumer = false, interfaceDirection = undefined) {
        const s = get().snapshot;
        const svc = s?.services.find(v => v.id === serviceId && v.source === 'custom');
        const trimmed = String(name ?? '').trim();
        // Legacy API callers may omit the direction; names are a migration hint only.
        const direction = interfaceDirection === undefined ? legacyDirectionFromName(trimmed) : interfaceDirection;
        if (!svc || !isValidIdlName(trimmed) || !s.topics.some(t => t.id === topicId) ||
            !['publish','subscribe','dispose'].includes(action) || !['provider','consumer'].includes(actor) ||
            !INTERFACE_DIRECTIONS.includes(direction) ||
            s.operations.some(o => o.serviceId === serviceId && o.name === trimmed)) return false;
        const op = { id: uuid(), serviceId, name: trimmed, topicId, action, actor,
            interfaceDirection:direction, interfaceDirectionSource:interfaceDirection===undefined?'legacy-name':'user', optionalConsumer };
        update(set, old => ({ ...old, operations: [...old.operations, op],
            interfaces: old.interfaces.map(i => i.serviceId === serviceId ? { ...i, operationIds: [...i.operationIds, op.id] } : i) }));
        set({ selection: { kind: 'operation', id: op.id } });
        return true;
    },
    updateCustomOperationDirection(operationId, interfaceDirection) {
        const s=get().snapshot;
        const op=s?.operations.find(o=>o.id===operationId);
        const svc=s?.services.find(v=>v.id===op?.serviceId);
        if(!op || svc?.source!=='custom' || !INTERFACE_DIRECTIONS.includes(interfaceDirection))return false;
        if(op.interfaceDirection===interfaceDirection)return true;
        update(set, old=>({
            ...old,operations:old.operations.map(o=>o.id===operationId?
                {...o,interfaceDirection,interfaceDirectionSource:'user'}:o),
        }));
        return true;
    },
    updateCustomOperationTopic(operationId, topicId) {
        const s=get().snapshot;
        const op=s?.operations.find(o=>o.id===operationId);
        const svc=s?.services.find(v=>v.id===op?.serviceId);
        const topic=s?.topics.find(t=>t.id===topicId);
        const type=s?.messages.find(m=>m.id===topic?.messageTypeId);
        if(!op || svc?.source!=='custom' || !topic || type?.source!=='custom') return false;
        update(set, old=>({...old,operations:old.operations.map(o=>o.id===operationId?{...o,topicId}:o)}));
        return true;
    },
    removeCustomOperation(operationId) {
        const s=get().snapshot;
        const op=s?.operations.find(o=>o.id===operationId);
        if(!op || s?.services.find(x=>x.id===op.serviceId)?.source!=='custom')return false;
        update(set, old=>({...old,operations:old.operations.filter(o=>o.id!==operationId),interfaces:old.interfaces.map(i=>({...i,operationIds:i.operationIds.filter(id=>id!==operationId)}))}));
        return true;
    },
    addCustomService(name, flow, functionalArea = 'CUSTOM', serviceCategory = null) {
        const s = get().snapshot;
        const trimmed = name.trim();
        if (!s || !/^[A-Za-z][A-Za-z0-9_]*$/.test(trimmed) || s.services.some(x => x.name.toLowerCase() === trimmed.toLowerCase()))
            return false;
        if (functionalArea !== 'CUSTOM' && !s.functionalAreas.some(a => a.id === functionalArea)) return false;
        if (!['request-reply','command-response'].includes(flow) || (serviceCategory && !['control','config','specs','status-report','other'].includes(serviceCategory))) return false;
        const sid = uuid();
        const namespace = `ProjectCustom::${trimmed}`;
        const svc = { id: sid, name: trimmed, namespace, functionalArea, source: 'custom', version: '1.0', flowControl: flow, serviceCategory: serviceCategory || (/(?:Status|Report)$/.test(trimmed)?'status-report':flow==='command-response'?'control':'other'), description: '사용자 정의 서비스 (UMAA 표준 서비스 아님)' };
        const messages = [];
        const topics = [];
        const operations = [];
        const make = (suffix, fields) => {
            const typeId = uuid();
            const topicId = uuid();
            const typeName = `${trimmed}${suffix}Type`;
            messages.push({ id: typeId, name: typeName, namespace, source: 'custom', fields });
            topics.push({ id: topicId, name: typeName, messageTypeId: typeId });
            return topicId;
        };
        if (flow === 'request-reply') {
            const t = make('Report', [makeField('entityId', 'string', true), makeField('value', 'double')]);
            operations.push({ id: uuid(), serviceId: sid, name: 'report' + trimmed, topicId: t, action: 'publish', actor: 'provider' });
            operations.push({ id: uuid(), serviceId: sid, name: 'query' + trimmed, topicId: t, action: 'subscribe', actor: 'consumer' });
        }
        else {
            const tCommand = make('Command', [makeField('sessionId', 'string', true), makeField('destinationId', 'string'), makeField('targetValue', 'double')]);
            const tStatus = make('CommandStatus', [makeField('sessionId', 'string', true), makeField('status', 'string'), makeField('reason', 'string')]);
            const tAck = make('CommandAckReport', [makeField('sessionId', 'string', true)]);
            const tExecution = make('ExecutionStatusReport', [makeField('sessionId', 'string', true), makeField('progress', 'double')]);
            operations.push({ id: uuid(), serviceId: sid, name: 'set' + trimmed, topicId: tCommand, action: 'publish', actor: 'consumer' });
            operations.push({ id: uuid(), serviceId: sid, name: 'report' + trimmed + 'CommandStatus', topicId: tStatus, action: 'publish', actor: 'provider' });
            operations.push({ id: uuid(), serviceId: sid, name: 'report' + trimmed + 'CommandAck', topicId: tAck, action: 'publish', actor: 'provider' });
            operations.push({ id: uuid(), serviceId: sid, name: 'query' + trimmed + 'CommandAck', topicId: tAck, action: 'subscribe', actor: 'consumer', optionalConsumer: true });
            operations.push({ id: uuid(), serviceId: sid, name: 'report' + trimmed + 'ExecutionStatus', topicId: tExecution, action: 'publish', actor: 'provider' });
            operations.push({ id: uuid(), serviceId: sid, name: 'query' + trimmed + 'ExecutionStatus', topicId: tExecution, action: 'subscribe', actor: 'consumer', optionalConsumer: true });
            operations.push({ id: uuid(), serviceId: sid, name: 'cancel' + trimmed + 'Command', topicId: tCommand, action: 'dispose', actor: 'consumer' });
        }
        // Template directions are explicit; DDS actor is independently persisted.
        const directedOperations=operations.map(op=>({
            ...op,interfaceDirection:legacyDirectionFromName(op.name),interfaceDirectionSource:'template',
        }));
        update(set, old => ({ ...old,
            functionalAreas: functionalArea === 'CUSTOM' && !old.functionalAreas.some(a => a.id === 'CUSTOM')
                ? [...old.functionalAreas, { id: 'CUSTOM', name: 'Project Extensions', icd: 'Project-defined area — not UMAA standard', source: 'custom' }]
                : old.functionalAreas,
            services: [...old.services, svc],
            interfaces: [...old.interfaces, { id: uuid(), serviceId: sid, name: `${trimmed} · Operation Interface`,
                    description: 'Custom Service의 Operation 그룹', operationIds: operations.map(o => o.id) }],
            topics: [...old.topics, ...topics], messages: [...old.messages, ...messages], operations: [...old.operations, ...directedOperations] }));
        set({ selection: { kind: 'service', id: sid } });
        return true;
    },
    addMessageField(messageId, name, type, options = {}) {
        const s = get().snapshot;
        const msg = s?.messages.find(m => m.id === messageId);
        if (!msg || msg.source !== 'custom' || !/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(name) || !String(type??'').trim() || (options.key && options.optional) || msg.fields.some(f => f.name === name))
            return false;
        update(set, old => ({ ...old, messages: old.messages.map(m => m.id === messageId ? { ...m, fields: [...m.fields, { ...makeField(name, type), key: !!options.key, optional: !!options.optional }] } : m) }));
        return true;
    },
    updateMessageField(messageId, originalName, patch) {
        const s=get().snapshot;
        const m=s?.messages.find(m=>m.id===messageId && m.source==='custom');
        if(!m || !m.fields.some(f=>f.name===originalName) || !isValidIdlName(patch.name) || !String(patch.type??'').trim() || (patch.key && patch.optional) || m.fields.some(f=>f.name===patch.name&&f.name!==originalName)) return false;
        update(set,old=>({...old,messages:old.messages.map(m=>m.id===messageId?{...m,fields:m.fields.map(f=>f.name===originalName?{...f,...patch}:f)}:m)}));
        return true;
    },
    updateCustomTopicType(topicId, messageTypeId) {
        const s=get().snapshot;
        const topic=s?.topics.find(t=>t.id===topicId);
        const usedBy=s?.operations.filter(o=>o.topicId===topicId)??[];
        if(!topic || !s.messages.some(m=>m.id===messageTypeId) || usedBy.some(o=>s.services.find(v=>v.id===o.serviceId)?.source!=='custom')) return false;
        const priorType=s.messages.find(m=>m.id===topic.messageTypeId);
        const nextType=s.messages.find(m=>m.id===messageTypeId);
        if(priorType?.source!=='custom' || nextType?.source!=='custom') return false;
        update(set,old=>({...old,topics:old.topics.map(t=>t.id===topicId?{...t,messageTypeId}:t)}));
        return true;
    },
    removeMessageField(messageId, name) {
        update(set, s => ({ ...s, messages: s.messages.map(m => m.id === messageId && m.source === 'custom' ? { ...m, fields: m.fields.filter(f => f.name !== name) } : m) }));
    },
    connect(providerBindingId, consumerBindingId) {
        const s = get().snapshot;
        if (!s || !canConnect(s, providerBindingId, consumerBindingId))
            return false;
        updateTopology(set, old => ({ ...old, connections: [...old.connections, { id: uuid(), providerBindingId, consumerBindingId }] }));
        return true;
    },
    removeConnection(id) {
        updateTopology(set, s => ({ ...s, connections: s.connections.filter(c => c.id !== id) }));
        set({ selection: null });
    },
    moveComponent(componentId, position) {
        update(set, s => ({ ...s, positions: { ...s.positions, [componentId]: position } }));
    },
    setBehaviorDiagram(componentId, diagram) {
        const s=get().snapshot;
        if(!s?.components.some(c=>c.id===componentId) || !diagram || !Array.isArray(diagram.nodes) || !Array.isArray(diagram.edges)) return false;
        update(set,old=>({...old,behaviorDiagrams:{...(old.behaviorDiagrams??{}),[componentId]:{
            nodes:diagram.nodes.map(n=>({id:n.id,kind:n.kind,label:n.label,x:n.x,y:n.y})),
            edges:diagram.edges.map(e=>({id:e.id,source:e.source,target:e.target}))
        }}}));
        return true;
    },
    changePlatform(platform) { update(set, s => ({ ...s, project: { ...s.project, targetPlatform: platform } })); },
    changeVendor(vendor) { update(set, s => ({ ...s, project: { ...s.project, ddsVendor: vendor } })); },
}));
