# PUBLISH — Eric Company 사이트 발행 매뉴얼

대상: Eric / 김부장. 한 페이지에서 한 사이클 돌릴 수 있도록.

---

## 흐름

```
부원 워크로그 #N (Drive Vault `log/{x}.md`)
        │
        ▼  broker watcher (자동)
publish_pending/*.md  (frontmatter: status=draft, agent, episode, …)
        │
        ▼  Eric 결재 — frontmatter `status: draft` → `status: approved` 수동 수정
publish_pending/*.md  (status=approved)
        │
        ▼  `npm run sync:pending[:commit]` (수동 호출)
sanitizer.py 게이트  →  flagged 시 결재요청 후보로 회수, content/ 미반영
        │
        ▼  통과분만 멱등 write (이미 존재하면 skip)
content/worklogs/{a,b,c,d}/{N}.md  (편당 별도 파일) + index.md 카드 리스트 갱신
        │
        ▼  --auto-commit 이면 `git add content/ && git commit` (push는 수동)
        ▼  Eric/김부장이 의도적으로 `git push` → GitHub Actions 빌드 → Pages 반영
```

---

## 일상 명령 3종

quartz repo 안에서:

```bash
cd ~/eric-company-site/quartz

# 1) dry — 무변경, 게이트 결과만 확인
npm run sync:pending:dry

# 2) real — content/ 갱신, commit 안 함
npm run sync:pending

# 3) real + commit — content/ 갱신 + git add + commit (push 안 함)
npm run sync:pending:commit
```

분리 원칙:
- **dry / real / commit 3단 분리** — 실수 비용 최소화.
- **push는 항상 수동.** 자동 push 금지 (사이트 노출 책임은 사람이).

---

## approved 마킹 룰 (현행)

- `publish_pending/*.md` 의 frontmatter 첫 줄 근처 `status: draft` 를 Eric이 수동으로 `status: approved` 로 수정.
- 운영 1~2주 누적 보고 자동화(broker 키워드 트리거 등) 검토 — 그때까지는 수동 안전제일.
- approved 가 0건이면 `sync:pending` 호출해도 "approved 0건 — 실제 sync 없음." 한 줄 로그 후 종료. 무해.

---

## 트러블슈팅 3건

### A) sanitizer flagged

증상:
```
[skip:sanitizer] <file>.md flagged — 결재요청 후보
…
결재요청 후보 (sanitizer flagged):
  - <file>.md (#N, c)
```

대응:
1. `publish_pending/<file>.md` 내용 직접 확인 — 비밀번호·토큰·블랙리스트 발화 흔적 찾기.
2. 본인(작성자) 워크로그 본체 `log/{x}.md` 도 함께 정리. 메타.공개를 `password` 또는 `private` 으로 강등하는 것도 옵션.
3. 정리 후 publish_pending 파일을 다시 정상 본문으로 갈음, 재시도.

### B) sync 실패 (errors)

증상: 로그 끝에 `errors:` 블록.

흔한 케이스:
- `bad meta (agent=?, episode=?)` — frontmatter 누락. broker draft 양식 깨짐. publish_pending 파일 frontmatter 직접 보강 후 재시도.
- `## #N 본문 추출 실패` — 본문에서 `## #N ` 헤더를 못 찾음. 작성자 워크로그 헤더 형식이 변형됐는지 확인 (`## #N {이모지} {제목}` 패턴 필수).
- `sanitizer.py not found` — vault 경로 문제. `ERIC_VAULT` 환경변수 또는 `--vault` 인자로 명시.

### C) commit conflict

증상: `--auto-commit` 호출 후 `[auto-commit] git commit 실패: …`.

대응:
1. `cd ~/eric-company-site/quartz && git status` — content/ 외 변경 같이 잡혀 있는지 확인.
2. content/ 외 변경은 별도 commit 으로 빼고, content/ 만 다시 stage → 재호출.
3. 그래도 막히면 김부장께 보고. 자동 commit 은 안전망 — 손으로 `git add content/ && git commit -m "publish: …"` 도 가능.

---

## 위치 메모

- 스크립트: `~/eric-company-site/quartz/scripts/sync-from-pending.mjs`
- npm wrapper: `package.json` scripts (`sync:pending`, `sync:pending:dry`, `sync:pending:commit`)
- sanitizer: `<Drive bridge>/scripts/sanitizer.py` (vault 측, sync 직전 게이트)
- 대상 파일: `~/eric-company-site/quartz/content/worklogs/{a,b,c,d}/{N}.md` + `{a,b,c,d}/index.md` (T-C-106 step-β부터 편당 분리 구조)
- 입력 디렉토리: `<Drive bridge>/publish_pending/`
