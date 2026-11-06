import { useMemo, useState } from 'react';
import { Alert, Button, Select, Table, Tabs, Tag, Typography } from 'antd';
import { useEditorStore } from '../stores/useEditorStore.js';
import { configuredEndpoints } from '../model/endpointConfiguration.js';
import { ddsDesignPreflight } from '../logic/ddsDesignPreflight.js';
import { RuntimeSettings } from './DesignDetails.jsx';
const {Text}=Typography;

/** Central advanced DDS design workspace; entities are model projections. */
export function DdsConfigurationWorkbench() {
  const s=useEditorStore(state=>state.snapshot);
  const selection=useEditorStore(state=>state.selection);
  const select=useEditorStore(state=>state.select);
  const [componentId,setComponentId]=useState(selection?.componentId??'all');
  const [tab,setTab]=useState(selection?.componentId?'deployment':'endpoints');
  const rows=useMemo(()=>s?.components.flatMap(c=>configuredEndpoints(s,c.id).map(e=>({
    ...e,componentName:c.name,qosName:s.qosProfiles.find(q=>q.id===e.qosProfileId)?.name??'Missing',
    domainId:s.componentRuntime?.[c.id]?.domainId??0,
    partition:s.componentRuntime?.[c.id]?.partition??'',
  })))??[],[s]);
  const filtered=componentId==='all'?rows:rows.filter(x=>x.componentId===componentId);
  const deployments=s.components.map(c=>({
    id:c.id,name:c.name,cfg:s.componentRuntime?.[c.id]??{},
    endpoints:rows.filter(e=>e.componentId===c.id).length,
  }));
  const logicalTopics=[...new Map(rows.map(e=>[
    e.domainId+'|'+e.topicId,
    {id:e.domainId+'|'+e.topicId,topicId:e.topicId,domainId:e.domainId,
      name:e.topicName,type:e.typeName,users:rows.filter(x=>x.domainId===e.domainId&&x.topicId===e.topicId).length}
  ])).values()];
  const checks=useMemo(()=>ddsDesignPreflight(s),[s]);
  const filter=<div className="dds-config-filter">
    <Text>Component</Text>
    <Select size="small" value={componentId} onChange={setComponentId} style={{minWidth:230}}
      options={[{value:'all',label:'All Components'},...s.components.map(c=>({value:c.id,label:c.name}))]}/>
  </div>;
  return <div className="center-workbench dds-config-workbench">
    <div className="editor-heading"><div>
      <Text type="secondary" className="editor-eyebrow">SYSTEM MODEL · ADVANCED DDS DESIGN</Text>
      <h2>DDS Configuration</h2>
      <Text type="secondary">Service Binding에서 구성 도출 · Deployment / Topic / Endpoint / QoS 확인</Text>
    </div></div>
    <Alert type="info" showIcon message="기본 Component 조립에서는 DDS를 직접 만들 필요가 없습니다."
      description="자동 파생 결과를 확인하거나 Component/Endpoint 설정을 재정의하는 공통 고급 공간입니다. 실제 DDS DomainParticipant/Publisher/Subscriber/Writer/Reader 객체는 생성되지 않습니다."/>
    <Tabs size="small" activeKey={tab} onChange={setTab} className="dds-central-tabs"
      items={[
        {key:'deployment',label:'Deployment / Participant',children:<>
          <Text type="secondary" className="small-hint">Domain/Partition/QoS는 현재 Component Runtime 설계값입니다. Publisher/Subscriber Partition의 전체 DDS 정책 모델은 아닙니다.</Text>
          <Table size="small" rowKey="id" pagination={false} scroll={{x:650}} dataSource={deployments}
            columns={[
              {title:'Component',dataIndex:'name'},
              {title:'Domain ID',render:(_,e)=>e.cfg.domainId??0,width:95},
              {title:'Partition',render:(_,e)=>e.cfg.partition||'(default)'},
              {title:'QoS Profile',render:(_,e)=>s.qosProfiles.find(p=>p.id===e.cfg.qosProfileId)?.name??'Missing'},
              {title:'Endpoints',dataIndex:'endpoints',width:86},
              {title:'Edit',width:80,render:(_,e)=><Button size="small" onClick={()=>setComponentId(e.id)}>설정</Button>},
            ]}/>
          {filter}
          {componentId!=='all'&&<div className="dds-overview-runtime">
            <RuntimeSettings componentId={componentId}/>
          </div>}
        </>},
        {key:'topics',label:'Topic References',children:<>
          <Text type="secondary" className="small-hint">Service Operation이 참조하는 논리 Topic/Type 목록입니다. 배포된 DDS Topic 인스턴스를 의미하지 않습니다.</Text>
          <Table size="small" rowKey="id" pagination={{pageSize:12}} dataSource={logicalTopics} scroll={{x:630}}
            columns={[
              {title:'Domain',dataIndex:'domainId',width:88},
              {title:'Topic',dataIndex:'name'},
              {title:'Data Type',dataIndex:'type'},
              {title:'Endpoints',dataIndex:'users',width:95},
              {title:'Contract',render:(_,t)=><Button size="small" onClick={()=>select({kind:'topic',id:t.topicId})}>열기</Button>},
            ]}/>
        </>},
        {key:'endpoints',label:'Generated Endpoints',children:<>
          {filter}
          <Table size="small" rowKey="key" pagination={{pageSize:12}}
            dataSource={filtered} scroll={{x:790}}
            onRow={e=>({onClick:()=>select({kind:'ddsConfig',id:'project',componentId,endpointKey:e.key})})}
            columns={[
              {title:'Component',dataIndex:'componentName'},
              {title:'Service',dataIndex:'serviceName'},
              {title:'Endpoint',render:(_,e)=><Button type="link" size="small"
                onClick={()=>select({kind:'ddsConfig',id:'project',componentId,endpointKey:e.key})}>
                Data{e.direction==='writer'?'Writer':'Reader'}</Button>},
              {title:'Topic / Type',render:(_,e)=><><div>{e.topicName}</div><Text type="secondary" style={{fontSize:11}}>{e.typeName}</Text></>},
              {title:'QoS',render:(_,e)=><><Tag>{e.qosName}</Tag>{e.qosSource==='endpoint'&&<Tag color="blue">Override</Tag>}</>},
            ]}/>
          <Text type="secondary" className="small-hint">Endpoint를 선택하면 오른쪽 Properties에서 Component 기본 QoS를 상속하거나 개별 Profile을 선택할 수 있습니다.</Text>
        </>},
        {key:'preflight',label:'Design Checks',children:<>
          <Alert type={checks.length?'warning':'info'} showIcon
            message={checks.length?'제한적 정적 검사에서 '+checks.length+'건 확인':'검사 가능한 규칙에서 불일치를 발견하지 못했습니다.'}
            description="Domain ID, 간이 Partition, Writer/Reader Reliability·Durability·Deadline 일부만 검사합니다. DDS Requested/Offered 전체 호환성, QoS 상속/병합, 실제 매칭과 통신을 보장하지 않습니다."/>
          <Table size="small" rowKey={(_,i)=>String(i)} pagination={{pageSize:10}} style={{marginTop:12}}
            dataSource={checks} columns={[
              {title:'Rule',dataIndex:'code',width:220},
              {title:'Finding',dataIndex:'message'},
            ]}/>
        </>},
      ]}/>
  </div>;
}
