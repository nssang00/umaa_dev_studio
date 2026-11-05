# 05. 설치 / 테스트 / 검증 상태

## 환경/재현

인계 검증 날짜: **2026-11-05**. 현재 컨테이너는 Node `v22.16.0`, npm `10.9.2`; `node_modules` 없음.

```bash
cd project
npm install                # 인터넷/패키지 레지스트리 접근이 가능한 환경에서
npm run check:static
npm run build
npm test
```

`npm run build` 후 프로젝트 루트 `index.html`에서 최신 React UI 확인. 별도 `PREVIEW_UI.html`은 이전 독립 HTML 시안으로서 실제 React 실행이 아님.

## 이번 인계시 실제 실행 결과

| 명령 | 결과 | 이유/범위 |
|---|---|---|
| `npm run check:static` | PASS | 구성·코드 경로에 대한 정적 확인 |
| `npm run test:icd` | PASS | Autopilot seed / DDS 계약 / codegen 모델 테스트 |
| `npm run test:design` | PASS | 설계 모델 |
| `npm run test:workbench` | PASS | Workbench 모델 |
| `npm run test:graphs` | PASS | 모델 그래프 |
| `npm run test:idl-mock` | PASS | Mock IDL/타입 |
| `npm run test:struct-ui` | PASS | UML/Console 정적/UI 구조 |
| `npm run test:preview` | PASS | 독립 preview 관련 테스트; 실제 React browser E2E와 다름 |
| `npm run test:icd-assets` | PASS | ICD Asset 관계 |
| `npm run test:type-override` | PASS | Type 수정/Override |
| `npm run test:icd-ui` | PASS | ICD UI 연결 정적 테스트 |
| `npm run build` | **BLOCKED** | `ERR_MODULE_NOT_FOUND`: `esbuild` 미설치 |
| `npm run test:layout` | **BLOCKED** | `ERR_MODULE_NOT_FOUND`: `@dagrejs/dagre` 미설치 |
| `npm test` 전체 | **미검증** | 테스트 중 `test:layout` 의존성 부재 때문에 전체 패스 불가 |
| 브라우저에서 최신 React 앱 실행 | **미검증** | 실제 JS bundle 미생성 |
| DLL/SO 실제 컴파일·DDS 네트워크 실행 | **미검증/기능 미구현** | 분리된 개발 단계 |

위 `PASS`는 해당 Node 테스트 스크립트가 반환한 종료 코드 기준. UI 전체/표준 준수 인증을 의미하지 않음.

## 수동 E2E 체크리스트(새 환경에서 반드시 수행)

- [ ] `npm install`, `npm run build`, `npm test` 모두 성공
- [ ] 초기 `My Components` 진입 및 단계 UI 표시
- [ ] 새 Component 생성 → Service Provider/Consumer 추가 및 삭제
- [ ] Asset Library에서 Custom Service 생성 → Operation 및 Topic 연결
- [ ] 독립 Custom Data Type 생성/Field 편집/선택 → Topic 생성
- [ ] Custom QoS Profile 생성/수정, Base Profile 참조 및 순환 금지
- [ ] Large Set/List와 Generalization/Specialization Topic 관계 추가/삭제
- [ ] v0.8.3 Type UML 편집/Override/복원 및 참조 무결성
- [ ] 프로젝트 JSON Export→Import→재진입 후 관계/선택값 유지
- [ ] 정적 Validation 오류 클릭 시 관련 편집 화면으로 이동
- [ ] Component 코드 골격 ZIP 생성 후 내부 CMake/IDL/JSON 파일 확인
- [ ] macOS/Windows/Linux 환경별 CMake scaffold 컴파일 별도 확인
- [ ] 공식 UMAA IDL/DDS 실제 호환성은 이 범위에서 **PASS 표시 금지**

## 알려진 문서 주의

`project/BUILD_TESTS.md`, `project/UI_REVIEW_GUIDE.md`, `project/docs/BUILD_VERIFICATION_V0_9.md`는 이전 단계별 검증 기록일 수 있음. **이 인계의 최신 확인 결과는 이 파일**과 `START_HERE.md`를 우선할 것.
