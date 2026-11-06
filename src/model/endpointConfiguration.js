import { deriveEndpoints } from '../logic/endpoints.js';

/** Stable design-time key. A logical endpoint is one Binding × Topic × direction. */
export function endpointKey(endpoint) {
  return endpoint.bindingId + '|' + endpoint.topicId + '|' + endpoint.direction;
}

export function configuredEndpoints(snapshot, componentId) {
  const c=snapshot?.components?.find(item=>item.id===componentId);
  if(!c)return [];
  const runtime=snapshot.componentRuntime?.[componentId]??{};
  return deriveEndpoints(snapshot,componentId).map(endpoint=>{
    const key=endpointKey(endpoint);
    const explicit=snapshot.endpointConfigs?.[key]?.qosProfileId??null;
    return {
      ...endpoint, key, componentId,
      explicitQosProfileId:explicit,
      qosProfileId:explicit??runtime.qosProfileId??null,
      qosSource:explicit?'endpoint':'component',
    };
  });
}
export function findConfiguredEndpoint(snapshot, key) {
  for(const c of snapshot?.components??[]) {
    const found=configuredEndpoints(snapshot,c.id).find(item=>item.key===key);
    if(found)return found;
  }
  return null;
}

/** Null clears override to inherit Component Runtime QoS; invalid requests are atomic. */
export function editEndpointQosProfile(snapshot, componentId, key, qosProfileId) {
  const endpoint=configuredEndpoints(snapshot,componentId).find(item=>item.key===key);
  if(!endpoint || (qosProfileId!==null && !snapshot.qosProfiles?.some(q=>q.id===qosProfileId))) return null;
  const current=snapshot.endpointConfigs??{};
  const previous=current[key]?.qosProfileId??null;
  if(previous===qosProfileId)return snapshot;
  const next={...current};
  if(qosProfileId===null)delete next[key];
  else next[key]={...current[key],qosProfileId};
  return {...snapshot,endpointConfigs:next};
}

/** Remove saved per-endpoint overrides when a Service Binding is removed. */
export function removeBindingEndpointConfigs(endpointConfigs,bindingId) {
  const next={...(endpointConfigs??{})};
  for(const key of Object.keys(next)) if(key.startsWith(bindingId+'|'))delete next[key];
  return next;
}
