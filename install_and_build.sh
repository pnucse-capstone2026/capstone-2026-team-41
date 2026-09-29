#!/usr/bin/env bash
set -euo pipefail
ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
case "${1:---help}" in
  frontend)
    command -v npm >/dev/null || { echo "Node.js와 npm이 필요합니다." >&2; exit 1; }
    cd "$ROOT_DIR/scanops-frontend"
    npm ci
    npm run build
    ;;
  backend)
    command -v java >/dev/null || { echo "JDK 17이 필요합니다." >&2; exit 1; }
    cd "$ROOT_DIR/scanops-backend"
    ./gradlew bootJar
    ;;
  --help|-h)
    echo "Usage: ./install_and_build.sh [frontend|backend]"
    echo "실행·DB·분석 서버 설정은 README.md의 3절을 참고하세요."
    ;;
  *) echo "지원하지 않는 대상: $1" >&2; exit 2 ;;
esac
