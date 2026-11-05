# 04. 개발자용 구조 / 주요 파일 / 모델 저장

## 기술 구성

- JavaScript/JSX, React 18, Zustand 5, Ant Design 5, React Flow v12, Dagre, JSZip, esbuild.
- Node 22.16.0으로 현재 순수 JS 테스트 재실행. 프로젝트 `package.json`에 Node engine/lockfile은 고정되어 있지 않음. 재현 가능한 빌드를 위해 lockfile 생성·관리 권장.
- 데이터 저장: `src/repository/mockRepository.js` (브라우저 localStorage Mock). 백엔드 DB, 공식 EA/IDL import 파이프라인 아님.
- 개발/배포: `scripts/build.mjs`의 esbuild IIFE 빌드. 빌드 후 루트 `index.html`을 로컬에서 열 수 있도록 설계.

## 진입점·화면 계층

| 파일 | 담당 |
|---|---|
| `src/App.jsx` | 메인 레이아웃, Workspace 선택, 프로젝트 작업/모달 연결 |
| `src/components/StudioNavigator.jsx` | My Components / System Assembly / Asset Library / Data Patterns / Build 탐색 |
| `src/components/ComponentJourney.jsx` | Component 3단계 제작 UI 및 Service 바인딩 |
| `src/components/JourneyGuide.jsx` | Component 단위 다음 단계/검증 안내 |
| `src/components/AssetLibraryWorkbench.jsx` | 4종 Asset 조회·검색·독립 생성 |
| `src/components/ContractWorkbench.jsx`, `IcdFlowView.jsx` | Service 계약/Flow Control/Report 표시 |
| `src/components/TypeWorkbench.jsx`, `TypeProperties.jsx` | UML Type/필드 편집, Project Override |
| `src/components/DataPatternsWorkbench.jsx` | Large Set/List, Generalization/Specialization Topic 관계 |
| `src/components/QosUsageDiagram.jsx` | QoS Base Profile 및 Component 적용 관계 |
| `src/components/Diagram.jsx` | System Assembly 기존 다이어그램 |
| `src/components/WorkspaceWorkbench.jsx`, `ContextProperties.jsx`, `Inspector.jsx` | 전용 Workbench/Inspector 라우팅 |
| `src/components/GenerationPanel.jsx` | Component 코드 골격 ZIP 미리보기 및 출력 |

## 도메인·상태·생성

| 파일 | 담당 |
|---|---|
| `src/stores/useEditorStore.js` | Zustand snapshot/selection, Component/Binding/Asset/Override/QoS/Topic Relations 액션 |
| `src/model/seed.js` | 초기 UMAA 예제/정규화 데이터 |
| `src/model/mockIdlCatalog.js` | ICD 기반 Mock Type 데이터 생성/병합 |
| `src/model/icdConcepts.js` | ICD 용어, Service Category/Operation 분류, Flow Projection |
| `src/model/assetRules.js` | Custom Topic/Topic 관계/Service Category/QoS Base 참조 규칙 |
| `src/model/typeEditing.js` | UML 타입 수정 및 Mock Override/복원 |
| `src/model/workspaceSchema.js`, `validateImport.js` | 프로젝트 스키마와 import 정합성 처리 |
| `src/logic/validation.js` | 정적 모델 진단; 실제 DDS 호환성 판정은 아님 |
| `src/logic/codegen.js` | C++ scaffold/계약/IDL/JSON 생성 |
| `src/logic/endpoints.js`, `communicationModel.js` | Service/Topic/역할로부터 Endpoint·통신 정보 파생 |
| `src/repository/mockRepository.js` | localStorage 기반 로컬 스냅샷 저장 |

## 핵심 snapshot 컬렉션/필드

```text
project                 ← 이름, 표준버전, 플랫폼, DDS vendor 등
components[]            ← Component 정의
bindings[]              ← componentId, serviceId, role(provider/consumer)
services[]              ← Service 정의, flowControl, (선택적) serviceCategory
interfaces[]            ← Service Interface 참조
operations[]            ← serviceId, topicId, action, actor ...
topics[]                ← Topic name, namespace, messageTypeId
messages[]              ← Topic에 연결되는 Data Type (역사적 내부 컬렉션명)
dataTypes[]             ← 공통 Data Type/Enum 등
qosProfiles[]           ← libraryName, baseProfileId, reliability, presentation 등 일부 정책
topicRelations[]        ← large-set-element, large-list-element, specialization
componentRuntime{}      ← Component별 DDS/타깃 설정 및 QoS 선택
connections[]           ← 시스템 서비스 연결
```

중요: `Data Type` UI를 채택했으나 기존 Snapshot의 `messages[]`와 `Topic.messageTypeId`는 **하위 호환성 때문에 유지**. 특정 Topic과 Type의 실제 매핑을 변경하려면 구조 마이그레이션이 필요함.

## 참조/변경 정책

- `source='standard'`는 UMAA 카탈로그 참조. 공식 배포본/ICD-Mock의 구분을 문서·UI에 명시.
- `source='custom'`는 사용자 정의. `Type` Mock 수정은 `projectOverride`로 기록하며 표준 IDL 변경을 뜻하지 않음.
- Topic 관계 `topicRelations[]`은 **설계 메타데이터**. 실제 DMA/IDL/동기화 로직을 생성하는 실행 구조가 아님.
- `schemaVersion: 3` 프로젝트 하위 호환을 유지하는 `upgradeWorkspace()` 경로 존재. Snapshot 변경은 Import/Export/Validation/Codegen/테스트 동시 수정.

## Generated Component 내용

`src/logic/codegen.js`는 `generateComponentFiles(snapshot, componentId)` / `generateAllComponentFiles()`를 통해:

- `CMakeLists.txt`, `src/component.cpp`, `include/component_api.h`, `generated/endpoints.hpp` 등 scaffold.
- `component.manifest.json`, `contracts/service-operations.json`, `contracts/topic-endpoints.csv`, `contracts/communication-patterns.json`.
- `contracts/project-assets.json`, `contracts/icd-patterns.json`, `contracts/type-overrides.json`.
- `config/dds-profile.json`, `config/runtime.json`.
- `idl/custom/`, `idl/custom-types/`, `idl/standard/README.md` (표준 IDL은 포함하지 않음).

생성한 scaffold 자체는 외부 CMake로 `.so`/`.dll`로 **컴파일할 수 있도록 설계**되었으나 DDS 동작은 Mock. Studio 내부에서 공식 IDL/TypeSupport 포함한 실제 바이너리 생성은 지원하지 않음.
