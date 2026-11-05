# UMAA Development Studio — v0.8.1 ICD Mock Types (v0.8 기반)

## 시작하기

**타입 모의 데이터 확인:** [`preview/UMAA_IDL_Mock_Types_Explorer_v0.8.1.html`](preview/UMAA_IDL_Mock_Types_Explorer_v0.8.1.html). 설치 없이 32개 MessageType, 17개 Common DataType, 필드와 상속 구조를 확인할 수 있는 **독립 목 미리보기**입니다. React/React Flow 앱의 빌드 결과는 아닙니다.

**이전 v0.8 전체 UX 미리보기:** [`preview/UMAA_Studio_v0.8_InteractivePreview.html`](preview/UMAA_Studio_v0.8_InteractivePreview.html). 이 파일은 구버전으로 남아 있으며 새 Types 데이터/화면이 반영되지 않았습니다. 최신 변경은 `src/`의 React 소스와 위 타입 미리보기에 반영되었습니다.

**React/React Flow 실제 소스:** `src/`에 있으며 기존 esbuild IIFE 구조를 보존합니다. 네트워크/Node 패키지를 설치할 수 있는 환경에서는 아래와 같이 실행합니다.

```bash
npm install
npm run test:core
npm run test:layout
npm run build
```

`npm run build` 이후 `index.html`을 열어 빌드된 React 앱을 실행합니다. `dist/`는 이 전달본에 포함되지 않습니다.

## v0.8.1 변경 — UMAA ICD 기반 타입 목 데이터

- `src/model/mockIdlCatalog.js`에서 ICD 속성 정의 표를 참고한 **32개 Message Types + 17개 Common Data Types**를 제공.
- Types Explorer에서 Message / Common 그룹을 분리하고, 중앙 Type Workbench 및 오른쪽 Properties에서 필드명, 자료형, `@key`, `@optional`, 상속 및 ICD 근거를 조회.
- 기존 v0.8 로컬 저장 Workspace도 `upgradeWorkspace()`에서 목 타입 구조를 보완하며 Custom 타입은 보존.
- **원본 .idl 파일은 포함되어 있지 않으며 이 데이터는 DDS 호환성이 확인된 공식 IDL이 아님.**
- 상세 검증 범위: [`docs/ICD_MOCK_TYPES_V0_8_1.md`](docs/ICD_MOCK_TYPES_V0_8_1.md)

## 기존 v0.8 UI 구조 (유지)

- 왼쪽 Explorer를 **Components / Services / Types**의 3개 **텍스트 탭**으로 정리했습니다. 버튼형 6개 메뉴나 하나의 통합 트리 방식이 아닙니다.
- **Component Assembly**: React Flow Component 노드와 Provider/Consumer 서비스 포트 드래그로 연결. 노드 단일 클릭은 선택/속성, 더블클릭은 Component 편집으로 이동.
- **Component Editor**: `Interfaces | Assembly Diagram | Behavior Graph | Runtime/QoS` 탭. 목록에서 Service를 검색해 P/C Binding 생성하고 즉시 파생된 Endpoints를 확인.
- **Service Contract Graph**: `Operation → DDS Action → Topic → IDL MessageType`을 React Flow로 투영. Custom Service는 Operation/Topic/Type 추가, `Action→Topic` 및 `Topic→Type` 드래그 참조 변경 가능. 공식 UMAA Service는 읽기 전용.
- **Type Dependency Graph**: Type → Field → 참조 Type 표시, Custom Type에 Field 추가/수정 및 타입 연결. 세밀한 `@key`, `@optional`, Enum 편집은 기존 Fields/IDL 탭에 유지.
- **DDS Communication**: P/C 연결을 펼쳐 Topic별 Reader/Writer 방향을 표시하고 Participant 역할 노드에서 Runtime Domain/Partition/QoS 수정 진입.
- **Behavior Graph**: 사용자 설계 초안 블록을 추가/이동/연결/삭제하고 JSON에 보관. **실행 로직 자동 생성은 아님.**
- 원본 Project JSON Export/Import, 정적 모델 검증, C++ 공유 라이브러리 **골격** 생성 코드는 유지.

### 작업 가이드

1. **Components** 탭 → `Autopilot` → `Interfaces`: 7P/7C 목록과 DDS Endpoint 계산 확인.
2. **Services** 탭 → `MO` → `GlobalVectorControl`: Contract Graph에서 Command·Status·Ack·ExecutionStatus의 Topic/Type 확인.
3. `GlobalVectorControl`의 Provider Binding을 열어 Reader/Writer 목록과 연결 상대를 조회.
4. **System Assembly**에서 Service P/C Handle을 연결하거나 기존 연결선을 선택 → DDS Communication 상세 확인.
5. **Types** 탭 → 표준 Type은 읽기 전용. `+ Add Type`으로 Custom Struct/Enum을 생성하고 Graph/Fields Editor에서 수정.
6. 새 Custom Service를 만든 뒤 Contract Graph에서 Operation/Topic/Type을 확장하고, 그 Service를 Component Binding으로 연결.
7. Component `Runtime/QoS`에서 Domain, Partition, QoS Profile, 명령 중재 정책 설정을 검토.
8. 상단 **Code Generation**에서 생성 대상·ZIP 미리보기 확인. 실제 DDS 통신이 구현되었다고 간주하지 마세요.

## 아키텍처 원칙

`Functional Area → Service → Operations/DDS Actions → Topics → MessageTypes → Field DataTypes`와 `Component → P/C Service Bindings → Connections → Derived DDS Endpoints → Runtime/Codegen`는 **단일 Project Domain Model**을 공유합니다. React Flow 노드/엣지는 이 모델의 시각화/편집 투영입니다. 화면 위치는 모델 계약과 별개로 관리합니다.

UMAA ICD의 Request/Reply는 조회 데이터가 없을 경우 Topic Subscribe/Report로 구현되며, Command Cancel은 일반적으로 DDS Dispose입니다. 따라서 Operation과 Topic을 1:1로 생성하지 않습니다. `Service`에서 패턴 계약을 정의하고 `Component`에서는 Provider/Consumer 역할을 지정합니다.

## 검증 및 알려진 한계

세부 사항: [`docs/VERIFICATION_V0_8.md`](docs/VERIFICATION_V0_8.md), [`docs/UX_WORKBENCH_V0_8.md`](docs/UX_WORKBENCH_V0_8.md).

본 환경에서 npm 저장소 `EAI_AGAIN`으로 의존성 설치에 실패해 **React 번들/브라우저 UI QA를 통과했다고 주장하지 않습니다.** 로컬 headless Chromium 또한 보안 정책에 의해 `file://`와 `http://127.0.0.1` 접근이 모두 차단됐습니다. 반면 JS 문법·오프라인 미리보기 VM 내 초기 렌더링/화면 전환/모델 변경 및 Node 기반 모델 검사는 통과했습니다.

**공식 IDL 원본(대신 ICD 기반 읽기 전용 목 데이터), DDS Vendor SDK, QoS 정책별 호환성 검증, 실제 Command Flow Control Runtime, Component Host와 실행 가능한 DDS Wrapper는 포함되어 있지 않습니다.** DLL/SO는 비통신 골격 생성 기능입니다.

### 출처

소스는 기존 대화에서 제공된 **v0.6.0 소스 ZIP**을 수정한 것입니다. v0.7의 탭형 UX 설계안은 참고했지만, v0.7 소스 ZIP은 이 작업 환경에 실체 파일이 없어서 직접 병합하지 못했습니다. 따라서 이전 v0.7 소스와의 diff는 별도로 확인해야 합니다.
