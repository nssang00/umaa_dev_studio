# 09. 인수인계 체크리스트

## 받는 사람이 1일 차에 확인할 것

- [ ] 이 패키지의 `START_HERE.md` 확인.
- [ ] `project/package.json` 및 `project/docs/ICD_ASSET_MODEL_V0_9_1.md` 확인.
- [ ] Git 저장소로 `project/`를 기준 커밋하고 무결성 해시 기록.
- [ ] `npm install`, `npm run build`, `npm test` 실제 실행.
- [ ] Component / Service / Topic / Type / QoS 생성·저장·생성 산출물 UI 검증.
- [ ] 공식 UMAA ICD/IDL 파일 버전과 경로 확보(현재 패키지에는 포함 안 됨).
- [ ] 현재 Mock/프로토타입/미구현 항목을 프로젝트 이슈 목록으로 등록.

## 변경 작업 규칙

- [ ] UI 명칭은 ICD 기준(`Topic`, `Data Type`, `Attribute`)으로 일관.
- [ ] `Report/Status`를 Flow Control 타입으로 추가하지 않음.
- [ ] Topic 생성 ≠ Endpoint 생성; Service Operation과 Binding 연결 전에는 DDS Endpoint 없음.
- [ ] 표준 라이브러리와 사용자 정의 자산·Mock Override 출처를 구분.
- [ ] `schemaVersion: 3` 프로젝트 JSON 하위 호환성 체크.
- [ ] 그래프 데이터와 실제 Snapshot 모델 간 참조 무결성 유지.
- [ ] 실제 DLL/SO 코드 생성·DDS 동작을 테스트하지 않고 '완성' 표시하지 않음.

## 패키지 무결성

- `SHA256SUMS.txt`는 ZIP *내부 파일*에 대한 해시 목록임. 해당 SHA256SUMS 자체는 해시 목록에서 제외.
- `MANIFEST.json`에 기본 통계와 원본 경로, 테스트 상태가 들어 있음.
- 이전 버전 아카이브는 비교·복구용이므로 현행 작업 기준 소스로 사용하지 말 것.
