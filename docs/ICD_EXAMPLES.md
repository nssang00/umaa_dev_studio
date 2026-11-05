# UMAA 6.0 ICD 기반 Mock 관계 예제

이 파일은 구현 중인 Web IDE에서 **어떤 정보가 표준 원문에서 나왔고 어떤 정보가 설계 예시인지** 구분한다.

## 범위

- Functional Area: 공식 UMAA 기능 분류 8개 (MM, MO, EO, SEM, CO, SA, PO, SO)
- 이 앱에 입력한 표준 Service 예시: 5개 FA(SA/MO/EO/MM/SO), Service 14개
- 선택한 공개 Component Definition: USV Navigation, Autopilot, Mission Executor, Weather, Water Environment, Logging, COLREGS and Hazard Avoidance의 **일부 역할** (전체 사양 복원 아님)
- 14개의 `ServiceInterface` 객체는 앱에서 **Operation을 묶어 탐색하기 위해 만든 뷰 모델**이다. 공식 SoaML ServiceInterface 객체의 완전한 식별자와 구조를 보장하지 않는다.
- 56개 Operation과 32개 Topic은 아래 표에 적힌 ICD 실제 명칭을 기준으로 구성했다. v0.8.1부터 32개 메시지의 일부 속성 및 17개 공통 구조체가 **ICD 기반 목 데이터**로 추가되었으며, 모든 공식 IDL 정의를 복원한 것은 아니다.
- Component의 배포 경계와 Service 연결선은 사용자 아키텍처의 **예시 배치**이며, 고정된 표준 통신 경로를 의미하지 않는다.

## Service, Operation, Topic / Type 매핑

| FA | Service | Flow Control | 보고/명령 Operation → Topic / IDL Type | 기본 문서 |
|---|---|---|---|---|
| SA | GlobalPoseStatus | Request/Reply | reportGlobalPose → GlobalPoseReportType | SA ICD 6.1.6 |
| SA | SpeedStatus | Request/Reply | reportSpeed → SpeedReportType | SA ICD 6.1.10 |
| SA | VelocityStatus | Request/Reply | reportVelocity → VelocityReportType | SA ICD 6.1.12 |
| SA | WaterCurrentStatus | Request/Reply | reportWaterCurrent → WaterCurrentReportType | SA ICD 6.1.13 |
| SA | WindStatus | Request/Reply | reportWind → WindReportType | SA ICD 6.1.14 |
| SO | HealthReport | Request/Reply | reportHealth → HealthReportType | SO ICD 5.1.1 |
| SO | LogReport | Request/Reply | reportLogReport → LogReportType | SO ICD 5.1.2 |
| EO | UVPlatformSpecs | Request/Reply | reportUVPlatformCapabilities → UVPlatformCapabilitiesReportType; reportUVPlatformSpecs → UVPlatformSpecsReportType | EO ICD 6.1.14 |
| MM | ConditionalReport | Request/Reply | reportConditional → ConditionalReportType; LargeSet element → ConditionalReportTypeConditionalsSetElement | MM ICD 6.1.3 및 ICD 3.8 |
| MO | GlobalVectorControl | Command/Response | setGlobalVector → GlobalVectorCommandType; reportGlobalVectorCommandStatus → GlobalVectorCommandStatusType; reportGlobalVectorCommandAck → GlobalVectorCommandAckReportType; reportGlobalVectorExecutionStatus → GlobalVectorExecutionStatusReportType | MO ICD 6.1.5 |
| MO | GlobalHoverControl | Command/Response | setGlobalHover → GlobalHoverCommandType; reportGlobalHoverCommandStatus → GlobalHoverCommandStatusType; reportGlobalHoverCommandAck → GlobalHoverCommandAckReportType; reportGlobalHoverExecutionStatus → GlobalHoverExecutionStatusReportType | MO ICD 6.1.4 |
| MO | PrimitiveDriverControl | Command/Response | setPrimitiveDriver → PrimitiveDriverCommandType; reportPrimitiveDriverCommandStatus → PrimitiveDriverCommandStatusType; reportPrimitiveDriverCommandAck → PrimitiveDriverCommandAckReportType; reportPrimitiveDriverExecutionStatus → PrimitiveDriverExecutionStatusReportType | MO ICD 6.1.7 |
| MM | ActiveConstraintsControl | Command/Response | setActiveConstraints → ActiveConstraintsCommandType; reportActiveConstraintsCommandStatus → ActiveConstraintsCommandStatusType; reportActiveConstraintsCommandAck → ActiveConstraintsCommandAckReportType | MM ICD 6.1.1 |
| MM | MissionPlanConstraintControl | Command/Response | setMissionPlanConstraintAdd / Delete → 각 CommandType; report...CommandStatus → 각 CommandStatusType; report...CommandAck → 각 CommandAckReportType | MM ICD 6.1.4 |

