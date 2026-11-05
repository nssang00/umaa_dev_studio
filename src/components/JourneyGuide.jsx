import { Alert, Button, Divider, Space, Tag, Typography } from 'antd';
import { CheckCircleOutlined, CloseCircleOutlined, CompassOutlined, InfoCircleOutlined, RightOutlined, WarningOutlined } from '@ant-design/icons';
import { componentProgress, issueDestination } from '../logic/journeyModel.js';
import { useEditorStore } from '../stores/useEditorStore.js';
const {Text}=Typography;
export function JourneyGuide({onGenerate}) {
  const s=useEditorStore(x=>x.snapshot);
  const selection=useEditorStore(x=>x.selection);
  const setJourneyStep=useEditorStore(x=>x.setJourneyStep);
  const select=useEditorStore(x=>x.select);
  if(selection?.kind!=='component')return null;
  const p=componentProgress(s,selection.id);
  if(!p.component)return null;
  const stages=[
    {label:'Component 정의',complete:!!p.component.name,desc:'이름과 역할 확인',action:()=>setJourneyStep(0)},
    {label:'서비스 조립',complete:p.hasServices,desc:p.hasServices?`${p.bindings.length}개 서비스 추가됨`:'제공하거나 사용하는 서비스 선택',action:()=>setJourneyStep(1)},
    {label:'코드 생성 준비',complete:p.canGenerate,desc:p.blockingErrors.length?'모델 오류 해결 필요':p.hasServices?'골격 생성 가능':'서비스 선택 필요',action:()=>setJourneyStep(2)},
  ];
  return <div className="journey-guide">
    <div className="guide-kicker"><CompassOutlined/> 제작 안내</div>
    <h3>{p.component.name}</h3><Text type="secondary">아래 항목을 순서대로 완성하세요. 어떤 단계든 다시 열 수 있습니다.</Text>
    <div className="guide-task-list">{stages.map((stage,i)=><button key={i} className="guide-task" onClick={stage.action}>
      <span className={`guide-task-bullet ${stage.complete?'done':'todo'}`}>{stage.complete?<CheckCircleOutlined/>:i+1}</span><span><strong>{stage.label}</strong><small>{stage.desc}</small></span><RightOutlined/>
    </button>)}</div>
    <Divider style={{margin:'18px 0 12px'}}/>
    <div className="guide-kicker">현재 모델 검사</div>
    {p.issues.length===0?<Alert type="success" showIcon message="이 컴포넌트에 등록된 경고가 없습니다." description="이는 정적 검증 결과이며 DDS 통신의 적합성 보증은 아닙니다."/>:
      <div className="guide-issues">{p.issues.slice(0,5).map((issue,i)=>{
        const destination=issueDestination(s,issue);
        return <button key={i} disabled={!destination} onClick={()=>destination&&select(destination)}>
          {issue.severity==='error'?<CloseCircleOutlined style={{color:'#ca3a3a'}}/>:<WarningOutlined style={{color:'#d59a23'}}/>}<span>{issue.message}</span>{destination&&<RightOutlined/>}
        </button>;
      })}</div>}
    {p.blockingErrors.length>p.issues.filter(x=>x.severity==='error').length&&<Text type="secondary" style={{display:'block',fontSize:11,marginTop:10}}>다른 객체를 포함한 전체 프로젝트 오류가 {p.blockingErrors.length}건 있습니다. 생성 전 해결해야 합니다.</Text>}
    <Divider style={{margin:'16px 0'}}/>
    <div className="guide-help"><InfoCircleOutlined/><p>서비스를 선택하면 Operation과 DDS Topic은 계약에 따라 자동으로 반영됩니다. Reader/Writer는 역할에서 파생됩니다.</p></div>
    <Button type="primary" block disabled={!p.canGenerate} onClick={()=>onGenerate(p.component.id)}>코드 골격 생성</Button>
    <Text type="secondary" style={{display:'block',fontSize:10,marginTop:9}}>생성 파일은 실제 DLL/SO가 아닙니다. 빌드·실행·DDS 연결에는 추가 구현이 필요합니다.</Text>
  </div>;
}
