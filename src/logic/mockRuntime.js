/** Deterministic UI-only illustration; not an OMG DDS simulator or compliance test. */
export function simulateConnectionFlow(s, connectionId) {
    const c = s.connections.find(x => x.id === connectionId);
    if (!c)
        throw new Error('Connection을 찾을 수 없습니다.');
    const provider = s.bindings.find(b => b.id === c.providerBindingId);
    const consumer = s.bindings.find(b => b.id === c.consumerBindingId);
    if (!provider || !consumer || provider.serviceId !== consumer.serviceId)
        throw new Error('연결이 올바르지 않습니다.');
    const service = s.services.find(x => x.id === provider.serviceId);
    const pName = s.components.find(x => x.id === provider.componentId)?.name ?? 'Provider';
    const cName = s.components.find(x => x.id === consumer.componentId)?.name ?? 'Consumer';
    if (!service)
        throw new Error('Service를 찾을 수 없습니다.');
    const ops = s.operations.filter(o => o.serviceId === service.id);
    const first = (action, actor) => {
        const op = ops.find(o => o.action === action && o.actor === actor);
        return op ? s.topics.find(t => t.id === op.topicId)?.name ?? 'UnknownTopic' : 'UndefinedTopic';
    };
    const events = service.flowControl === 'request-reply'
        ? [
            { actor: cName, action: 'SUBSCRIBE', detail: `${first('publish', 'provider')} Topic에 Reader 등록 (Query 메시지 발행 아님)` },
            { actor: pName, action: 'PUBLISH', detail: `${first('publish', 'provider')} 상태 데이터 발행` },
            { actor: cName, action: 'RECEIVE', detail: 'Report 수신 및 Callback 호출' },
        ]
        : [
            { actor: cName, action: 'PUBLISH COMMAND', detail: `${first('publish', 'consumer')} (destination GUID, sessionID 사용을 가정한 흐름)` },
            { actor: pName, action: 'RECEIVE COMMAND', detail: '명령 대상 확인 및 Handler 호출' },
            { actor: pName, action: 'PUBLISH STATUS', detail: 'ISSUED → COMMANDED → EXECUTING (개념적 순서)' },
            { actor: pName, action: 'PUBLISH STATUS', detail: 'COMPLETED (정상 완료 경로 예시)' },
            { actor: cName, action: 'RECEIVE STATUS', detail: `${first('publish', 'provider')} 등의 상태 Topic에서 응답 추적` },
        ];
    return events.map((v, index) => ({ ...v, step: index + 1 }));
}
