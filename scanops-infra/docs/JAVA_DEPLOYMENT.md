# 현재 Java CPG + LLM 실행 안내

2026-09-08 배포 구성의 소스와 설정을 `main`에서 확인할 수 있도록 정리한 안내입니다.
기존 RunPod 파인튜닝 모델·DB·ZAP과 분리된 Java 분석 호스트를 사용합니다.

## 1. 소스와 환경

`scanops-model`과 `scanops-infra`의 `main`을 같은 부모 폴더에 clone합니다.
x86-64 Docker 호스트에 Joern용 5GiB, API용 1536MiB 외 OS 여유 메모리가 필요합니다.
이는 시작 설정이며 부하 처리 용량을 보증하지 않습니다.

```sh
cp .env.java.example .env.java
```

`.env.java`에 공유 인증키, DashScope 키와 확인된 compatible-mode URL, 분석 호스트의 private IP를 입력합니다.
기본 선택은 `cpg-qwen38-ensemble`, `GRAPH_SPEC_DYNAMIC_RULE_MODE=shadow`입니다.

## 2. Java 분석 서비스

```sh
docker compose -p scanops-java -f docker-compose.java-engine.yml --env-file .env.java config --quiet
docker compose -p scanops-java -f docker-compose.java-engine.yml --env-file .env.java up -d --build
docker compose -p scanops-java -f docker-compose.java-engine.yml --env-file .env.java ps
```

8100은 백엔드에서 접근 가능한 private 인터페이스에만 게시합니다.
Joern 8200은 컨테이너 내부에서만 사용합니다. Qwen 호출에는 외부 HTTPS 연결이 필요합니다.

## 3. 백엔드 연결

현재 `scanops-backend/main`을 사용하고 기존 배포 환경에 아래 두 변수를 추가합니다.

```dotenv
SCANOPS_JAVA_MODEL_URL=http://<analysis-private-ip>:8100
SCANOPS_JAVA_API_KEY=<same-value-as-java-model-SCANOPS_API_KEY>
```

기존 `SCANOPS_MODEL_URL`과 `SCANOPS_API_KEY`는 비Java 파인튜닝 경로용으로 유지합니다.
Java URL이 없으면 이전 경로가 유지되므로 두 변수가 필요합니다.
기존 Compose를 사용한다면 백엔드 서비스의 `environment`에도 두 변수를 전달해야 합니다.
변수 파일에만 추가하고 컨테이너에 전달하지 않으면 Java 경로가 바뀌지 않습니다.

## 4. 확인

백엔드 호스트에서 `http://<analysis-private-ip>:8100/health` 응답을 확인합니다.
실제 분석은 인증된 `/analyze/batch` 요청으로 따로 확인해야 하며 Qwen 비용이 발생할 수 있습니다.
[API 입력과 코드 안내](https://github.com/26Graduation/scanops-model/blob/main/docs/CPG_LLM.md)를 참고합니다.

한 번에 분석 1개, 최대 50파일·파일당 200000자·요청당 500000자입니다.
초과 입력은 413, 동시 요청 초과는 429로 거절합니다. 실패·PARTIAL은 안전으로 표시하지 않습니다.
Joern·Qwen 단계별 제한은 전체 저장소 종료시한과 같지 않습니다.

## 과거 설정과의 차이

현재 Java 엔진은 QLoRA 대신 CPG + Qwen 의미 분석을 사용합니다.
`docker-compose.rebuild.yml`은 기존 서비스 구성 보존용이며 이것만으로 별도 Java 호스트 라우팅이 완성되지 않습니다.
[기존 모델은 별도로 보존](https://github.com/26Graduation/scanops-model/blob/main/docs/FINETUNED_MODEL.md)합니다.

[당시 배포 기록](../JAVA_CPG_DEPLOYMENT_20260908.md)의 소규모 기능 검증과 운영 제한을 함께 확인하세요.
과거 문서의 main 미반영·기능 미구현 설명은 당시 상태를 기록한 것입니다. 현재 소스는 main에 통합됩니다.
