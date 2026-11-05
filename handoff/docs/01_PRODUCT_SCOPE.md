# 01. 제품 목표 / 현재 구현 경계

## 제품 정의

UMAA Development Studio는 UMAA **공식 서비스 계약을 참조**하면서 사용자가 독립적인 프로젝트 Asset을 생성하고 Component를 제작하는 시각적 개발 환경이다. Unity/Blender의 특정 UI를 복사하는 것이 목표가 아니다. 채택할 원칙은 **재사용 가능한 Asset 생성 → 관계 연결 → 편집 → 검증 → 산출물** 작업 흐름이다.

## 사용자 시나리오

1. Asset Library에서 `Service`, `Topic`, `Data Type`, `QoS Profile`을 독립 생성·조회한다.
2. Custom Service에 `Operation`을 만들고 DDS Action/Topic에 매핑한다. Query, Cancel은 항상 새 Topic이 필요한 것이 아님.
3. 새 Component를 만들거나 기존 Component의 Service Binding 구성을 템플릿처럼 복사한다.
4. 필요한 Service를 `Provided Service` 혹은 `Consumed Service`로 바인딩한다.
5. 필요하면 Type UML, Topic Data Pattern, QoS Runtime, Behavior/Assembly를 편집한다.
6. 정적 모델 검증 후 해당 Component의 C++/CMake scaffold와 계약 파일을 ZIP으로 내보낸다.

## 현재 실제 구현

- v0.9 Component Journey, Component 목록/Provider·Consumer 바인딩, 우측 안내.
- v0.9.1 Asset Library: Service, Topic, Data Type, QoS Profile 카탈로그 및 Custom 생성.
- Service Flow Control / Report 분리 표시: `Command / Response`, `Request / Reply`, `Status / Report`.
- v0.8.3 UML Type Editor 편집 기능 통합; 프로젝트 단위 ICD-Mock Type Override/복원.
- Data Patterns: Large Set/List, Generalization/Specialization의 Topic 관계 참조/다이어그램.
- QoS Profile: 프로젝트 정의, Base Profile 참조, Presentation 등 부분 정책, 사용 Component 관계도.
- 정적 검증·계약 메타데이터·C++ scaffold와 Custom IDL 생성.

## 아직 **구현 또는 검증하지 않은 것**

- 공식 UMAA `.idl` 원본에서 완전한 타입 그래프 가져오기·IDL Compiler/TypeSupport 연결.
- UML 상속을 포함한 실제 DDS Generalization/Specialization **동기화 실행**.
- Large Set/List의 Metadata/Element 메시지 송수신/조립, 전체 필수 QoS 적용.
- Command/Response의 상태 머신·destination GUID/sessionID/cancel/dispose·정확한 실행 처리.
- OMG DDS-JSON Types/QoS Schema 전 범위 import/export 및 검증.
- Requested/Offered QoS 호환성 판정, 실제 DDS 벤더 SDK 적용, DDS 메시지 통신.
- React 실제 번들 빌드 및 브라우저 E2E(이 인계 실행 환경에서는 패키지 의존성 미설치).
- Studio가 최종 DLL/SO 바이너리를 직접 빌드·실행·호스팅하는 기능.

## 의사결정 기준

- **ICD 용어 우선**, DDS 전문용어는 실제 동작을 설명할 때 정확히 사용.
- **표준과 프로젝트 정의의 경계 유지**. 공식 원본은 불변 참조, 사용자 확장은 별도 ID/출처 표시.
- **프로젝트 모델이 단일 진실 공급원**. 다이어그램 Node/Edge는 그로부터 파생(뷰).
- 사용자에게 별개 Asset의 생성 자유를 주되, 최종 생성 전 관계·호환성 검증을 제공.
- 코드 골격/모의 결과와 실제 빌드/호환성 상태를 혼용하지 말 것.
