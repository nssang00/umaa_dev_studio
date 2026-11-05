# UMAA Development Studio v0.6 — Workbench UI 개편

## 원본 / 범위

기준: `UMAA_Development_Studio_v0.5.0_Source_Preview.zip`. 기존 v0.5 모델/Repository/React Flow/코드 생성 로직을 유지하며 **탐색과 편집 화면을 개편**했습니다. `src`는 JavaScript/JSX이며 Vite가 아닌 esbuild IIFE + CSS 번들 구성입니다.

### UI 진입과 탐색

* **Explorer 통합:** `My Project`(System Diagram, Components, Custom Services, Custom Types, Custom Topics, Custom Functional Areas, QoS, Connections, Build & Deployment)와 `UMAA 6.0 Library`(8개 Functional Areas→Services, 표준 MessageTypes/Topics)를 하나의 트리에서 탐색합니다. `Services` 별도 탭을 제거했습니다.
* **중앙 객체별 Workbench:** `Service`→Contract, `Operation`→DDS Action, `Topic`→Topic/Type, `Message`/`DataType`→Type Designer, `QoS`→Profile Editor, `Component`/`Diagram`→Assembly React Flow, **Connection**→별도 DDS Communication React Flow, `Build`→생성 대상 요약.
* **Type Designer:** Custom MessageType / Struct / Enum의 필드/멤버 추가·수정·삭제와 IDL Source Preview. 필드 @key/@optional 지원, 동시 지정 금지. 공식 IDL은 원문 미탑재이므로 읽기 전용 메타데이터만 표시.
* **Service Contract:** Pattern 템플릿, Operation→DDS Action(Publish/Subscribe/Dispose)→Topic→Type 확인, 사용 Component 확인. Custom Service는 기존 Message/Topic/Operation 확장 편집기 연결.
* **DDS Communication View:** 기존 Component 연결을 기준으로 Reader/Writer와 Topic 흐름을 구성. `GlobalVectorControl`은 Command가 Consumer→Provider이고 Status/Ack/ExecutionStatus는 반대 방향. Domain/Partition의 명백한 불일치는 경고. DDS의 실제 통신/발견/매칭을 실행하지 않습니다.
* **Build:** 기존 `GenerationPanel`과 CMake DLL/SO 골격 생성 기능을 중앙 Build 노드와 연결했습니다.

## 빠른 UI 확인 (패키지 설치 필요 없음)

`preview/UMAA_Studio_v0.6_OfflinePreview.html`을 브라우저에서 엽니다. 이는 새 구조를 직접 조작하는 **독립적인 오프라인 HTML 시제품**으로, 실제 React/Ant Design/React Flow 빌드 결과가 아닙니다. 표준 Service 확인, Custom Type 및 Service 추가, QoS 조정, Connection 상세, JSON Export 등을 시험할 수 있습니다. 데이터는 브라우저 저장소 정책에 따라 localStorage에 저장될 수 있으며, 저장 불가 시 Export JSON을 사용하십시오.

## 실제 React 프로젝트 실행

```bash
npm install
npm run check:static
npm run test:icd
npm run test:design
npm run test:workbench
npm run test:layout
npm run build
```

생성된 `index.html`과 `dist/main.js`, `dist/main.css`는 같은 경로에 있어야 합니다. `index.html`을 브라우저에서 직접 열어 실제 React 앱을 확인합니다.

## 검증 결과 (2026-11-04)

* `npm run check:static`: PASS
* `npm run test:icd`: PASS
* `npm run test:design`: PASS
* `npm run test:workbench`: PASS
* JS/JSX 구문 검사(TypeScript parser): 0 errors (해당 검사기는 현재 환경에서만 실행)
* 오프라인 HTML Chromium 조작 QA: PASS (Service, DDS, Type, QoS, Custom Service)
* 생성 `libAutopilot.so` CMake 빌드: PASS (실제 DDS 미연동 골격)
* `npm run test:layout`: **실행 실패** — `@dagrejs/dagre` 의존성이 설치되어 있지 않음
* `npm run build`: **미실행** — npm 레지스트리 DNS `EAI_AGAIN`으로 React/Ant Design/@xyflow 의존성 설치 불가

## 범위 밖 (미완료)

공식 UMAA IDL 원본 통합, 정식 전량 서비스 Catalog, C++ DDS SDK 연동, DDS QoS 완전 검증, Command Flow State Machine의 실행 구현, Component Host 로딩/격리, RTI/Fast DDS 실통신, 공식 UMAA Compliance 인증은 구현하지 않았습니다.

`Component Definition`과 플랫폼별 `Component Specification` 데이터 모델의 완전한 분리, Union/Typedef/Bounded Sequence의 완전 IDL 편집도 후속 범위입니다.

## 주요 변경 파일

* `src/components/ProjectExplorer.jsx`
* `src/components/WorkspaceWorkbench.jsx`
* `src/components/ContractWorkbench.jsx`
* `src/components/TypeWorkbench.jsx`
* `src/components/CommunicationView.jsx`
* `src/components/ContextProperties.jsx`
* `src/logic/communicationModel.js`
* `src/stores/useEditorStore.js`
* `src/logic/validation.js`
* `src/App.jsx`, `src/styles.css`, `package.json`
* `tests/workbench-model.test.mjs`
