# UMAA Development Studio v0.9.1 — ICD Asset Model

**New in v0.9.1**: Component-first UX from v0.9, standalone Service/Topic/Data Type/QoS Asset Library, Flow Control / Report Service view, Data Patterns diagram, QoS relationship diagram, and v0.8.3 UML Type Editing integration. See [`docs/ICD_ASSET_MODEL_V0_9_1.md`](docs/ICD_ASSET_MODEL_V0_9_1.md).

**Scope limitation**: exports C++/CMake/shared-library scaffolds with manifest metadata, not an operational DDS-connected DLL/SO; OMG DDS-JSON references are design guides, not implemented schema-conformant serializers.

---

# UMAA Development Studio — v0.8.2 Struct Diagram / Console Layout

## 이번 버전의 UI 원칙

- **왼쪽 Explorer:** Components / Services / Types 선택 및 탐색.
- **중앙 Type Workbench:** MessageType 및 Common DataType은 **컴팩트한 UML형 Struct Diagram** 한 장으로 표시합니다. 필드 목록 전체 테이블과 Type Dependency Graph를 기본 화면에서 제거했습니다. 필드 수가 많으면 Struct 카드 내부만 스크롤됩니다.
- **오른쪽 Properties:** 선택한 한 필드의 `IDL Type`, `@key`, `@optional`, 상속/정의 위치를 조회합니다. **Custom Struct/Message Type의 필드 추가·수정·삭제, Custom Enum 멤버 편집도 오른쪽에서** 수행합니다. UMAA ICD 목 타입은 읽기 전용입니다.
- **하단 Output / Console:** 오직 정적 검증 텍스트와 로컬 UI 이벤트 로그만 표시합니다. 접기/펼치기가 가능하며 높이는 기본 170px입니다. 이전 Autopilot 표, Contract Matrix, Flow Simulation, DDS Endpoint Matrix는 **하단에서 제거**했습니다. 더 이상 아래 패널이 별도의 상세 Workbench 역할을 하지 않습니다.
- **오른쪽 전역 설정:** Target/DDS Runtime 공통 설정은 System Assembly/Build 선택 시에만 보이게 했습니다.

## 미리보기 및 실행

- 기본 진입점: [`PREVIEW_UI.html`](PREVIEW_UI.html)
- 독립 화면 검토: [`preview/UMAA_Types_Struct_Diagram_v0.8.2.html`](preview/UMAA_Types_Struct_Diagram_v0.8.2.html). 브라우저에서 단독 실행되며 Type Explorer/Struct/Properties/Output·Console 상호작용이 가능합니다. **React 앱 빌드 결과는 아닙니다.**
- React 소스 진입점: `index.html`, `src/App.jsx`, `src/components/TypeWorkbench.jsx`, `src/components/TypeProperties.jsx`.

```bash
npm install
npm run test:core
npm run test:layout
npm run build
```

이 환경에서는 React 의존성 설치가 불가능해 실제 번들 빌드와 React 브라우저 E2E는 검증하지 못했습니다. TypeScript JSX 트랜스파일러의 구문 검사, Node 기반 정적·도메인 테스트, Playwright `set_content()` 기반 독립 HTML 미리보기 필드 선택과 Console 전환은 통과했습니다. 이 환경의 Chromium은 `file://` 경로 직접 탐색을 차단했지만 HTML 렌더링 자체는 확인했습니다.

## 데이터 범위 및 주의사항

UMAA 6.0 ICD 속성 표에서 도출한 읽기 전용 **Message Types 32개 + Common Data Types 17개**를 유지합니다. 공식 `.idl` 원본 데이터가 아니므로 실제 IDL compiler, TypeSupport, DDS wire interoperability가 검증되었다고 주장하지 않습니다. System Assembly / Service Binding / Operation / Topics / Code Generator의 도메인 로직 및 데이터를 변경하지 않았습니다.

예전 Type Dependency Graph 컴포넌트 소스 `src/components/TypeGraph.jsx`는 삭제하지 않았으나 이번 Types 기본 화면에는 연결하지 않았습니다. 과거 v0.8 대화형 미리보기와 v0.8.1 Types 미리보기는 `preview/archive/`에 참고용으로 보관합니다. 역사적 README는 [`docs/README_V0_8_1_HISTORY.md`](docs/README_V0_8_1_HISTORY.md)에 있습니다.

## v0.9 Component-first UX 변경

기본 작업 화면이 **Component 정의 → Service 조립 → 검증 및 코드 골격 생성**으로 변경되었습니다. 왼쪽에 Component 목록, 오른쪽에 다음 할 일/검증 안내를 제공하며, 표준 계약·Types·다이어그램 고급 편집 기능은 유지됩니다.

실제 React UI는 `npm install && npm run build` 후 **프로젝트 루트 `index.html`**에서 확인하세요. `PREVIEW_UI.html`과 `preview/`의 기존 파일들은 독립적인 이전 버전 시안이며 최신 앱 번들 대신 사용할 수 없습니다. 변경 내역은 `docs/COMPONENT_FIRST_UX_V0_9.md`를 참고하세요.

**산출물 범위:** C++ CMake 프로젝트/Endpoint 명세/Custom IDL 코드 골격 ZIP. 이 패키지는 DDS Runtime이나 실제 DLL/SO 바이너리를 생성하지 않습니다.
