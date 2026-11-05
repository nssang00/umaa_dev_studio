# UMAA Component-first UX — v0.8 설계 기준

## 사용자 시나리오: Autopilot 개발

1. 참조 Component 또는 Custom Component 생성 → Component Editor 진입.
2. `Interfaces`에서 Provider/Consumer 서비스를 할당. 공식 정의는 복사하지 않고 Service ID를 참조.
3. Service 포트를 열어 `Operation → DDS Action → Topic → Type`을 Contract Graph로 확인. 표준 정의는 보호, Custom 서비스만 참조 수정.
4. `Assembly`에서 P/C 포트 연결. React Flow 연결선은 설계 연결이며 DDS의 Point-to-Point 물리 링크가 아님.
5. 연결을 열어 `DDS Communication`을 확인. Consumer/Provider 각 채널의 Writer/Reader, Topic, IDL Type이 자동 파생되는 것을 확인.
6. Component Runtime에서 Domain, Partition, QoS를 지정. Command Arbitration은 Component Specification/사용자 Handler의 구현 책임.
7. Behavior Graph로 사용자 처리 흐름 초안 작성. 표준 Command 상태 머신은 직접 변경하지 않음.
8. Validate → Generate → C++ Handler 구현 → 실제 DDS Runtime 통합 → DLL/SO 및 Host 검증.

## 왼쪽 Explorer 3개 텍스트 탭

- **Components**: `System Assembly`, Project Component 목록, Component별 `Provided / Consumed Services`. 자주 하는 작업을 가장 먼저 배치.
- **Services**: UMAA 8개 Functional Area 아래 공식 서비스, 별도 Custom Service. Service 선택 시 Contract Graph.
- **Types**: Standard IDL Type Reference(읽기 전용)와 Custom Struct/Enum/MessageType(편집 가능). Type Dependency Graph.

Topics는 `Service Contract`와 `Type` 사이의 데이터 계약 노드이며, QoS는 `Component Runtime`에 편집 화면을 제공합니다. 탐색 계층을 과도하게 늘리지 않습니다.

## React Flow 다이어그램과 편집 규칙

| Diagram | 사용자가 변경할 수 있는 것 | 모델 업데이트 | 실통신 코드 생성 |
|---|---|---|---|
| Component Assembly | Component 위치, P/C 포트 연결 | positions, connections | 구성 명세만 반영 |
| Service Contract | Custom Operation/Topic/Type 생성 및 참조 연결 | operations, topics, messages | Custom IDL/계약 골격만 |
| Type Dependency | Custom Type 필드 추가·수정, 참조 Type 선택 | messages/dataTypes.fields | Custom IDL 출력 |
| DDS Communication | Component별 Domain/Partition/QoS 설정 | componentRuntime | Config 골격 반영 |
| Component Behavior | 사용자 블록·연결·좌표 | behaviorDiagrams | 미구현: 설계 기록만 |

React Flow의 nodes/edges는 진실 원본이 아님. Domain Model 명령으로 변경한 뒤 다시 그래프를 계산합니다. 표준 UMAA 계약을 덮어쓰지 않도록 `source=standard` 항목은 읽기 전용입니다.

## 중요한 제약

- 공식 IDL의 필드·Key/Optional을 Mock seed만으로 추정하지 않음.
- Query는 대부분 Subscribe, Cancel은 Dispose, `CancelCommandStatus` 별도 DDS Topic 생성 금지.
- Command/Response에는 Session ID, GUID, 상태 전이, Cleanup/Recovery 등 구현이 별도로 요구됨.
- Service P/C 논리 연결과 실제 DDS 매칭(Domain/Partition/QoS/Topic/Type)을 혼동하지 않음.
- Autopilot 14개 서비스 바인딩은 Component Definitions v1.0의 참조 정의. 플랫폼별 Specification은 별도로 결정.
