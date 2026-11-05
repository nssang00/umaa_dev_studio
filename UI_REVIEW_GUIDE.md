# v0.8.2 UI 검토 가이드

1. `PREVIEW_UI.html`을 열어 새 Types Struct Diagram을 선택합니다. 기본값은 `GlobalPoseReportType`이며 왼쪽에서 32개 메시지 타입·17개 공통 타입을 검색할 수 있습니다.
2. 중앙의 Struct Card에서 필드를 클릭합니다. 오른쪽 Properties가 **선택한 필드만** 표시하는지 확인합니다. 카드 내부는 스크롤되고 아래 전체 패널은 늘어나지 않습니다.
3. 하단에는 OUTPUT / CONSOLE 두 개만 있습니다. Console에서 Type/Field 선택 로그를 확인합니다. 계약 표, DDS Endpoint Matrix, Flow Simulation은 하단에 보이면 안 됩니다.
4. React 소스에서 Custom Type을 선택하면 오른쪽 Properties에서 새 필드 추가 및 선택 필드 편집/삭제가 가능합니다. UML 카드와 필드 데이터는 같은 Zustand 모델을 참조합니다.
5. UML형 Diagram은 **표현 방식**이며 실제 타입은 UMAA ICD 속성표를 참고한 Mock입니다. 원본 `.idl`을 파싱한 결과가 아닙니다.

**검증 범위:** Node 모델/정적 UI 테스트와 독립 HTML의 필드 클릭·Console 전환을 확인. `npm run build`와 실제 React 브라우저 E2E는 의존성 미설치로 미검증.
