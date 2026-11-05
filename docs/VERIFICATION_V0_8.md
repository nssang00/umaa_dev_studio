# v0.8 검증 결과

## 통과

- `npm run check:static` — IIFE/file:// 경로, JS/JSX 소스, React Flow v12, Dagre 등 정적 구조.
- `npm run test:icd` — Autopilot 14 Service Binding(7P+7C), 56 Operations, 32 Topics, 32 endpoint 계약.
- `npm run test:design` — 표준/Custom 분리, Service/Topic/IDL/Endpoint 관계, Runtime 메타데이터.
- `npm run test:workbench` — GlobalVectorControl 4 DDS 채널 및 GlobalPoseStatus 1 Report 채널.
- `npm run test:graphs` — Service Contract Graph 및 Custom Action→Topic/Topic→Type 유효성, Type Dependency Graph.
- `npm run test:preview` — 오프라인 UI의 초기 렌더링/화면 전환과 Component, Custom Service, Binding, Type Field, Topic, Operation 참조 변경 VM 테스트.
- 독립 미리보기 HTML inline JavaScript `node --check` 파싱 통과.

## 실행 불가 / 미검증

- `npm run test:layout` — `@dagrejs/dagre` 패키지 미설치 (`ERR_MODULE_NOT_FOUND`).
- `npm run build` — React, antd, React Flow, esbuild 등 npm 패키지 미설치. npm Registry `EAI_AGAIN` 오류.
- 실제 React App 브라우저 E2E — 수행하지 못함.
- Chromium 오프라인 미리보기 브라우저 QA — `net::ERR_BLOCKED_BY_ADMINISTRATOR` (file://와 localhost 모두 차단).
- 실제 DDS vendor SDK 통신, IDL 컴파일, DLL/SO Host 로딩 — 구현/검증되지 않음.

**따라서 오프라인 미리보기의 사용자 클릭 UI 동작은 정적·VM 수준에서 검증됐으며 실제 브라우저에서 정상 작동을 보증하는 단계는 아닙니다.**
