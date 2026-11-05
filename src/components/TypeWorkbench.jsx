import { Button, Collapse, Empty, Space, Tag, Typography } from 'antd';
import { PlusOutlined, LinkOutlined } from '@ant-design/icons';
import { useEditorStore } from '../stores/useEditorStore.js';
import { effectiveTypeFields } from '../model/mockIdlCatalog.js';
const { Text } = Typography;

// Preview-only pseudo IDL; not authoritative or DDS-compiler verified.
export function renderIdlPreview(type) {
  const ns=(type.namespace??'ProjectCustom').split('::').filter(Boolean);
  const indent='  '.repeat(ns.length);
  const fields=(type.fields??[]).map(f=>`${indent}  ${f.key?'@key ':''}${f.optional?'@optional ':''}${f.type} ${f.name};`);
  const body=type.kind==='enum'
    ? [`${indent}enum ${type.name} {`,...(type.members??[]).map((m,i)=>`${indent}  ${m}${i<(type.members?.length??0)-1?',':''}`),`${indent}};`]
    : [`${indent}struct ${type.name}${type.baseType?' : '+type.baseType:''} {`,...fields,`${indent}};`];
  return [type.source==='custom'?'// PROJECT EXTENSION — IDL PREVIEW':type.projectOverride?'// PROJECT OVERRIDE OF ICD MOCK — NOT OFFICIAL IDL':'// ICD-DERIVED MOCK — NOT OFFICIAL UMAA IDL',
    ...(type.source==='custom'?[]:[`// Reference: ${type.reference??'UMAA 6.0 ICD'}`,'// Bounds, typedefs, annotations and DDS compatibility are unverified.']),
    ...ns.map((n,i)=>`${'  '.repeat(i)}module ${n} {`),...body,
    ...ns.slice().reverse().map((_,i)=>`${'  '.repeat(ns.length-1-i)}};`)].join('\n');
}

export function TypeWorkbench({ kind, id }) {
  const snapshot=useEditorStore(s=>s.snapshot);
  const selection=useEditorStore(s=>s.selection);
  const select=useEditorStore(s=>s.select);
  const type=kind==='message'?snapshot?.messages.find(m=>m.id===id):snapshot?.dataTypes.find(m=>m.id===id);
  if(!type)return <Empty description="Type을 선택하세요"/>;
  const enumType=type.kind==='enum';
  const declared=enumType?(type.members??[]).map(name=>({name,type:'enumerator'})):(type.fields??[]);
  const total=enumType?declared.length:effectiveTypeFields(snapshot,type).length;
  const active=selection?.id===id?selection?.fieldName:null;
  const topics=(snapshot?.topics??[]).filter(x=>x.messageTypeId===id);
  const parent=[...snapshot.messages,...snapshot.dataTypes].find(t=>`${t.namespace}::${t.name}`===type.baseType);
  return <div className="type-struct-workbench">
    <div className="struct-heading">
      <div><Text className="editor-eyebrow" type="secondary">UML DATA TYPE DIAGRAM / ICD DATA TYPE</Text><h2>{type.name}</h2>
        <Space size={5} wrap><Tag color={type.source==='custom'?'purple':type.projectOverride?'gold':'blue'}>{type.source==='custom'?'PROJECT EXTENSION':type.projectOverride?'ICD MOCK · OVERRIDDEN':'ICD MOCK · PROJECT OVERRIDE AVAILABLE'}</Tag><Tag>{enumType?'«enumeration»':'«struct»'}</Tag><Text type="secondary">{declared.length} declared{!enumType&&` · ${total-declared.length} inherited`}</Text></Space>
      </div>
      <Button icon={<PlusOutlined/>} size="small" onClick={()=>select({kind,id,fieldEditor:'create'})}>{enumType?'Member':'Field'} 추가</Button>
    </div>
    <div className="struct-workspace">
      <div className="uml-inheritance-diagram">
        {type.baseType&&<>
          <button type="button" className="uml-parent-class" title={parent?'부모 Struct 열기':'외부 참조 Struct'} onClick={()=>parent&&select({kind:parent.id&&snapshot.messages.some(x=>x.id===parent.id)?'message':'dataType',id:parent.id})} disabled={!parent}>
            <span className="uml-parent-stereotype">«struct»</span><strong>{parent?.name??type.baseType.split('::').at(-1)}</strong>
            <span className="uml-parent-namespace">{parent?.namespace??type.baseType.split('::').slice(0,-1).join('::')}</span>
          </button>
          <svg className="uml-generalization-link" viewBox="0 0 72 60" width="72" height="60" aria-label="UML Generalization: child extends parent">
            <polygon points="36,5 24,27 48,27" fill="white" stroke="#526f8f" strokeWidth="1.8"/>
            <line x1="36" y1="27" x2="36" y2="59" stroke="#526f8f" strokeWidth="1.8"/>
          </svg>
        </>}
        <section className="struct-diagram" aria-label={`${type.name} UML class diagram`}>
          <div className="struct-diagram-header"><span className="struct-stereotype">«{enumType?'enumeration':'struct'}»</span>
            <strong>{type.name}</strong><span className="struct-namespace" title={type.namespace}>{type.namespace}</span></div>
          <div className="struct-members" role="list" aria-label="Declared Fields">
            {declared.length?declared.map((field,i)=><button type="button" role="listitem" key={`${field.name}-${i}`}
                className={`struct-member${active===field.name?' selected':''}`}
                onClick={()=>select({kind,id,fieldName:field.name})} aria-label={`${field.name} ${field.type} 상세 속성`}>
                <span className="struct-visibility">+</span><span className="struct-field-name" title={field.name}>{field.name}</span>
                {!enumType&&<><span className="struct-colon">:</span><code title={field.type}>{field.type}</code></>}
                <span className="struct-member-annotations">{field.key&&<em>key</em>}{field.optional&&<em>optional</em>}</span>
              </button>):<div className="struct-empty">선언된 필드 없음 · 오른쪽 Properties에서 추가할 수 있습니다.</div>}
          </div>
          <div className="struct-diagram-footer">{declared.length} declared{!enumType?` · ${total-declared.length} inherited via UML generalization`:''}</div>
        </section>
      </div>
      <div className="struct-side-guide"><strong>UML 표준 방식</strong><p>상속은 부모 클래스와 일반화 화살표(빈 삼각형)로 표현합니다. 자식에는 직접 정의한 필드만 표시합니다.</p>
        <p>필드를 선택하면 강조 표시됩니다. 오른쪽 Properties에서 Struct 이름·상속·전체 선언 필드를 함께 편집한 뒤 한 번에 저장합니다.</p>
        {type.source!=='custom'&&<p className="struct-mock-note">ICD 기반 Mock입니다. 수정은 Project Override로 보존되며 공식 IDL을 변경하지 않습니다.</p>}
        {topics.length>0&&<><strong className="struct-subheading">Referenced by Topics</strong>{topics.map(t=><Button type="link" size="small" key={t.id} onClick={()=>select({kind:'topic',id:t.id})}><LinkOutlined/> {t.name}</Button>)}</>}
      </div>
    </div>
    <Collapse size="small" ghost className="struct-source-collapse" items={[{key:'idl',label:'Pseudo IDL 소스 (필요 시 펼치기)',children:<pre className="idl-source-preview">{renderIdlPreview(type)}</pre>}]} />
  </div>;
}
