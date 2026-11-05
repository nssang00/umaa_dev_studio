# 06. 미완료 / 기술 부채 / 권장 개발 순서

## P0 — 완전한 실행/회귀 검증 (즉시)

1. 온라인 환경에서 `npm install` 후 **lockfile 기록**, `npm run build`, `npm test`를 재현 가능하게 만듦.
2. React 실제 브라우저 E2E를 구축. 독립 HTML 시안 테스트로 최신 앱 E2E를 대체하지 않음.
3. Asset 생성/수정/삭제/Import/Export/Component Binding 간 참조 일관성 검증.
4. Type 프로젝트 Override와 공식 표준 참조의 구분 UI; 변경 영향(상속·다른 Type 참조·Topic·Service) 경고.
5. QoS Profile Base 참조, 순환방지 외의 **정책 상속 적용 값** 계산과 유효성 검사.

## P1 — 모델 정확성/표준 처리

1. 공식 UMAA 6.0 ICD/IDL 배포 아티팩트의 정확한 provenance + namespace + GUID/ID/버전 매핑. 기존 mock 타입을 공식 자료와 분리.
2. OMG DDS-JSON `types`/`qos` schema의 **실제 입출력 어댑터** 및 JSON Schema 검증. 현재 스키마를 참고만 한 프로젝트 부분 모델임.
3. Service Interface/Operation ↔ DDS Topic/Type ↔ Component Port 연결을 더 정확한 재사용 참조 모델로 정규화.
4. Flow Control에 Command/Response 규범적 상태 머신, Query/Cancel DDS mapping/필수 메시지 검사.
5. Large Collections에서 Metadata + Element Types, Topic pair, QoS 요구, ID/타임스탬프 기반 결합/수정/삭제 검증.
6. Generalization/Specialization에서 UML 일반화와 **실제 별도 DDS Topic 관계/동기화** 간 규칙 검증.

## P2 — Diagram/UX 및 QoS 심화

1. Service Interface Diagram의 실제 Operation/DDS mapping/Topic/Data Type 양방향 편집(현재 개념도 개선).
2. DDS Communication Diagram의 Reader/Writer Endpoint/Topic 방향 및 QoS 참조에 대한 실제 모델 기반 검증.
3. QoS Requested/Offered Compatibility View: Reliability, Durability 등 규범적 정책 호환성.
4. Command/Response 및 Request/Reply Sequence Diagram; 실제 ICD 시나리오를 테스트 템플릿으로 생성.
5. Type Dependency, Component/System Assembly, QoS Profile Diagram의 변경 영향 표시.
6. Project Asset Registry에 버전 고정/의존성 스냅샷/프로젝트 Variant 개념 도입.

## P3 — 실제 구현 / Runtime / DLL·SO

1. 공식 IDL 컴파일(벤더 종속 TypeSupport 생성)과 ABI/TypeSupport 연계.
2. 선택 DDS Vendor SDK + QoS Profile → DomainParticipant/DataReader/DataWriter 실행 엔진 연동.
3. C++ Handler 구현/삽입, Command arbitration, lifecycle, 메모리·동시성·예외 처리.
4. Component Host 및 실제 `.so`/`.dll` 로딩·배포·테스트.
5. System Assembly와 실제 Deployment 실행/교차 Component QoS 연결 검증.

## 위험 항목

- 현재 `messageTypeId`와 `messages[]`는 과거 이름. UI만 `Data Type`으로 바꾼 상태라 **단순 명칭 일괄 치환 위험**.
- 표준 ICD-Mock Type의 Override가 공식 IDL을 바꾸지 않는다는 점을 더 명시적으로 보여야 함.
- Large Collection QoS/동기화 및 Generalization/Specialization의 topic pair를 **그림만으로 완료된 것처럼 보이게 하면 위험**.
- 빌드 성공(모의 DLL/SO 컴파일 가능)과 DDS 네트워크 통신/UMAA 호환성은 서로 다른 검증 수준.
- 표준 문서의 개별 ICD 릴리스마다 정식 메시지명·토픽명·정책이 달라질 수 있으므로 카탈로그를 버전 지정해야 함.
