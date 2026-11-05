# 03. 화면 구조 / 다이어그램 현황

## 편집 UX

```text
Top bar       Project / Save / Generate
Left          My Components / System Assembly / Asset Library / Data Patterns / Build / Advanced Models
Center        Selected Asset's dedicated Workbench
Right         Context Inspector or Component Journey Guide
Bottom        Output / Console (collapsed by default)
```

- **Component Journey (기본)**: 정의 → Service 조립(Provider/Consumer) → 설정/검증/코드 골격 생성.
- **Asset Library**: Service, Topic, Data Type, QoS 분리 검색·생성. Component보다 먼저 Asset을 만드는 것이 가능.
- **Service view**: Operation 목록과 Flow Control/Report 개념. DDS Action Mapping, Topic/Data Type을 탐색.
- **Data Types**: v0.8.3 UML 일반화·Struct 카드, Field/Enum 편집 및 Mock Override.
- **QoS**: 프로젝트 Profile 편집, Base Profile 참조·Component 사용 관계도.

## 현재 구현 vs 계획 다이어그램

| 다이어그램/뷰 | 현재 v0.9.1 | 비고 |
|---|---|---|
| Component 조립/제작 | 있음 | Step-based Journey + 기존 그래프 뷰 |
| System Assembly | 있음 | Component 간 바인딩/연결 기존 도구 |
| Service Contract/Flow | 있음(개념도) | 런타임 시퀀스 구현 아님 |
| UML Struct / Generalization | 있음 | ICD Mock Type 포함, 실제 원본 IDL 처리 아님 |
| Data Patterns Topic 관계 | 있음(설계 관계) | Large Collection/Generalization의 실행 동기화 아님 |
| QoS Profile Usage | 있음(참조 관계) | Reader/Writer 호환성 판정 기능 아님 |
| DDS Communication | 기존 조회/계산 도구 있음 | 실제 미들웨어 연결 아님 |
| QoS Requested/Offered Compatibility | 미구현 | Reader/Writer 정책 비교·진단 필요 |
| Command State Machine | 기존 BehaviorGraph 등 일부 UI | 실제 규범적 state machine 검증 및 실행 미구현 |
| UML Type Dependency 영향 분석 | 부분 구현/검토 필요 | 완전한 변경 영향 검증 미보장 |
| Sequence Diagram (Command/Reply) | 미구현 | ICD flow 시나리오 모델 연계 필요 |
| Collection Synchronization Diagram | 기본 Topic 관계만 있음 | Metadata/Element 동기화 시퀀스 필요 |
| Deployment Diagram | 미구현/별도 확장 | Host, DDS Domain, binary, processes |
| Gateway DDS↔TCP/UDP Diagram | 미구현/별도 확장 | 후속 기능, 현행 구현으로 주장 금지 |

## 화면 설계 규칙

1. UI는 **ICD 용어**를 우선 (`Topic`, `Data Type`, `Attribute`). `MessageType`은 기존 저장 구조/코드의 용어로 남아 있을 수 있음.
2. Editor에서 노드를 변경하면 **모델에 반영**, Inspector에서 수정해도 **같은 모델에 반영**. 그래프 Node/Edge가 도메인의 유일한 원본이 되어서는 안 됨.
3. `Report / Status`는 서비스 분류와 `reportXXX` Operation의 두 문맥으로 표시. 세 번째 Flow Control로 오표기 금지.
4. `Service` → `Operation` → `DDS Mapping` → `Topic` → `Data Type`은 **UI 탐색 경로**이지 모두 1:N 엄격 소유 계층이 아님.
5. 표준 변경/Project Override/Custom을 UI의 상태로 구분하고 적용 범위 표시.
6. QoS 편집의 기본은 **Policy Editor**; 관계도는 선택적 보조 화면. 모든 정책을 노드로 그리지 말 것.

## 확인 경로

- 최신 React: `project/index.html` (빌드 필요).
- 독립 UX 컨셉: `project/preview/Component_First_Interactive_Concept.html`.
- v0.8.3 Type 시안: `project/preview/UMAA_Types_UML_Editor_v0.8.3.html`.
- 과거 시안: `project/preview/archive/` (최신 애플리케이션 아님).
