# 07. 버전 흐름과 병합 기준

| 버전 | 소스 위치 | 핵심 변화 | 유지·주의 |
|---|---|---|---|
| 0.8.2 | `history/UMAA_Development_Studio_v0.8.2_...zip` | Types Struct Diagram, 편집 Inspector, Output/Console 간소화 | 서비스 카탈로그/프로젝트 초기 모델 |
| 0.8.3 | `history/UMAA_Development_Studio_v0.8.3_...zip` | UML Generalization 시각화, Type/Field/Enum 편집, Project Override·복원, 독립 Message Struct | v0.9.x에 통합 완료; 원본 덮어쓰기 금지 |
| 0.9 | `history/UMAA_Development_Studio_v0.9_...zip` | Component-first Journey, Provider/Consumer 조립, 다음 단계 가이드 | 신규 데이터 Asset 관련 기능은 미포함 |
| **0.9.1** | **`project/`** | v0.9 + v0.8.3 통합; 독립 Asset Library, Flow Control/Report 분류, Topic Data Patterns, QoS Profile 관계, 메타데이터 | **현재 작업 기준**; 실제 DDS runtime 및 공식 DDS-JSON 컨버터 미구현 |

## 브랜치/병합 배경

0.8.3과 0.9는 각각 0.8.2 계열에서 다른 기능을 개발했으므로 두 ZIP은 단순한 선형 버전 차이가 아님. 0.9.1은 0.9 UX 코드베이스 위에 0.8.3 Type Editor 개선 및 새 ICD Asset 기능을 통합한 결과다. 향후 변경은 `project/`를 기준으로 진행할 것.

## 이전 인계/문서 메모

- `project/docs/COMPONENT_FIRST_UX_V0_9.md`: Component Journey 상세.
- `project/docs/ICD_ASSET_MODEL_V0_9_1.md`: ICD Assets/Flow/Topic Relations/QoS 구현과 한계.
- `project/docs/ICD_MOCK_TYPES_V0_8_1.md`: 초기 Mock Type 범위.
- `project/docs/BUILD_VERIFICATION_V0_9.md`: **과거** 검증 기록.
- `project/preview/archive/`: 과거 독립 UX 프로토타입.
