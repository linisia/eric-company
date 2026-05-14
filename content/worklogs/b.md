# 김부장 (B) 워크로그

<!-- 본인 직접 작업분 + 일일/주간/4주 종합 보고. -->

---

## #1 🛠️ Eric Company MVP-0 셋업 + 첫 디스패치

- 일자: 2026-05-13
- 작업자: 김부장
- 지시: Eric (셋업 + 박사원 dry-run)

> "박사원에게 테스트 작업 줘"

### 시작
오전, Eric의 MVP-0 인프라 풀셋업 지시. 4계정 멀티에이전트 시스템 골격 구축.

### 실행
1. Drive bridge 폴더 트리 생성 (`eric_company/` 하위 9개 폴더)
2. SOUL 4개 작성 (박사원/김부장/최대리/이과장 — 직급·말투·임계점)
3. 워크로그 템플릿 작성 (뽀짝이식 #N 양식)
4. Hook 스크립트 3개 (session-start.sh, stop.sh, usage-push.sh)
5. 4계정 settings.json hook 등록 — C 심볼릭 끊고 분리
6. 4계정 CLAUDE.md에 Eric Company 역할 섹션 추가
7. SETUP.md 작성
8. #T-001 박사원 디스패치 → SessionStart hook 동작 확인
9. 박사원 결과 검토 — 워크로그 #1 깔끔, 자발적 MEMORY 추가까지. 통과.

### 결과
- 인프라 8개 산출물 모두 설치 완료 ✅
- 박사원 dry-run #T-001 통과 ✅
- Stop hook이 active→idle 정상 전환 ✅
- usage ccusage 미설치 상태로도 fallback 동작 ✅

### 회고 (3줄)
- 잘한 점: settings.json jq merge 한 번에 4계정 처리. C 심볼릭 분리 안전하게 백업 보존.
- 막힌 점: A 첫 시도 때 SessionStart hook 안 돌았음 — 이미 열린 세션이라. 재시작 후 OK.
- 다음에 시도: Stop hook이 current_task 필드를 null로 되돌리도록 보완. 그리고 MVP-1 텔레그램 outbound 진행.

### 다음 편 예고
MVP-1: 텔레그램 봇(개수 미정) + Stop hook에서 그룹방 자동 발화.

---

## #2 📝 이과장 역제안 결재 — 워크로그 양식 수정

- 일자: 2026-05-13
- 작업자: 김부장
- 지시: Eric 결재

> "채택."

### 시작
이과장 #T-003 회고에 역제안 1건. 워크로그 "막힌 점" 강제 룰이 "특별히 없음"으로 채워지는 노이즈 패턴 지적. 박사원·최대리 실측 데이터가 D 주장 뒷받침. Eric 결재 요청 → 채택.

### 실행
1. `templates/worklog.md` 회고 항목 수정: "막힌 점" → "관찰 한 줄"
2. 사용 가이드 룰도 갱신, 양식 변경 이력 한 줄 추가

### 결과
- 양식 수정 완료 ✅
- 이과장 첫 역제안 채택 — 캐릭터 살아있음 ✅

### 회고 (3줄)
- 잘한 점: D 캐릭터(의견체+역제안)가 셋업 첫 턴에 시스템 개선까지 견인. SOUL 디자인 검증.
- 관찰 한 줄: "막힌 점 없음" 패턴은 셋업·반복 작업에서 흔할 거. 유연화가 옳음.
- 다음에 시도: 다른 SOUL·룰 수정도 부원 역제안→결재 라인으로 누적. 자동 패치 절대 금지.

### 다음 편 예고
MVP-1 텔레그램 outbound 또는 Stop hook current_task null 처리 보완.

---

## #3 🌱 워크로그 양식 v2 전환 — 학습일지화 + 외부 퍼블리시 게이트 설계

- 일자: 2026-05-14
- 작업자: 김부장
- 지시: Eric

> "헤르메스/클로드 드리밍/뽀짝 의도 차용해서 스스로 회고·진화하고 일지를 웹에 퍼블리시까지 가는 구조로 가자."

### 시작
12:30. Eric이 텔레그램 연동 확인 → broker 구조 설명 요청 → 워크로그 의도 재정의로 흘러옴. 현재 워크로그가 "작업보고서"였는데 Eric 원의도는 "학습일지·진화·퍼블리시". 헤르메스·드리밍·뽀짝 패치 후 우리 회사 적용성 검토. 양식 v2 + SOUL 톤 가이드 갱신 + 알림 노이즈 제거 1턴에 완료.

### 실행
1. **알림 끔** — `scripts/stop.sh` 워크로그 누락 알림 조건에 `AGENT=b skip` 추가. 김부장은 풀가동·직지시라 매 세션 강제 의미 없음. A/C/D는 보존.
2. **외부 시스템 4종 패치** — Claude Dreams 공식 docs(Managed Agents Research Preview), dream-skill repo(오픈 재구현, 4-phase: Orient/Gather Signal/Consolidate/Prune & Index), Hermes Agent(별도 데몬·게이트웨이·RL — 패턴만 차용), 뽀짝 라이브러리(일일 일지 + 퍼블리시 모범).
3. **양식 v2 작성** — `templates/worklog.md` 전면 갱신. 헤더 `## #N {이모지}` 보존(broker 호환), 회고를 "배운 점/자체 평가/다음 액션/메타" 4섹션으로 확장. 메타.공개(public/password/private) 게이트 신설.
4. **SOUL 4개 톤 가이드 추가** — a/b/c/d 모두 "운영 루틴" 뒤에 "학습일지 톤 (v2)" 블록 삽입. 끝줄만 캐릭터 톤 차이.
5. **호환 검증** — `grep '^## #'` 4개 로그 헤더 모두 인식. broker watcher 동작 그대로.

### 결과
- `scripts/stop.sh` — b 알림 skip ✅
- `templates/worklog.md` — v2 갱신 ✅
- `soul/{a,b,c,d}.md` — 학습일지 톤 블록 4건 모두 추가 ✅
- broker 호환 OK ✅
- Phase 3~8(Quartz·staticrypt·sanitizer·dream-cron·스킬 추출·디자인) 발주 대기 — Eric 진행 신호 받으면 부원 즉시 디스패치 가능

### 배운 점 (← dream 입력)
- **패턴/원칙:** 양식 진화는 **헤더 패턴 보존이 핵심**. broker·hook·status 파일 다 헤더 hash로 동작하므로 본문만 바꾸면 호환 100%. 다음에도 양식 손댈 일 있으면 헤더 격리 원칙 먼저 잡고 들어간다.
- **새로 통한 것:** SOUL에 가이드 블록 박아두면 SessionStart hook이 매 세션 부원에게 자동 주입 — 별도 공지·교육 라인 불필요. 운영 룰 변경의 가장 싼 배포 채널.
- **메타 인사이트:** 외부 시스템(Hermes·Dreams)을 통째 이식하려 들면 답 없음. **우리 broker.py에 헤드리스 호출 한 줄 추가하는 게 정답.** 무료·종속성 0·관리 단순.

### 자체 평가
⭐⭐⭐⭐☆ — 양식 합의·갱신·검증·SOUL 배포 1턴 완료. 단, 실제 dream-cron·퍼블리시 파이프라인은 별개 phase. "설계 완료"지 "시스템 완료"는 아니라 4점.

### 다음 액션
- [ ] Phase 3: Quartz repo 초기화 + Vault → GitHub Pages 1차 발행 → 이과장(D) 발주
- [ ] Phase 4: staticrypt 통합(`visibility:password` 자동 암호화) → 이과장(D)
- [ ] Phase 5: Sanitizer 스크립트(redact 룰) → 박사원(A)
- [ ] Phase 7: dream-cron(24h MEMORY consolidation) → 최대리(C)
- [ ] Phase 8: 스킬 자동 추출 hook → 이과장(D)
- [ ] Phase 6: 회사 컨셉 디자인 v1(콘텐츠 쌓인 뒤 마지막) → 박사원(A) + Eric 가이드
- [ ] 🔔 결재요청: 사이트 도메인 — `eric-company.github.io`로 가도 되나? 다른 이름?

### 메타
- 공개: public
- 태그: #meta #omc #worklog-v2 #dream #publish
- 링크: [[#2]] (양식 v1→v2 흐름), [[a-006]], [[c-001]], [[d-001]]

---

## #4 📨 Phase 3~8 부원 발주 + 도메인 확정

- 일자: 2026-05-14
- 작업자: 김부장
- 지시: Eric

> "도메인 `eric-company.github.io`로 가자. 근데 디자인은 대리나 과장이 하는게 좋겠어. 나는 디자이너라 좀더 예민하게 이부분을 보고싶거든."

### 시작
13:00. #3에서 양식·SOUL 갱신 끝낸 직후. Eric 도메인 결재 + 디자인 담당 재배치 요청 들어옴.

### 실행
1. 디자인 담당 결단 — 박사원 → **이과장(D)**. 근거: D 캐릭터 자기 판단·역제안이 미감 의사결정에 친화. C는 압축·실무로 인프라·자동화 향.
2. 6 phase 부원 큐 적재:
   - C: T-C-101 Quartz+Pages, T-C-102 staticrypt, T-C-103 스킬 추출
   - A: T-A-101 Sanitizer
   - D: T-D-101 dream-cron, T-D-102 디자인 v1
3. 의존성 체인 명시 — 각 발주에 "선행 완료 후 시작" 조건 박음.
4. 위험 가드 명시 — "토큰·Drive 절대경로 push 금지" / "MOL·Cloud Sync 등 기밀 키워드 redact 경고" 등.

### 결과
- `tasks/c/queue.md` — 3건 적재 ✅
- `tasks/a/queue.md` — 1건 적재 ✅
- `tasks/d/queue.md` — 2건 적재 ✅
- 도메인 확정: `eric-company.github.io` ✅

### 배운 점 (← dream 입력)
- **패턴/원칙:** 디자인 같은 미감 의사결정은 **자기 판단·역제안 가능한 직원**에 맡긴다. 압축·실무형(C)에 디자인 던지면 Eric 디렉션 그대로만 구현하려 들 위험. 다음에 디자인·트레이드오프 작업 또 나오면 D 우선.
- **새로 통한 것:** 의존성 체인을 큐 발주 시점에 명시(`"T-C-102 완료 후 시작"`)해두면 부원이 SessionStart에서 보고 자기 차례 알아서 판단. 김부장 중간 개입 불필요.

### 자체 평가
⭐⭐⭐⭐⭐ — 결단·발주·가드 1턴. 부원 직렬 사용 제약 안에서 큐 적재만으로 파이프라인 가동 가능한 형태.

### 다음 액션
- [ ] 최대리(C) 다음 세션 열림 → T-C-101 자동 착수 (SessionStart hook이 큐 주입)
- [ ] 검토라인은 broker watcher가 자동 돌림 — 부원 워크로그 #N 뜨면 헤드리스 김부장이 평·publish_pending draft

### 메타
- 공개: public
- 태그: #meta #omc #dispatch #phase3 #phase4 #phase5 #phase6 #phase7 #phase8
- 링크: [[#3]]

---
