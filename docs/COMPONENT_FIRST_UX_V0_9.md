# UMAA Development Studio v0.9 — Component-first UX 구현 메모

## 핵심 사용자 흐름

1. 왼쪽 **내 컴포넌트 > +** 클릭. 이름 입력. 원한다면 기존 Component의 Service Binding 구성을 복사.
2. 중앙 **Component 정의**에서 이름과 설명 수정. **Service 조립**에서 제공할 기능(Provider)과 사용할 기능(Consumer)을 추가하고 불필요한 Binding 제거.
3. 중앙 **검증 및 생성**에서 타깃 플랫폼 및 DDS Vendor 선택, 필요하면 DDS Runtime/QoS 상세 편집.
4. 정적 오류가 없다면 **파일 생성 및 미리보기**를 눌러 Component 코드 골격 ZIP을 확인/다운로드.
5. 오른쪽 제작 안내에서 진행 단계와 이 Component의 검증 메시지를 확인하고 바로 이동.

## 화면 배치

- 상단: 프로젝트, UMAA 버전, 저장 및 코드 골격 생성. JSON Import/Export와 초기화는 프로젝트 관리 메뉴에 배치.
- 좌측: Component 목록을 기본 탐색으로 제공, System Assembly 및 Build 바로가기. Service/Type Tree는 **고급 모델 도구**에서 열람.
- 중앙: Component 정의 / Service 조립 / 검증 및 생성 3단계. **고급 편집기**에서 기존 Assembly, Behavior Graph, Runtime/QoS 편집을 그대로 사용.
- 우측: 선택 중인 Component의 진행 안내, 검증 오류 이동. 일반 모델 선택 시 기존 ContextProperties/TypeProperties 사용.
- 하단: OUTPUT/CONSOLE 기본 접힘, 필요할 때 펼침.

## 구현된 주요 변경

- `ComponentJourney.jsx`: 단계형 Component 제작 워크벤치 및 서비스 선택 모달(검색/기능영역/Provider/Consumer)
- `StudioNavigator.jsx`: Component 작업 중심 탐색, Advanced Explorer 유지
- `JourneyGuide.jsx`: 다음 작업 및 Component 검증 결과와 해당 상세 화면 이동
- `journeyModel.js`: 진행 상태/검증 결과/문제 대상 탐색을 기존 도메인에서 파생
- `useEditorStore.js`: Component 정보 수정, 기존 Component Binding 구성 복사, 새 화면의 Binding 제어 모드
- `GenerationPanel.jsx`: 선택 Component를 코드 생성 초기 타깃으로 설정
- `styles.css`, `App.jsx`, `WorkspaceWorkbench.jsx`: 레이아웃/작업 동선 통합
- `component-journey.test.mjs`: 상태 계산 회귀 테스트

## 주요 제약

- 표준 Service와 IDL 계약 원본은 계속 읽기 전용이다.
- Runtime 및 QoS의 실제 DDS 벤더 SDK 연동은 미구현이다.
- ZIP은 CMake 기반 C++ **골격** 및 JSON/IDL 계약을 생성한다. DLL/SO를 직접 컴파일하거나 실행하지 않는다.
- `PREVIEW_UI.html`과 기존 `preview/UMAA_Types_Struct_Diagram_v0.8.2.html`은 이전 버전의 독립 미리보기다. 최신 Component-first UI는 `npm install && npm run build` 후 루트 `index.html`에서 확인한다.
- `preview/Component_First_Interactive_Concept.html`은 UX 아이디어를 확인하는 **별도 독립 시안**이고, 현재 React 모델 편집기와 상태를 공유하지 않는다.

## 실행

```bash
npm install
npm run build
npm test
```

빌드 후 로컬 브라우저에서 `index.html`을 열면 된다. 사용자 작업 결과는 브라우저 localStorage Mock Repository에 저장되며 상단 **프로젝트 관리 > JSON 내보내기**로 백업한다.
