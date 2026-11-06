import { connectionChannels } from './communicationModel.js';
import { findConfiguredEndpoint } from '../model/endpointConfiguration.js';

/**
 * Conservative design-time checks, NOT full DDS Requested/Offered matching.
 * Limited to matched logical channels and selected QoS subsets.
 */
export function ddsDesignPreflight(snapshot) {
  const issues=[];
  if(!snapshot)return issues;
  const warn=(code,message,entityId)=>issues.push({severity:'warning',code,message,entityId});
  const profiles=new Map((snapshot.qosProfiles??[]).map(p=>[p.id,p]));
  const runtime=id=>snapshot.componentRuntime?.[id]??{};
  const val=(profile,section,policy,field)=>profile?.[section]?.[policy]?.[field];
  const durability={volatile:0,transient_local:1,transient:2,persistent:3};
  for(const connection of snapshot.connections??[]) {
    for(const channel of connectionChannels(snapshot,connection.id)) {
      const writer=findConfiguredEndpoint(snapshot,channel.writerEndpointKey);
      const reader=findConfiguredEndpoint(snapshot,channel.readerEndpointKey);
      if(!writer||!reader)continue;
      const wr=runtime(writer.componentId),rr=runtime(reader.componentId);
      const where=channel.serviceName+' / '+channel.topicName;
      const id=connection.id;
      if(Number.isInteger(wr.domainId)&&Number.isInteger(rr.domainId)&&wr.domainId!==rr.domainId)
        warn('DDS_DOMAIN_MISMATCH',where+': Writer/Reader의 Domain ID가 달라 통신할 수 없습니다.',id);
      // Component-level simplified partition; DDS Publisher/Subscriber wildcard
      // and profile partition matching are NOT covered by this comparison.
      const wp=String(wr.partition??''),rp=String(rr.partition??'');
      if(wp!==rp) {
        if(/[*?]/.test(wp+rp))
          warn('DDS_PARTITION_PATTERN_REVIEW',where+': Partition 패턴 일치는 이 모델에서 판정하지 않습니다.',id);
        else
          warn('DDS_PARTITION_MISMATCH',where+': 간이 Component Partition 이름이 다릅니다.',id);
      }
      const w=profiles.get(writer.qosProfileId),q=profiles.get(reader.qosProfileId);
      if(!w||!q)continue;
      const offeredReliability=val(w,'datawriter_qos','reliability','kind');
      const requestedReliability=val(q,'datareader_qos','reliability','kind');
      if(requestedReliability==='reliable'&&offeredReliability==='best_effort')
        warn('DDS_RELIABILITY_MISMATCH',where+': Reader RELIABLE 요구에 Writer BEST_EFFORT는 부적합합니다.',id);
      const offeredDurability=durability[val(w,'datawriter_qos','durability','kind')];
      const requestedDurability=durability[val(q,'datareader_qos','durability','kind')];
      if(Number.isInteger(offeredDurability)&&Number.isInteger(requestedDurability)&&offeredDurability<requestedDurability)
        warn('DDS_DURABILITY_MISMATCH',where+': Reader Durability 요구가 Writer 제공 수준보다 높습니다.',id);
      const writerDeadline=val(w,'datawriter_qos','deadline','period_ms');
      const readerDeadline=val(q,'datareader_qos','deadline','period_ms');
      if(Number.isSafeInteger(writerDeadline)&&Number.isSafeInteger(readerDeadline)&&writerDeadline>readerDeadline)
        warn('DDS_DEADLINE_MISMATCH',where+': Writer Deadline 주기가 Reader 요구보다 큽니다.',id);
    }
  }
  return issues;
}