일반적인 Query Operation(`queryGlobalPose` 등)은 **해당 Report Topic에 대한 subscribe**로 모델링한다. Cancel Operation(`cancelGlobalVectorCommand` 등)은 **Command Topic 인스턴스 dispose**에 연결한다. 이것들을 독립적인 Query/Cancel 메시지 타입으로 생성하지 않는다. `GlobalVectorControl`, `GlobalHoverControl`의 Command, Status, Ack, Execution Status는 서로 다른 Topic에 대응한다.

Large Set은 단순 `sequence` 필드로 처리하면 안 된다. `ConditionalReportType.conditionals`의 Metadata Topic과 `ConditionalReportTypeConditionalsSetElement` 요소 Topic을 별도로 선언하고 Element의 도착 순서 및 Metadata 동기화를 수행해야 한다. Mock에서는 Topic 관계와 논리 Reader/Writer Endpoint만 파생하며 실제 원자적 동기화 코드는 아직 구현하지 않았다.

## 역할 예제와 실제 DDS Endpoint

**SA/GlobalPoseStatus**

- `USV Navigation`이 Provider로 참여하면 `GlobalPoseReportType` **Writer**를 갖는다.
- `Autopilot`, `Mission Executor`, `COLREGS and Hazard Avoidance`가 Consumer로 참여하면 같은 Topic **Reader**를 갖는다.
- `queryGlobalPose`는 Reader subscription이고 요청 Topic을 만들지 않는다.

**MO/GlobalVectorControl**

- `Mission Executor` Consumer는 Command Topic Writer 및 Status/Ack/Execution Status Readers를 갖는다. Ack/Execution 구독은 필요한 경우 선택한다.
- `Autopilot` Provider는 Command Topic Reader 및 Status/Ack/Execution Status Writers를 갖는다.
- 목적지 GUID, sessionID, state machine, 재시작 복구·dispose는 **개별 데이터 Topic 매핑을 넘어서는 Flow Control**이다.

**MM/ConditionalReport (Large Set)**

- `Mission Executor` Provider는 Metadata Report와 Element Topic Writer를 필요로 한다.
- `Autopilot`, `COLREGS and Hazard Avoidance` Consumers는 각 Topic Reader와 **집합 일관성 복구** 처리가 필요하다.

## Provider/Consumer의 의미

UMAA Component는 하나 이상의 Service Participant(Provider/Consumer)를 묶는다. 한 Component가 여러 Service에 참여하거나 같은 Service를 P/C 모두로 구현할 수 있다. **Service 정의는 실제 실행 파일이 아니며**, DLL/SO 또는 여러 프로세스 분할은 도구의 설계 선택이다. 실제 DDS는 서비스 연결 Edge마다 전용 채널을 만들지 않고 Topic, Participant, Domain, QoS/Filter 등의 정책에 따라 전달된다.

참조: `UMAA Component Definitions v1.0` Section 1.2, `UMAA Compliance Specification Rev.1` Chapter 1, `UMAA 6.0` SA/MO/EO/MM/SO ICD. Autopilot Component Definitions v1.0 §3.1.3의 14개 Service/역할은 모두 입력했으나, 나머지 Component의 서비스 관계와 모든 UMAA Service를 입력한 것은 아니다. 실제 `.idl` 원본을 공식 배포물에서 import하지 않았고 ICD 속성표를 참고한 목 필드만 추가했으므로 실제 DDS 호환 구현으로 취급하면 안 된다.
