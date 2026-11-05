# 08. 표준 / 외부 참조 (앱 소스에 포함되지 않음)

## UMAA 6.0 ICD/Component 모델

- `Distro_A_UMAA_Component_Definitions_v1.0.pdf` — §1.2 Component = Provider/Consumer(+비-UMAA Interface), Definition / Specification / Design.
- `UMAASDK_Autopilot_Specification_DistA.pdf` — §3.2 Component Port: Service Provider/Consumer 방향, Interface Block 및 Operation Proxy Port; §5 Topic + Data Type.
- `UMAA-SPEC-EOICD` v6.0 — §3.4 Naming, §3.8 Large Collections, §3.9 Generalization/Specialization, §5.1 Command/Response, §5.2 Request/Reply, §6.1 Service/Operation Topic/Data Type/Message Definition.
- `UMAA-SPEC-MOICD-v6.0.pdf` — §6.1 `GlobalVectorControl`, `setGlobalVector`: Topic와 Data Type 필드가 같은 문자열이라도 별개의 의미.
- 표준 문서 PDF 및 실제 `.idl`은 **이번 소스 패키지에 들어 있지 않음**. 라이브러리/정식 배포 파일을 다시 연결해야 구현 정확성 검증 가능.

## OMG DDS-JSON 공식 Schema (참조 URL)

- Types: https://www.omg.org/spec/DDS-JSON/20190601/dds-json_types.schema.json
- QoS: https://www.omg.org/spec/DDS-JSON/20190601/dds-json_qos.schema.json

**중요:** 현재 v0.9.1은 위 Schema를 **설계 참고 자료로만 사용**하며, 파일의 실제 완전한 스키마 구조를 100% 지원하는 데이터 변환기/검증기가 아님. JSON Schema 준수와 DDS 런타임 QoS 호환성은 또 다른 수준.

## 기술 라이브러리

- React 18, React Flow `@xyflow/react` v12, Ant Design 5, Zustand 5, Dagre 3, esbuild, JSZip. 정확한 버전 범위는 `project/package.json` 참조.

## 파생 모델의 규정성

Studio의 `Service Binding`, `Service Category`, `Asset Library`, `Data Patterns` 관계 객체는 사용자 모델링을 돕기 위한 **제품 설계 개념**이다. 해당 클래스명이 모두 공식 UMAA UML에서 동일한 모델 요소로 정의된 것으로 소개하지 말 것.
