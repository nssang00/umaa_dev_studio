/**
 * Derive logical DDS endpoints from service operations and a binding role.
 * It deliberately does not construct a vendor DDS Entity; that requires an SDK.
 */
export function deriveEndpoints(snapshot, componentId) {
    const endpoints = [];
    const componentBindings = snapshot.bindings.filter(b => b.componentId === componentId);
    for (const binding of componentBindings) {
        const service = snapshot.services.find(s => s.id === binding.serviceId);
        if (!service)
            continue;
        for (const op of snapshot.operations.filter(o => o.serviceId === service.id)) {
            const topic = snapshot.topics.find(t => t.id === op.topicId);
            if (!topic)
                continue;
            const msg = snapshot.messages.find(m => m.id === topic.messageTypeId);
            if (!msg)
                continue;
            let direction;
            if (op.action === 'publish')
                direction = op.actor === binding.role ? 'writer' : 'reader';
            else if (op.action === 'subscribe' && op.actor === binding.role)
                direction = 'reader';
            else if (op.action === 'dispose')
                direction = op.actor === binding.role ? 'writer' : 'reader';
            if (!direction)
                continue;
            const prev = endpoints.find(e => e.bindingId === binding.id && e.direction === direction && e.topicId === topic.id);
            if (prev) {
                if (!prev.operations.includes(op.name))
                    prev.operations.push(op.name);
                prev.optional = prev.optional && Boolean(op.optionalConsumer && binding.role === 'consumer');
            }
            else {
                endpoints.push({
                    bindingId: binding.id, componentId, serviceId: service.id, serviceName: service.name,
                    topicId:topic.id,
                    role: binding.role, direction, topicName: topic.name,
                    typeName: msg.name, messageTypeId: msg.id, operations: [op.name],
                    optional: Boolean(op.optionalConsumer && binding.role === 'consumer'),
                });
            }
        }
    }
    // UMAA Large Collections: the metadata report and element data use distinct
    // DDS topics; derive the element endpoint from the parent report endpoint.
    for (const relation of snapshot.topicRelations ?? []) {
        const parent = snapshot.topics.find(t => t.id === relation.parentTopicId);
        const element = snapshot.topics.find(t => t.id === relation.relatedTopicId);
        const type = snapshot.messages.find(m => m.id === element?.messageTypeId);
        if (!parent || !element || !type)
            continue;
        const parents = endpoints.filter(e => e.topicName === parent.name && e.messageTypeId === parent.messageTypeId);
        for (const e of parents) {
            if (endpoints.some(existing => existing.bindingId === e.bindingId && existing.topicName === element.name && existing.direction === e.direction))
                continue;
            endpoints.push({ ...e, topicId:element.id, topicName: element.name, typeName: type.name,
                messageTypeId: type.id, operations: [`[${relation.kind}]`], relatedRule: relation.kind });
        }
    }
    return endpoints;
}
