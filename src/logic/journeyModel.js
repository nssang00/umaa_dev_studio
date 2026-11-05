import { validateWorkspace } from './validation.js';
import { deriveEndpoints } from './endpoints.js';

/** UX-only projection of the original model. Does not modify official UMAA contracts. */
export function componentProgress(snapshot, componentId) {
  const component = snapshot.components.find(c => c.id === componentId);
  const bindings = snapshot.bindings.filter(b => b.componentId === componentId);
  const providers = bindings.filter(b => b.role === 'provider');
  const consumers = bindings.filter(b => b.role === 'consumer');
  const allIssues = validateWorkspace(snapshot);
  const relatedIds = new Set([componentId, ...bindings.map(b => b.id)]);
  const issues = allIssues.filter(i => relatedIds.has(i.entityId));
  const blockingErrors = allIssues.filter(i => i.severity === 'error');
  const runtime = snapshot.componentRuntime?.[componentId];
  const endpoints = component ? deriveEndpoints(snapshot, componentId) : [];
  return {
    component, bindings, providers, consumers, endpoints, issues, blockingErrors, runtime,
    hasServices: bindings.length > 0,
    hasConfig: !!runtime && Number.isInteger(runtime.domainId) && runtime.domainId >= 0 &&
      snapshot.qosProfiles.some(q => q.id === runtime.qosProfileId),
    canGenerate: !!component && bindings.length > 0 && blockingErrors.length === 0,
  };
}

export function issueDestination(snapshot, issue) {
  const id = issue?.entityId;
  if (!id) return null;
  for (const [kind, collection] of [
    ['component',snapshot.components], ['binding',snapshot.bindings], ['service',snapshot.services],
    ['operation',snapshot.operations], ['topic',snapshot.topics], ['message',snapshot.messages],
    ['dataType',snapshot.dataTypes], ['connection',snapshot.connections],
    ['interface',snapshot.interfaces], ['qos',snapshot.qosProfiles],
  ]) {
    if (collection?.some(x => x.id === id)) return { kind, id };
  }
  return null;
}
