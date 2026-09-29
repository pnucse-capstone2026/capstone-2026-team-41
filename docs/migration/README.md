# 저장소 통합 및 보존 기록

26Graduation의 4개 공개 저장소를 캡스톤 제출 저장소에 통합했습니다. 수집은 2026-09-29에 시작했으며 게시·최종 확인은 2026-09-30에 진행했습니다. 원본 저장소는 유지하고 ownership은 변경하지 않았습니다.

## 소스 코드와 커밋

| 원본 저장소 | main 커밋 | 파일 수 | 보존 Git ref 수 |
|---|---|---:|---:|
| `scanops-frontend` | `8a32d9f16d64` | 121 | 5 |
| `scanops-backend` | `71155511d8e4` | 125 | 7 |
| `scanops-model` | `a31fc5ea34fe` | 1,116 | 16 |
| `scanops-infra` | `728a443fda44` | 37 | 7 |

총 **1,399개 파일**을 원본 `main`과 동일한 이름·내용·실행 권한으로 가져왔습니다. 각 모듈의 Git tree hash가 원본과 같은지 검사했습니다. 제출 저장소의 기존 이력과 4개 main 커밋 이력은 병합 커밋으로 연결됩니다. 원본 README와 상대 경로도 보존했습니다.

모든 개발 브랜치와 태그는 [이력 보존 릴리스](https://github.com/pnucse-capstone2026/capstone-2026-team-41/releases/tag/source-archive-20260930)의 모듈별 `.bundle` 파일로 제공합니다. Git ref 개수는 remote HEAD 별칭을 포함합니다. 원본의 실제 개발 브랜치는 합계 30개이며 태그는 1개입니다. [sources.json](sources.json)에 원본 커밋·tree·각 ref·bundle SHA-256을 기록했습니다.

복원 예시:

```bash
git init recovered-model
cd recovered-model
git fetch /path/to/scanops-model.bundle 'refs/remotes/model/*:refs/heads/source/*' 'refs/tags/*:refs/tags/*'
git switch source/main
```

원본의 `.github` 폴더는 각 모듈 안에 보존되어 있으므로 이 제출 저장소의 자동 워크플로로 실행되지는 않습니다. CI 이식이나 외부 서비스 재배포는 이 통합 작업에 포함하지 않습니다.

## 모델 가중치

원본 `finetuned-v1-20260914` 릴리스의 다음 파일을 [제출 저장소의 동일 태그 릴리스](https://github.com/pnucse-capstone2026/capstone-2026-team-41/releases/tag/finetuned-v1-20260914)로 복사합니다.

- `adapter_v1_fix.gguf`
- `scanops-qlora-v1-peft.tar.gz`
- `SHA256SUMS`

원본 SHA256SUMS로 두 파일의 해시 일치를 확인했습니다. 이 가중치는 이전 QLoRA 경로의 자료이며 현재 Java 서비스 실행에는 필요하지 않습니다.

## GitHub 기록

[github/](github/)에 이슈·PR 본문, 댓글·리뷰, 릴리스 메타데이터를 JSON으로 보존했습니다. 원본의 토론 기록을 제출 저장소의 새 이슈로 다시 발행하지 않았습니다. Actions 실행 기록, secrets, 조직·저장소 설정 및 서비스 운영 상태는 복사 대상이 아닙니다. 4개 저장소에 wiki는 비활성화되어 있습니다.

## 제출 문서

학교 템플릿의 빈 파일을 실제 중간·최종보고서, 포스터, 발표 PDF·PPTX로 교체했습니다. 착수보고서는 확인된 파일이 없어 빈 템플릿을 남기지 않았습니다. [documents.json](documents.json)에 사용한 원본 파일명과 SHA-256을 기록했습니다. 소개 영상은 사용자가 제공한 [YouTube 영상](https://www.youtube.com/watch?v=l9asE8BM99E)을 연결했습니다.

## 검증 범위

- 4개 모듈의 파일·권한·Git tree가 원본 main과 일치
- 4개 bundle의 `git bundle verify` 통과
- 기존 학습 가중치 2개의 SHA-256 일치
- 새 README·문서의 로컬 링크 및 필수 5개 항목 확인
- 빌드 도우미의 Bash 문법·도움말 확인

이전 과정에서 애플리케이션 코드를 변경하지 않았습니다. 서비스 재배포, 유료 모델 호출, 전체 성능평가를 새로 수행하지 않았으며 과거 테스트 수치는 당시 기록으로 구분했습니다.
