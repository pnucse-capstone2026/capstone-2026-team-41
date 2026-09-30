/** Reviewed type-level guidance. Never claims a finding was exploited.
 * References: https://cwe.mitre.org/data/definitions/{id}.html
 * XSS: https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html
 * Keep specific scan evidence separate from these general scenarios.
 */
import type { ZapMeta } from './zapMeta'

type Guide = { ko: [string, string, string, string]; en: [string, string, string, string] }
const GUIDES: Record<string, Guide> = {
  '79': {
    ko: [
      '크로스 사이트 스크립팅 (XSS)',
      '외부 입력이 웹 페이지에서 코드로 해석되어 사용자 브라우저에서 실행될 수 있는 문제입니다.',
      '공격자가 조작한 입력이 HTML 응답에 인코딩 없이 포함되고 사용자가 그 페이지를 열면, 브라우저가 이를 스크립트로 실행할 수 있습니다. 이 경우 화면 변조나 사용자 권한으로의 요청이 가능해집니다.',
      '1. 표시된 위치에서 외부 입력이 HTML 응답까지 전달되는지 확인하세요.\n2. 출력 직전에 HTML 본문·속성·JavaScript 등 출력 위치에 맞는 인코딩을 적용하세요. Java의 HTML 본문 출력에는 OWASP Java Encoder의 Encode.forHtml(value)를 사용할 수 있습니다.\n3. HTML을 허용해야 한다면 검증된 HTML 정화 라이브러리로 허용 태그·속성을 제한하세요. CSP는 보조 방어로 적용하세요.\n4. 특수문자가 코드로 실행되지 않고 텍스트로 표시되는지 회귀 테스트를 추가하세요.',
    ],
    en: [
      'Cross-site scripting (XSS)',
      'Untrusted input may be interpreted as code and run in a user’s browser.',
      'If attacker-controlled input reaches an HTML response without appropriate encoding and a user opens that page, the browser may execute it as script, allowing page manipulation or requests with the user’s privileges.',
      '1. Trace external input to the response at the reported location.\n2. Encode at output for the exact context: HTML body, attribute, or JavaScript. For Java HTML body output, OWASP Java Encoder provides Encode.forHtml(value).\n3. If HTML is required, use a maintained HTML sanitizer with allowed tags and attributes. Add CSP as defense in depth.\n4. Test that special characters appear as text and never execute.',
    ],
  },
  '89': {
    ko: [
      'SQL 삽입',
      '입력값이 SQL 명령의 일부로 해석되어 데이터 조회나 변경 범위를 바꿀 수 있는 문제입니다.',
      '외부 입력을 SQL 문자열에 연결하면 공격자가 쿼리 조건을 바꿀 수 있습니다. DB 계정 권한에 따라 다른 사용자의 데이터 조회나 변경으로 이어질 수 있습니다.',
      '1. 문자열 연결로 SQL을 만드는 부분을 파라미터 바인딩으로 바꾸세요. Java에서는 PreparedStatement를 사용하세요.\n2. 테이블명·정렬 컬럼처럼 바인딩할 수 없는 값은 고정된 허용 목록에 매핑하세요.\n3. DB 권한을 최소화하고 따옴표 등 특수문자가 쿼리 구조를 바꾸지 않는지 테스트하세요.',
    ],
    en: [
      'SQL injection',
      'Input may change the structure of a database query.',
      'Concatenating external input into SQL may let an attacker alter query conditions and access or modify records within the database account’s permissions.',
      '1. Replace SQL concatenation with parameter binding, such as Java PreparedStatement.\n2. Map identifiers such as table names and sort columns to a fixed allowlist.\n3. Limit database privileges and test that special characters cannot change query structure.',
    ],
  },
  '22': {
    ko: [
      '경로 탐색',
      '사용자가 지정한 경로로 허용된 폴더 밖의 파일에 접근할 수 있는 문제입니다.',
      '파일 경로에 외부 입력이 포함되면 상위 경로 표현이나 절대 경로를 통해 허용 범위 밖의 파일을 읽거나 덮어쓸 수 있습니다.',
      '1. 가능하면 파일 ID를 서버의 고정 경로에 매핑하세요.\n2. 경로를 정규화하고 심볼릭 링크를 고려한 실제 경로가 허용 디렉터리 안에 있는지 확인하세요.\n3. 읽기·쓰기 권한을 제한하고 상위 경로·절대 경로·심볼릭 링크 우회 테스트를 추가하세요.',
    ],
    en: [
      'Path traversal',
      'User-controlled paths may access files outside an allowed directory.',
      'External input in file paths may allow parent-directory sequences or absolute paths to read or overwrite files outside the intended location.',
      '1. Prefer mapping file IDs to fixed server paths.\n2. Canonicalize paths, account for symbolic links, and verify containment within the allowed directory.\n3. Restrict file permissions and test traversal, absolute paths, and symlink escapes.',
    ],
  },
  '78': {
    ko: [
      '운영체제 명령 삽입',
      '외부 입력이 서버 명령이나 인수를 바꿀 수 있는 문제입니다.',
      '입력값이 셸 명령에 연결되거나 실행 인수를 자유롭게 결정하면 서버 프로세스 권한으로 의도하지 않은 작업이 실행될 수 있습니다.',
      '1. 외부 명령 실행 대신 언어의 파일·네트워크 API를 사용하세요.\n2. 실행이 필요하면 셸을 거치지 않고 실행 파일과 인수를 분리하세요.\n3. 실행 파일을 고정하고 인수도 허용 목록으로 검증하세요. 인수 분리만으로 옵션 주입까지 막을 수는 없습니다.',
    ],
    en: [
      'OS command injection',
      'External input may alter server commands or their arguments.',
      'Input concatenated into a shell command or used to control arguments may cause unintended actions with the server process’s privileges.',
      '1. Prefer language APIs over external commands.\n2. If execution is required, bypass the shell and separate executable and arguments.\n3. Fix the executable and allowlist arguments; separation alone does not prevent option injection.',
    ],
  },
  '918': {
    ko: [
      '서버 측 요청 위조 (SSRF)',
      '입력한 주소로 서버가 대신 요청하여 내부 시스템에 접근할 수 있는 문제입니다.',
      '공격자가 서버의 요청 주소를 제어할 수 있으면 외부에서 접근할 수 없는 내부 서비스나 메타데이터에 서버를 통해 접근할 수 있습니다.',
      '1. URL의 프로토콜·호스트·포트를 허용 목록으로 제한하세요.\n2. DNS 해석 결과와 리다이렉트 목적지에도 검증을 적용하고 내부·루프백·링크 로컬 주소 접근을 차단하세요.\n3. 서버의 외부 요청 권한과 네트워크 경로도 제한하세요.',
    ],
    en: [
      'Server-side request forgery (SSRF)',
      'An attacker-controlled URL may cause the server to access internal systems.',
      'Control over a server request destination may expose internal services or metadata that are not directly accessible from the internet.',
      '1. Allowlist URL schemes, hosts, and ports.\n2. Validate resolved IPs and redirect destinations; block internal, loopback, and link-local addresses.\n3. Restrict outbound network access.',
    ],
  },
  '502': {
    ko: [
      '신뢰할 수 없는 데이터 역직렬화',
      '외부 데이터를 객체로 복원하는 과정에서 의도하지 않은 동작이 발생할 수 있는 문제입니다.',
      '외부에서 조작한 직렬화 데이터를 받아 객체를 복원하면 사용 중인 클래스와 라이브러리에 따라 코드 실행이나 서비스 중단으로 이어질 수 있습니다.',
      '1. 신뢰할 수 없는 네이티브 직렬화 데이터의 역직렬화를 피하고 명시적 스키마의 데이터 형식을 사용하세요.\n2. 불가피하다면 허용 클래스를 제한하고 객체 깊이·크기 제한을 적용하세요.\n3. 관련 라이브러리를 업데이트하고 예상 밖 타입이 거부되는지 테스트하세요.',
    ],
    en: [
      'Deserialization of untrusted data',
      'Restoring objects from untrusted data may trigger unintended behavior.',
      'Deserializing attacker-controlled objects may lead to code execution or denial of service, depending on the available classes and libraries.',
      '1. Avoid native deserialization of untrusted input; prefer data with an explicit schema.\n2. If unavoidable, allowlist types and limit object size and depth.\n3. Update relevant libraries and test rejection of unexpected types.',
    ],
  },
}

