# v0.8.1 — UMAA 6.0 ICD-based Mock Types

## 목적 / 데이터 지위

기존 v0.8.0에서 이름만 존재하던 32개의 standard MessageType에 ICD 문서의 속성 정의 표를 근거로 **탐색용 목 필드**를 추가했다. 공식 UMAA IDL 바이너리/원본 `.idl`은 첨부물에 없으며, 이 변경은 IDL 컴파일이나 DDS 직렬화 호환성 구현이 **아니다**.

이 전달본의 필드 정의는 `provenance = icd-attribute-table-mock`, `mock = true`, `source = standard`로 구분된다. DDS TypeSupport 및 표준 IDL 코드를 생성하는 입력으로 사용해서는 안 된다. 원본 IDL이 확보되면 구문 분석기/AST를 통해 교체·비교해야 한다.

## 데이터 적용 범위

| 그룹 | 수 | 예시 | 원문 근거 |
|---|---:|---|---|
| Service MessageType | 32 | GlobalPoseReportType, SpeedReportType, GlobalVectorCommandType, GlobalHoverCommandType, ConditionalReportType | UMAA 6.0 SA/MO/MM/EO/SO ICD 메시지 정의 표 |
| Common DataType | 17 | UMAAStatus, UMAACommand, IdentifierType, GeoPosition2D, Orientation3DNEDType, DateTime | UMAA 6.0 SA ICD §6.2, MM ICD §3.8.6 |
| Large Set element | 위 MessageType 32개에 포함 | ConditionalReportTypeConditionalsSetElement | MM ICD §3.8.6의 generic LargeSet Element 템플릿과 §6.1.3 |

- `fields`: ICD의 해당 데이터 타입에서 직접 정의한 Attribute Name / Attribute Type을 샘플로 구성. `*`는 `key=true`, `†`는 `optional=true`.
- `baseType`: ICD 표의 “Additional fields included from”에 대응. 독립 필드와 **상속된 공통 필드**를 구분한다.
- `effectiveTypeFields()`: 2단계 이상 공통 상속을 추적해 **화면 표시용** 병합 필드 목록을 생성한다. IDL 메모리 레이아웃을 재현하는 함수가 아니다.
- 일부 필드 목록은 의도적으로 대표 항목만 포함한다. 타입에서 필드가 0개인 경우는 `...CommandStatusType`처럼 ICD상 추가 필드가 없이 `UMAACommandStatus` 공통 항목만 사용하는 예제다.
- `ConditionalReportType.conditionals`는 Large Set 논리 타입으로 유지하며, Element Topic과 Metadata Topic은 기존 `topicRelations` 관계를 보존한다. Element 구조는 MM ICD의 **일반 템플릿 기반 목**이므로 공식 생성 파일과 동일하다는 보장이 없다.

## 구현 파일

- `src/model/mockIdlCatalog.js` — 목 타입 정의, 기존 Workspace 마이그레이션, 공통 필드 병합.
- `src/model/workspaceSchema.js` — `upgradeWorkspace()`에서 목 타입 카탈로그 추가. 로컬 저장된 이전 v0.8 프로젝트에도 적용; Custom 타입은 유지.
- `src/components/ProjectExplorer.jsx` — Types 트리에서 Message / Common 구분.
- `src/components/TypeWorkbench.jsx` — 전체 필드, 상속 여부, ICD 근거, Mock Shape Preview.
- `src/components/ContextProperties.jsx` — 오른쪽 속성 패널에 선택 타입의 필드 및 출처 표시.
- `src/components/TypeGraph.jsx` — 표준 타입의 읽기 전용 모의 데이터 안내.
- `examples/umaa-icd-mock-type-catalog.json` — 별도 목 타입 데이터만 추출한 JSON.
- `examples/umaa-icd-seed-workspace.json` — 이전 파일을 v0.8.1 데이터 스키마로 업그레이드.
- `preview/UMAA_IDL_Mock_Types_Explorer_v0.8.1.html` — 설치 없는 **독립 타입 탐색 미리보기**. 실제 React 앱 번들이 아님.
- `tests/idl-mock-types.test.mjs` — 32개 Message / 17개 Common, 대표 필드, 상속, Large Set, 기존 저장 데이터 마이그레이션 테스트.

## QA 결과

- `npm run test:core`: 통과 (정적/Service/디자인/Workbench/Graph/IDL Mock/기존 HTML 미리보기 검사).
- `typescript` JS/JSX 파서: 수정된 JSX 네 파일 모두 구문 오류 없음.
- Static Types Preview 내부 JS `node --check`: 통과.
- React/Ant Design/esbuild 번들 및 브라우저 E2E: 검증 **못함** (이 런타임에 Node 의존성이 설치되어 있지 않음).
- 기존 `preview/UMAA_Studio_v0.8_InteractivePreview.html`은 **기존 v0.8 미리보기 그대로**이며, 새 Mock Type UI를 보려면 위의 새 독립 Preview를 열어야 함.

## 다음 개발에서 처리할 것

1. 실제 UMAA 6.0 IDL 파일을 확보하여 namespace, typedef, enum, bounded sequence, union, extensional annotation, DDS Key와 정밀 비교.
2. IDL Import 후 `mock`/`reference` 별도로 저장하여 목 데이터와 표준 원본을 분리하고 충돌 처리.
3. 좌측 통합 Explorer / 우측 Properties 편집 UX를 최종 확정한 후 Custom Type 필드 수정도 Properties로 이전.
4. 실제 React 빌드와 브라우저에서 타입 탐색 및 수정 회귀 검증.
