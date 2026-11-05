# UMAA Development Studio — HANDOFF / START HERE

**인계 기준:** 2026-11-05 (Asia/Seoul)  
**현재 기준 소스:** `project/` = UMAA Development Studio **v0.9.1 ICD Assets**  
**가장 먼저 읽을 문서:** 이 파일 → `docs/01_PRODUCT_SCOPE.md` → `docs/02_DOMAIN_TERMS_AND_RELATIONSHIPS.md` → `docs/04_ENGINEERING_MAP.md` → `docs/05_BUILD_AND_VERIFICATION.md` → `docs/06_NEXT_STEPS.md`

## 30초 요약

- 목표: UMAA를 공부한 개발자가 **Service, Topic, Data Type, QoS 등을 독립적으로 생성·재사용**하고, 이를 **Component에 Provider/Consumer로 조립**한 후 **C++ shared-library 코드 골격**을 얻는 모델 기반 Studio.
- UX: **Component 생성 → Service 조립 → 검증 및 코드 골격 생성**. 독립 Asset Library, Service Flow Control/Report 조회, UML Type Editor, Data Patterns, QoS Profile 관계도와 System Assembly 병행.
- 용어: UMAA ICD를 우선. `Service / Service Interface / Operation / Topic / Data Type / Attribute / Flow Control`; Report/Status는 **Service 성격 또는 report Operation**이고 별도 Flow Control이 아님.
- 현재 산출물: `.so/.dll` 자체나 DDS 연동 컴포넌트가 아닌, **C++/CMake shared-library scaffold + 사용자 정의 IDL/계약 및 런타임 설정 메타데이터**. 실제 DLL/SO 컴파일은 생성물을 외부 CMake 환경에서 수행해야 함.
- 공식 표준: UMAA 원본 ICD/IDL 변경 불가. 현재 포함된 Type 목록 일부는 ICD 기반 **Mock**이며, 공식 IDL 파서나 DDS 와이어 호환성의 증거가 아님.

## 로컬 시작

```bash
cd project
npm install
npm run build
npm test
```

`npm run build` 후 루트 `project/index.html`을 브라우저에서 열어 확인. `PREVIEW_UI.html` 및 `preview/*.html`은 **독립 HTML 컨셉/과거 시안**으로 최신 React 번들과 다름. 데이터는 현재 **브라우저 localStorage 기반 Mock Repository**에 저장되므로 중요한 프로젝트는 UI의 JSON 내보내기로 백업.

## 이번 인계 시 실제 확인된 것

- `npm run check:static`: PASS
- `test:icd`, `test:design`, `test:workbench`, `test:graphs`, `test:idl-mock`, `test:struct-ui`, `test:preview`, `test:icd-assets`, `test:type-override`, `test:icd-ui`: **10개 스크립트 PASS** (각각의 테스트 그룹 내 복수 assertion 가능)
- `npm run build`: 이 환경에 **esbuild 미설치**로 실행 불가. `test:layout` 역시 `@dagrejs/dagre` 미설치로 실행 불가. 전체 `npm test`, React 브라우저 E2E **미검증**.
- 검증 현황은 `docs/05_BUILD_AND_VERIFICATION.md`에서 재현 가능.

## 인계 패키지 구조

```text
START_HERE.md                 ← 이 문서
project/                      ← 현재 공식 작업 기준 v0.9.1 전체 React 소스 + 프로젝트 기존 문서/테스트/미리보기
history/                      ← 원본 v0.8.2 / v0.8.3 / v0.9 ZIP (비교·복구용)
docs/                         ← 이번 인계용 신규 문서 9종
MANIFEST.json                 ← 패키지 파일 수/해시/기준 정보
SHA256SUMS.txt                ← 패키지 내 개별 파일 SHA256 목록
```

## 중요: 버전 병합 시 준수

- `v0.9.1`을 **기준(base)** 으로 사용하고 `v0.8.3` 소스 파일을 통째로 덮어쓰지 말 것. v0.8.3의 UML Type 편집 기능은 v0.9.1에 이미 통합됨.
- `source: standard` / ICD 기반 Mock / `source: custom` / Project Override를 구분. 표준 `Data Type`을 편집해도 공식 UMAA IDL 변경이 아님.
- 새로운 Topic 또는 Data Type을 생성했다고 DDS Endpoint가 자동 생성되는 것은 아님. **Operation → Topic + Component Service Binding** 연결이 필요.
- 기존 JSON `schemaVersion: 3` 프로젝트가 열리도록 마이그레이션 유지. 새 `topicRelations`, QoS fields 등은 선택적.
- 코드 생성 성공과 실제 DDS 런타임/UMAA 준수 검증 성공을 UI에서 혼동하지 말 것.

## 바로 이어서 할 일

1. 의존성 있는 환경에서 `npm install && npm run build && npm test` 통과시킬 것.
2. Chrome/Edge에서 Service·Topic·Data Type·QoS 생성→저장→JSON 재가져오기→Component 바인딩→코드 골격 ZIP을 E2E 테스트할 것.
3. UML Type Override, Topic 관계, QoS Base Profile, 서비스 계약 편집 상호 일관성과 검증 메시지를 점검할 것.
4. 공식 UMAA `.idl`/ICD/EA 원본 로더 및 ID 추적, OMG DDS-JSON 매핑/검증을 구분해 단계적으로 구현할 것.
5. 그 후 DDS Vendor SDK와 런타임 연동을 추진할 것.

**참고:** 이번 인계 작업은 문서화 및 재압축이며, v0.9.1 애플리케이션 기능 코드는 수정하지 않았음.