// Additional categories emitted by the static engine. Each row: title, plain, scenario, remedy.
const MORE: [string, Guide['ko'], Guide['en']][] = [
  [
    '15',
    [
      '외부 입력에 의한 설정 변경',
      '외부 입력이 보안 설정이나 시스템 동작을 바꿀 수 있습니다.',
      '권한 없는 사용자가 설정값을 변경할 수 있으면 접근 제한이 해제되거나 데이터가 다른 목적지로 전송될 수 있습니다.',
      '설정 변경에 인증·권한 검사를 적용하고 수정 가능한 키와 값의 범위를 허용 목록으로 제한하세요.',
    ],
    [
      'External control of configuration',
      'Untrusted input may alter security or system settings.',
      'Unauthorized configuration changes may disable restrictions or redirect data.',
      'Authorize configuration changes and allowlist editable keys and values.',
    ],
  ],
  [
    '90',
    [
      'LDAP 삽입',
      '입력값이 LDAP 검색 조건을 바꿀 수 있습니다.',
      '외부 입력을 LDAP 필터에 연결하면 검색 조건이 변조되어 다른 계정 정보에 접근할 수 있습니다.',
      '검증된 LDAP 라이브러리로 필터 값과 DN을 각각 해당 문맥에 맞게 이스케이프하세요. 검색 권한을 제한하세요.',
    ],
    [
      'LDAP injection',
      'Input may alter an LDAP query.',
      'Input concatenated into an LDAP filter may change search conditions and expose account data.',
      'Use a maintained LDAP library to escape filter values and distinguished names for their respective contexts. Restrict search permissions.',
    ],
  ],
  [
    '94',
    [
      '코드 삽입',
      '외부 입력이 실행 코드로 해석될 수 있습니다.',
      '입력값이 eval이나 동적 코드 실행에 전달되면 서버 권한으로 의도하지 않은 코드가 실행될 수 있습니다.',
      '외부 입력의 코드 평가를 제거하고 필요한 동작을 고정된 함수의 허용 목록으로 매핑하세요.',
    ],
    [
      'Code injection',
      'External input may be interpreted as executable code.',
      'Input reaching eval or another dynamic execution mechanism may run unintended code.',
      'Remove evaluation of external input and map allowed operations to fixed functions.',
    ],
  ],
  [
    '113',
    [
      'HTTP 응답 분할',
      '입력값의 개행 문자가 HTTP 응답 헤더 구조를 바꿀 수 있습니다.',
      '외부 입력의 CR·LF가 헤더에 허용되면 추가 헤더나 응답이 삽입될 수 있습니다.',
      '검증된 헤더 설정 API를 사용하고 헤더 값의 CR·LF를 거부하세요. 헤더 이름과 리다이렉트 주소도 검증하세요.',
    ],
    [
      'HTTP response splitting',
      'Newlines in input may alter HTTP response headers.',
      'CR or LF characters reaching headers may inject additional headers or responses.',
      'Use validated header APIs and reject CR/LF in values. Validate header names and redirect targets.',
    ],
  ],
  [
    '117',
    [
      '로그 삽입',
      '입력값이 로그의 경계나 내용을 위조할 수 있습니다.',
      '입력에 포함된 개행·제어 문자가 기록되면 가짜 로그 항목을 만들거나 실제 활동을 숨길 수 있습니다.',
      '구조화된 로깅을 사용하고 입력의 개행·제어 문자를 로그 형식에 맞게 인코딩하세요. 민감정보 기록도 제한하세요.',
    ],
    [
      'Log injection',
      'Input may forge log content or record boundaries.',
      'Newlines or control characters may create misleading log entries or hide activity.',
      'Use structured logging and encode control characters for the log format. Avoid sensitive data in logs.',
    ],
  ],
  [
    '200',
    [
      '민감정보 노출',
      '권한 없는 사용자가 내부 정보나 민감한 데이터를 볼 수 있습니다.',
      '오류 응답·로그·공개 API에 민감정보가 포함되면 공격자가 이를 수집하여 후속 공격에 이용할 수 있습니다.',
      '노출된 데이터의 접근 권한을 점검하고 응답·로그에서 비밀값과 내부 정보를 제거하세요. 노출된 인증정보는 교체하세요.',
    ],
    [
      'Sensitive information exposure',
      'Unauthorized users may see internal or sensitive data.',
      'Sensitive content in responses, logs, or public APIs may support further attacks.',
      'Check access controls, remove secrets from output, and rotate exposed credentials.',
    ],
  ],
  [
    '284',
    [
      '부적절한 접근 제어',
      '사용자 권한에 맞지 않는 데이터나 기능에 접근할 수 있습니다.',
      '서버가 요청마다 사용자와 대상 리소스의 권한을 확인하지 않으면 다른 사용자의 데이터에 접근할 수 있습니다.',
      '모든 요청에서 서버 측 권한 검사를 수행하고 기본 거부 정책을 적용하세요. 다른 계정·역할의 접근이 차단되는지 테스트하세요.',
    ],
    [
      'Improper access control',
      'Users may access resources beyond their permissions.',
      'Missing per-request authorization may expose another user’s resources.',
      'Authorize every request on the server, deny by default, and test cross-account and cross-role access.',
    ],
  ],
  [
    '327',
    [
      '안전하지 않은 암호 알고리즘',
      '취약한 암호 알고리즘으로 데이터 보호가 약해질 수 있습니다.',
      '보호 대상과 사용 방식에 따라 공격자가 암호화된 데이터를 해독하거나 무결성 검증을 우회할 수 있습니다.',
      '암호화 목적과 데이터 호환성을 확인한 뒤 검증된 현대적 알고리즘으로 교체하세요. 암호화에는 인증된 암호 방식을 사용하고 키·nonce 관리도 점검하세요.',
    ],
    [
      'Risky cryptographic algorithm',
      'A weak algorithm may undermine data protection.',
      'Depending on usage, weak cryptography may expose data or permit integrity bypass.',
      'Choose a maintained algorithm suited to the use case, plan migration, and review key and nonce handling. Use authenticated encryption where applicable.',
    ],
  ],
  [
    '470',
    [
      '외부 입력에 의한 클래스 선택',
      '외부 입력이 실행할 클래스나 메서드를 결정할 수 있습니다.',
      '입력값을 리플렉션의 클래스·메서드 이름으로 사용하면 의도하지 않은 기능이 호출될 수 있습니다.',
      '입력값을 고정된 허용 클래스·메서드에 매핑하고 호출 전에 권한을 확인하세요. 임의 이름의 리플렉션 호출을 제거하세요.',
    ],
    [
      'Externally controlled reflection',
      'Input may select which class or method executes.',
      'Reflection using untrusted class or method names may invoke unintended functionality.',
      'Map inputs to fixed allowed operations and authorize calls. Remove arbitrary reflection targets.',
    ],
  ],
  [
    '477',
    [
      '폐기된 함수 사용',
      '더 이상 권장되지 않는 함수가 남아 있어 보안 유지가 어려울 수 있습니다.',
      '사용 중인 함수의 폐기 사유에 따라 알려진 결함이나 안전하지 않은 동작이 남을 수 있습니다. 폐기 여부만으로 악용이 확정되지는 않습니다.',
      '공식 문서에서 폐기 사유와 대체 API를 확인하고 동작 호환성을 테스트한 뒤 교체하세요.',
    ],
    [
      'Obsolete function',
      'An obsolete API may retain unsafe behavior.',
      'Security impact depends on why the API was deprecated; deprecation alone does not prove exploitability.',
      'Check official deprecation guidance, migrate to the recommended API, and test compatibility.',
    ],
  ],
  [
    '601',
    [
      '검증되지 않은 리다이렉트',
      '외부 입력으로 사용자를 신뢰할 수 없는 사이트로 이동시킬 수 있습니다.',
      '공격자가 서비스의 정상 주소에 외부 이동 경로를 넣어 사용자를 피싱 사이트로 유도할 수 있습니다.',
      '서버에 등록된 이동 경로 ID를 사용하거나 동일 출처의 허용 경로만 허용하세요. URL 파싱 후 프로토콜과 호스트를 검증하세요.',
    ],
    [
      'Open redirect',
      'Input may redirect users to an untrusted site.',
      'An attacker may use a trusted service URL to direct a user to a phishing site.',
      'Use registered destination IDs or allowlisted same-origin paths. Parse and validate schemes and hosts.',
    ],
  ],
  [
    '643',
    [
      'XPath 삽입',
      '입력값이 XML 데이터 검색 조건을 바꿀 수 있습니다.',
      '외부 입력을 XPath 식에 연결하면 공격자가 검색 조건을 변경해 제한된 XML 데이터에 접근할 수 있습니다.',
      'XPath 변수 바인딩을 지원하는 API를 사용하고 검색 식과 입력값을 분리하세요. XML 데이터 접근 권한도 제한하세요.',
    ],
    [
      'XPath injection',
      'Input may alter an XML query.',
      'Input concatenated into XPath may change conditions and expose restricted XML data.',
      'Use XPath variable binding to separate expressions and input. Restrict access to XML data.',
    ],
  ],
  [
    '611',
    [
      'XML 외부 엔티티 처리 (XXE)',
      'XML 파서가 외부 파일이나 주소를 읽을 수 있습니다.',
      '외부 엔티티가 활성화된 파서에 조작된 XML을 전달하면 서버 파일이나 내부 서비스에 접근할 수 있습니다.',
      'DTD·외부 엔티티·외부 스키마 접근을 비활성화하세요. 파서별 보안 설정을 확인하고 외부 리소스가 로드되지 않는지 테스트하세요.',
    ],
    [
      'XML external entities (XXE)',
      'An XML parser may load external files or URLs.',
      'Malicious XML may access server files or internal services when external entities are enabled.',
      'Disable DTDs, external entities, and external schema access. Verify parser-specific settings and test that external resources are not loaded.',
    ],
  ],
  [
    '352',
    [
      '크로스 사이트 요청 위조 (CSRF)',
      '사용자가 의도하지 않은 상태 변경 요청이 인증된 세션으로 전송될 수 있습니다.',
      '쿠키 인증을 사용하는 서비스에서 요청 출처를 확인하지 않으면 외부 사이트가 사용자 권한으로 상태 변경 요청을 유도할 수 있습니다.',
      '상태 변경 요청에 CSRF 토큰을 검증하고 Origin 검사와 적절한 SameSite 쿠키 정책을 함께 적용하세요.',
    ],
    [
      'Cross-site request forgery (CSRF)',
      'A browser may send unwanted state-changing requests with a user’s session.',
      'An external site may trigger actions in a cookie-authenticated service without appropriate request validation.',
      'Validate CSRF tokens for state changes and combine origin checks with an appropriate SameSite cookie policy.',
    ],
  ],
  [
    '338',
    [
      '예측 가능한 난수',
      '보안에 쓰는 난수를 예측할 수 있으면 토큰이나 비밀값이 추측될 수 있습니다.',
      '일반 난수 생성기의 출력을 인증 토큰에 쓰면 공격자가 이후 값을 추측할 가능성이 있습니다.',
      '보안 목적에는 SecureRandom 등 암호학적 난수 생성기를 사용하세요. 토큰 길이·만료·재사용 방지도 점검하세요.',
    ],
    [
      'Predictable security randomness',
      'Predictable random values may expose tokens or secrets.',
      'General-purpose random generators used for authentication tokens may let an attacker predict values.',
      'Use a cryptographic generator such as SecureRandom and review token length, expiry, and replay protection.',
    ],
  ],
  [
    '798',
    [
      '하드코딩된 인증정보',
      '코드에 포함된 비밀값이 유출되면 계정이나 시스템에 접근할 수 있습니다.',
      '저장소·배포 파일을 볼 수 있는 사람이 내장된 비밀번호나 키를 얻어 시스템에 접근할 수 있습니다.',
      '비밀값을 비밀관리 서비스로 옮기고 노출된 값을 폐기·교체하세요. 저장소 기록과 배포 산출물에도 남아 있는지 확인하세요.',
    ],
    [
      'Hardcoded credentials',
      'Secrets embedded in code may expose accounts or systems.',
      'Anyone with access to source or artifacts may extract embedded credentials.',
      'Move secrets to a secret manager, revoke and rotate exposed credentials, and inspect history and artifacts.',
    ],
  ],
  [
    '1321',
    [
      '프로토타입 오염',
      '외부 입력으로 객체의 공통 속성이 변경될 수 있습니다.',
      '검증되지 않은 키를 객체에 병합하면 프로토타입 속성이 바뀌어 권한 검사나 프로그램 동작에 영향을 줄 수 있습니다.',
      '입력 스키마로 허용 키를 제한하고 __proto__·constructor·prototype 경로를 차단하세요. 안전한 병합 라이브러리와 Map 또는 프로토타입 없는 객체를 검토하세요.',
    ],
    [
      'Prototype pollution',
      'Untrusted keys may change shared object properties.',
      'Unsafe object merging may alter prototype properties and affect authorization or program behavior.',
      'Allowlist keys with a schema, reject prototype-manipulating paths, and use maintained merging libraries, Map, or null-prototype objects where appropriate.',
    ],
  ],
  [
    '943',
    [
      'NoSQL 쿼리 삽입',
      '입력값이 데이터 조회 조건이나 쿼리 연산자를 바꿀 수 있습니다.',
      '검증되지 않은 객체나 연산자를 쿼리에 전달하면 공격자가 인증 조건을 우회하거나 더 넓은 범위의 데이터를 조회할 수 있습니다.',
      '입력의 타입·스키마·허용 필드를 검증하고 클라이언트가 임의 쿼리 객체나 연산자를 전달하지 못하게 하세요. 서버에서 고정된 쿼리를 구성하세요.',
    ],
    [
      'NoSQL query injection',
      'Input may alter query conditions or operators.',
      'Unvalidated query objects or operators may bypass intended filters or expose additional records.',
      'Validate input types, schemas, and allowed fields. Build fixed queries on the server instead of accepting arbitrary query objects.',
    ],
  ],
  [
    '134',
    [
      '외부 입력을 사용한 서식 문자열',
      '외부 입력이 출력 서식을 제어해 정보 노출이나 실행 오류를 일으킬 수 있습니다.',
      '공격자가 서식 지정자를 조작하면 언어와 함수에 따라 의도하지 않은 데이터 출력이나 서비스 중단이 발생할 수 있습니다.',
      '서식 문자열은 상수로 고정하고 외부 입력은 데이터 인수로만 전달하세요. 허용할 출력 크기도 제한하세요.',
    ],
    [
      'Uncontrolled format string',
      'Input may control formatting and cause disclosure or errors.',
      'Attacker-controlled format specifiers may expose data or disrupt service, depending on the language and API.',
      'Use a constant format string and pass untrusted input only as data arguments. Bound output size.',
    ],
  ],
  [
    '256',
    [
      '평문 비밀번호 저장',
      '비밀번호가 암호화되지 않은 형태로 저장되어 노출될 수 있습니다.',
      '저장소·파일·백업에 접근한 사람이 평문 비밀번호를 얻어 계정에 접근할 수 있습니다.',
      '로그인 검증용 비밀번호에는 Argon2id 등 검증된 비밀번호 해시와 개별 랜덤 솔트를 사용하세요. 복원이 필요한 외부 인증정보는 비밀관리 서비스에 저장하세요.',
    ],
    [
      'Plaintext password storage',
      'Stored plaintext passwords may be exposed.',
      'Access to files, databases, or backups may reveal usable passwords.',
      'For login verification, use a maintained password hash such as Argon2id with unique random salts. Store recoverable service credentials in a secret manager.',
    ],
  ],
  [
    '209',
    [
      '오류 메시지의 민감정보 노출',
      '오류 응답에 내부 경로나 쿼리 등 민감한 정보가 포함될 수 있습니다.',
      '사용자가 오류를 유도하여 내부 구조와 비밀값을 파악하고 후속 공격에 활용할 수 있습니다.',
      '외부 응답은 일반화하고 상세 오류는 접근이 제한된 서버 로그에 기록하세요. 비밀번호·토큰은 로그에서도 제거하세요.',
    ],
    [
      'Sensitive error messages',
      'Error responses may disclose internal paths, queries, or secrets.',
      'An attacker may trigger errors to learn internal details useful for further attacks.',
      'Return generic errors and keep detailed diagnostics in restricted logs. Redact passwords and tokens from logs too.',
    ],
  ],
  [
    '114',
    [
      '외부 입력에 의한 라이브러리 로드',
      '외부 입력이 로드할 코드 라이브러리를 결정할 수 있습니다.',
      '공격자가 라이브러리 경로나 검색 위치를 바꿀 수 있으면 의도하지 않은 코드를 프로세스 권한으로 실행할 수 있습니다.',
      '라이브러리 이름과 경로를 고정하고 신뢰할 수 있는 디렉터리만 사용하세요. 라이브러리 파일과 디렉터리 쓰기 권한을 제한하세요.',
    ],
    [
      'Externally controlled library loading',
      'Input may select a library to load.',
      'Control over library paths or search locations may load unintended code with process privileges.',
      'Fix library names and paths, use trusted directories, and restrict write access to libraries and their directories.',
    ],
  ],
  [
    '382',
    [
      '웹 애플리케이션의 프로세스 종료',
      '요청 처리 중 프로세스를 종료하면 서비스 전체가 중단될 수 있습니다.',
      '공격자가 프로세스 종료 호출에 도달하는 요청을 보낼 수 있으면 다른 사용자까지 서비스를 이용하지 못할 수 있습니다.',
      'System.exit 등 프로세스 종료 호출을 요청 처리 경로에서 제거하세요. 예외 처리나 오류 응답으로 요청만 종료하고 서비스가 유지되는지 테스트하세요.',
    ],
    [
      'Process termination in a web application',
      'Terminating the process during a request may stop the entire service.',
      'A reachable process-exit call may let an attacker disrupt service for other users.',
      'Remove process termination calls such as System.exit from request handlers. Return an error for the request and test continued availability.',
    ],
  ],
  [
    '328',
    [
      '취약한 해시 알고리즘',
      '해시의 충돌 저항성 등 필요한 보안 성질이 부족할 수 있습니다.',
      '무결성·서명 검증에 취약한 해시를 사용하면 공격자가 충돌 등을 이용해 검증을 우회할 수 있습니다.',
      '사용 목적에 필요한 보안 성질을 확인하고 검증된 해시로 교체하세요. 비밀번호 저장에는 일반 해시 대신 전용 비밀번호 해시를 사용하세요.',
    ],
    [
      'Weak hash algorithm',
      'The hash may lack the security properties required by its use case.',
      'Weak hashes used for integrity or signatures may permit collision-based verification bypass.',
      'Select a maintained hash suited to the purpose. For passwords, use a dedicated password hashing function rather than a general hash.',
    ],
  ],
  [
    '759',
    [
      '솔트 없는 비밀번호 해시',
      '동일한 비밀번호가 동일한 해시가 되어 사전 계산 공격에 취약할 수 있습니다.',
      '해시가 유출되면 공격자가 미리 계산한 표를 재사용해 여러 계정의 비밀번호를 추측할 수 있습니다.',
      '비밀번호마다 고유한 랜덤 솔트를 생성하는 Argon2id 등 검증된 비밀번호 해시를 사용하세요. 기존 해시는 안전한 방식으로 점진적으로 전환하세요.',
    ],
    [
      'Password hashing without salt',
      'Equal passwords may produce equal hashes and enable precomputation attacks.',
      'After a hash leak, precomputed guesses may be reused across accounts.',
      'Use a maintained password hashing function such as Argon2id with unique random salts, and migrate existing hashes safely.',
    ],
  ],
  [
    '760',
    [
      '예측 가능한 솔트',
      '재사용되거나 예측 가능한 솔트로 비밀번호 추측 비용이 낮아질 수 있습니다.',
      '솔트가 고정되거나 재사용되면 공격자가 특정 솔트에 대한 비밀번호 추측 결과를 여러 계정에 재사용할 수 있습니다.',
      '계정별로 고유한 랜덤 솔트를 생성하는 비밀번호 해시 라이브러리를 사용하세요. 솔트는 비밀일 필요가 없지만 고정값이나 사용자명으로 대체하지 마세요.',
    ],
    [
      'Predictable password salt',
      'Predictable or reused salts may reduce password-guessing cost.',
      'Fixed or reused salts may allow precomputed guesses to be shared across accounts.',
      'Use a password hashing library that generates unique random salts. Salts need not be secret, but must not be replaced with fixed values or usernames.',
    ],
  ],
  [
    '319',
    [
      '민감정보의 평문 전송',
      '네트워크로 전송되는 민감정보를 중간에서 읽거나 바꿀 수 있습니다.',
      '공격자가 암호화되지 않은 통신 경로를 관찰하거나 조작할 수 있으면 인증정보나 데이터를 탈취·변조할 수 있습니다.',
      '민감정보 전송에 TLS를 적용하고 인증서를 검증하세요. 평문 연결을 차단하고 내부 서비스 간 통신도 점검하세요.',
    ],
    [
      'Cleartext transmission',
      'Sensitive data may be read or modified in transit.',
      'An attacker with access to an unencrypted network path may intercept or alter data.',
      'Use TLS with certificate validation, reject plaintext connections, and review internal service traffic too.',
    ],
  ],
  [
    '315',
    [
      '쿠키의 평문 민감정보',
      '쿠키에 민감한 데이터가 직접 포함되어 노출될 수 있습니다.',
      '브라우저나 쿠키 저장소에 접근한 사람이 쿠키 값을 읽어 개인정보나 비밀값을 얻을 수 있습니다.',
      '민감정보는 서버에 보관하고 쿠키에는 불투명한 세션 식별자만 저장하세요. Secure·HttpOnly 등 적절한 쿠키 속성과 세션 만료를 적용하세요.',
    ],
    [
      'Sensitive data in cookies',
      'Cookies may directly expose sensitive data.',
      'Access to browser storage or cookie values may reveal private data or secrets.',
      'Keep sensitive data on the server and store opaque session IDs in cookies. Apply appropriate Secure/HttpOnly attributes and expiration.',
    ],
  ],
  [
    '539',
    [
      '지속성 쿠키의 민감정보',
      '장기간 저장되는 쿠키에 민감정보가 남을 수 있습니다.',
      '공용 기기나 백업에 남은 쿠키를 다른 사람이 읽으면 개인정보나 오래 유지된 세션에 접근할 수 있습니다.',
      '지속성 쿠키에 민감정보를 담지 말고 보관 기간을 최소화하세요. 로그아웃 시 서버 세션을 무효화하고 쿠키도 삭제하세요.',
    ],
    [
      'Sensitive persistent cookies',
      'Sensitive content may remain in long-lived cookies.',
      'Cookies left on shared devices or backups may expose data or long-lived sessions.',
      'Avoid sensitive values in persistent cookies, minimize retention, and invalidate server sessions on logout.',
    ],
  ],
  [
    '526',
    [
      '환경변수의 민감정보 노출',
      '환경변수에 저장된 비밀값이 다른 실행 주체에 노출될 수 있습니다.',
      '환경을 열람할 수 있는 프로세스나 진단 도구가 비밀번호·키를 수집할 수 있습니다.',
      '비밀관리 서비스 사용을 검토하고 프로세스·진단 정보 접근을 제한하세요. 환경변수를 로그에 출력하지 말고 유출된 비밀값은 교체하세요.',
    ],
    [
      'Sensitive environment variables',
      'Secrets in environment variables may be visible to other execution contexts.',
      'Processes or diagnostics with environment access may collect passwords or keys.',
      'Consider a secret manager, restrict process and diagnostics access, avoid logging environments, and rotate exposed secrets.',
    ],
  ],
  [
    '533',
    [
      '서버 로그의 민감정보 노출',
      '서버 로그에 기록된 민감정보가 노출될 수 있습니다.',
      '서버 로그 파일에 접근할 수 있으면 기록된 개인정보나 인증정보를 읽을 수 있습니다.',
      '로그에 비밀값을 기록하지 말고 민감한 필드는 마스킹하세요. 로그 파일 접근 권한과 보관 기간을 제한하세요.',
    ],
    [
      'Sensitive server logs',
      'Sensitive information recorded in server logs may be exposed.',
      'Access to server log files may reveal recorded personal data or credentials.',
      'Avoid logging secrets, redact sensitive fields, and restrict log access and retention.',
    ],
  ],
  [
    '534',
    [
      '디버그 로그의 민감정보',
      '디버그 로그에 비밀번호나 개인정보가 기록될 수 있습니다.',
      '로그를 열람할 수 있는 사용자나 수집 시스템이 기록된 비밀값에 접근할 수 있습니다.',
      '민감정보를 로깅 전에 제거·마스킹하고 운영 환경의 디버그 출력을 제한하세요. 로그 접근 권한과 보관 기간을 줄이세요.',
    ],
    [
      'Sensitive debug logs',
      'Debug logs may contain secrets or personal data.',
      'Log readers or collection systems may gain access to recorded secrets.',
      'Redact before logging, limit production debug output, and restrict log access and retention.',
    ],
  ],
  [
    '598',
    [
      'URL 쿼리의 민감정보',
      '주소의 쿼리 문자열에 민감정보가 담겨 기록될 수 있습니다.',
      'URL이 브라우저 방문 기록·서버 로그·리퍼러에 남으면 인증정보나 개인정보가 노출될 수 있습니다.',
      '민감정보를 URL에 넣지 말고 HTTPS 요청 본문이나 적절한 인증 헤더로 전달하세요. 해당 필드가 로그에 남지 않도록 설정하세요.',
    ],
    [
      'Sensitive query strings',
      'Sensitive URL parameters may be recorded or disclosed.',
      'URLs in browser history, server logs, or referrers may reveal credentials or personal data.',
      'Keep sensitive data out of URLs; use HTTPS request bodies or appropriate authentication headers and redact sensitive logging.',
    ],
  ],
]
GUIDES['321'] = {
  ko: [
    '하드코딩된 암호화 키',
    '코드에 고정된 암호화 키가 노출되면 보호된 데이터를 읽거나 위조할 수 있습니다.',
    '소스코드나 실행 파일에서 고정 키를 얻으면 해당 키로 보호한 데이터에 접근할 수 있습니다.',
    '키를 비밀관리 서비스로 옮기고 접근 권한을 제한하세요. 노출된 키는 교체하고 기존 데이터의 재암호화·키 버전 전환을 계획하세요.',
  ],
  en: [
    'Hardcoded cryptographic key',
    'A key embedded in code may expose protected data.',
    'A key extracted from source or binaries may allow access to data protected with that key.',
    'Store keys in a secret manager with restricted access. Rotate exposed keys and plan re-encryption and key-version migration.',
  ],
}
for (const [id, ko, en] of MORE) GUIDES[id] = { ko, en }
const ALIASES: Record<string, string> = {
  '23': '22',
  '36': '22',
  '80': '79',
  '81': '79',
  '83': '79',
  '90': '90',
  '95': '94',
  '285': '284',
  '862': '284',
  '863': '284',
  '259': '798',
}

export function enrichCwe(type: string, language: string): ZapMeta | null {
  const id = type.match(/\bCWE-(\d+)\b/i)?.[1]
  if (!id) return null
  const guide = GUIDES[ALIASES[id] ?? id]
  if (!guide) return null
  const [name, plain, attack, fix] = guide[language.startsWith('en') ? 'en' : 'ko']
  return { name, cwe: `CWE-${id}`, plain, summary: '', attack, fix }
}

export function weaknessReference(type: string): string | undefined {
  const cve = type.match(/\bCVE-\d{4}-\d{4,}\b/i)?.[0].toUpperCase()
  if (cve) return `https://www.cve.org/CVERecord?id=${cve}`
  const cwe = type.match(/\bCWE-(\d+)\b/i)?.[1]
  return cwe ? `https://cwe.mitre.org/data/definitions/${cwe}.html` : undefined
}

/** Exclude model plumbing, duplicated fix prompts, and empty generic advice. */
export function readableAnalysis(text?: string): string {
  if (
    !text ||
    /탐지 출처|CPG 정적 규칙|수정 요청 프롬프트|해당 위치의 CWE-\d+ 후보|detection source|fix prompt|static rule candidate/i.test(
      text
    )
  )
    return ''
  return text.trim()
}
