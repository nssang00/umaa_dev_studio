# UMAA 6.0 공개 문서 서비스 개수 — 범위 구분

집계 시점: 2026-11-04. 공개 UMAA ICD 6.0 PDF의 Section `x.1.N` Service heading을 기준으로 계산. **Service 정의 개수**를 세며 Operation/Topic/Component Binding은 제외.

| 범위 | Service 항목 수 | 설명 |
|---|---:|---|
| 본 JavaScript Mock Catalog | **14** | Autopilot Component Definitions v1.0의 Provider 7 + Consumer 7을 모두 포함 |
| MM ICD | 14 | 일반 UMAA 서비스 |
| MO ICD | 7 | 일반 UMAA 서비스 |
| EO ICD | 14 | 일반 UMAA 서비스 |
| SEM ICD | 3 | 일반 UMAA 서비스 |
| SA ICD | 14 | 일반 UMAA 서비스 |
| SO ICD | 2 | 일반 UMAA 서비스 |
| **일반 ICD 6종 합계** | **54** | 실험적 서비스 제외; PO 독립 ICD 없음 |
| EXP ICD 6.0 | **75** | 실험적 서비스, UMAA 적합성 필수 대상 아님 |
| CO-EXP ICD 6.0 | **11** | 통신운용 실험적 서비스, UMAA 적합성 필수 대상 아님 |
| **위 8개 ICD 문서 수록 행 합계** | **140** | 중복 포함; 일반 인증 대상 140개라는 뜻 아님 |
| **고유 단순 Service 명칭** | **139** | `ContactFilterConfig`가 EXP와 CO-EXP 모두에 나타남 |

**주의:** 54는 일반 ICD에 수록된 서비스 수이지 모든 실험적 서비스를 포함한 UMAA 6.0 전체 서비스 수가 아닙니다. 문서 중복·릴리스 분류·시험적 서비스 포함 여부에 따라 “전체”의 숫자가 달라집니다.

출처: 라이브러리에 등록된 UMAA-SPEC-{MM,MO,EO,SEM,SA,SO}ICD-v6.0, UMAA-SPEC-EXP-ICD, UMAA-SPEC-CO-EXP-ICD, Distro_A_UMAA_Component_Definitions_v1.0.
