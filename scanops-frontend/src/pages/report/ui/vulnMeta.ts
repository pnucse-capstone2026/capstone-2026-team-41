import i18n from '../../../shared/lib/i18n'

export interface VulnMeta {
  cause: string
  remedy: string
  reference?: string
}

interface RawVulnMeta {
  cause: { ko: string; en: string }
  remedy: { ko: string; en: string }
  reference?: string
}

const rawMeta: Record<string, RawVulnMeta> = {
  'Cross-Domain Misconfiguration': {
    cause: {
      ko: '서버가 `Access-Control-Allow-Origin: *` 와 같이 과도하게 허용적인 CORS 헤더를 반환하고 있습니다. 이로 인해 공격자가 임의의 외부 도메인에서 이 리소스를 요청해 민감한 데이터를 탈취할 수 있습니다.',
      en: 'The server is returning an overly permissive CORS header such as `Access-Control-Allow-Origin: *`. This allows an attacker to request this resource from any external domain and steal sensitive data.',
    },
    remedy: {
      ko: '`Access-Control-Allow-Origin` 헤더를 와일드카드(`*`) 대신 신뢰할 수 있는 출처 목록으로 제한하세요.\n예) `Access-Control-Allow-Origin: https://yourdomain.com`\n자격 증명(쿠키 등)이 필요한 경우 `Access-Control-Allow-Credentials: true` 와 함께 특정 도메인만 허용해야 합니다.',
      en: 'Restrict the `Access-Control-Allow-Origin` header to a list of trusted origins instead of a wildcard (`*`).\nExample: `Access-Control-Allow-Origin: https://yourdomain.com`\nIf credentials (e.g. cookies) are required, allow only specific domains together with `Access-Control-Allow-Credentials: true`.',
    },
    reference: 'https://owasp.org/www-community/attacks/CORS_OriginHeaderScrutiny',
  },
  'Content Security Policy (CSP) Header Not Set': {
    cause: {
      ko: 'HTTP 응답 헤더에 `Content-Security-Policy`가 없습니다. CSP가 없으면 브라우저가 인라인 스크립트나 외부 출처의 스크립트를 제한 없이 실행해 XSS(Cross-Site Scripting) 공격에 취약해집니다.',
      en: 'The `Content-Security-Policy` header is missing from the HTTP response. Without a CSP, the browser can execute inline scripts or scripts from external origins without restriction, leaving the site vulnerable to Cross-Site Scripting (XSS) attacks.',
    },
    remedy: {
      ko: '응답 헤더에 CSP를 추가하세요.\n예) `Content-Security-Policy: default-src \'self\'; script-src \'self\'; object-src \'none\'`\n다음 순서로 적용을 권장합니다:\n1. `Content-Security-Policy-Report-Only` 로 먼저 테스트\n2. 위반 리포트 확인 후 정책 정제\n3. 실제 `Content-Security-Policy` 헤더로 전환',
      en: "Add a CSP to the response headers.\nExample: `Content-Security-Policy: default-src 'self'; script-src 'self'; object-src 'none'`\nWe recommend the following rollout order:\n1. Test first with `Content-Security-Policy-Report-Only`\n2. Review violation reports and refine the policy\n3. Switch to the enforcing `Content-Security-Policy` header",
    },
    reference: 'https://developer.mozilla.org/ko/docs/Web/HTTP/CSP',
  },
  'X-Frame-Options Header Not Set': {
    cause: {
      ko: '`X-Frame-Options` 헤더가 없어 이 페이지를 `<iframe>` 안에 삽입할 수 있습니다. 공격자가 투명한 iframe 위에 클릭을 유도해 사용자 모르게 원치 않는 작업을 실행시키는 클릭재킹(Clickjacking) 공격에 노출됩니다.',
      en: 'The `X-Frame-Options` header is missing, so this page can be embedded inside an `<iframe>`. This exposes the site to Clickjacking attacks, where an attacker lures a user into clicking on a transparent iframe to trigger unintended actions without their knowledge.',
    },
    remedy: {
      ko: '모든 응답에 아래 헤더 중 하나를 추가하세요.\n- `X-Frame-Options: DENY` (모든 프레임 허용 안 함)\n- `X-Frame-Options: SAMEORIGIN` (동일 출처만 허용)\n또는 CSP의 `frame-ancestors` 지시어를 사용하세요: `Content-Security-Policy: frame-ancestors \'self\'`',
      en: "Add one of the following headers to every response:\n- `X-Frame-Options: DENY` (disallow framing entirely)\n- `X-Frame-Options: SAMEORIGIN` (allow only the same origin)\nOr use the CSP `frame-ancestors` directive: `Content-Security-Policy: frame-ancestors 'self'`",
    },
  },
  'Missing Anti-clickjacking Header': {
    cause: {
      ko: 'X-Frame-Options 또는 Content-Security-Policy의 frame-ancestors 지시어가 없어 클릭재킹 공격에 취약합니다.',
      en: 'Neither an X-Frame-Options header nor a Content-Security-Policy frame-ancestors directive is present, leaving the site vulnerable to Clickjacking attacks.',
    },
    remedy: {
      ko: '`X-Frame-Options: SAMEORIGIN` 또는 `Content-Security-Policy: frame-ancestors \'self\'` 헤더를 추가하세요.',
      en: "Add an `X-Frame-Options: SAMEORIGIN` or `Content-Security-Policy: frame-ancestors 'self'` header.",
    },
  },
  'X-Content-Type-Options Header Missing': {
    cause: {
      ko: '`X-Content-Type-Options: nosniff` 헤더가 없어 브라우저가 응답의 MIME 타입을 잘못 추측(MIME sniffing)할 수 있습니다. 이를 이용해 공격자는 이미지나 텍스트 파일로 위장한 악성 스크립트를 실행시킬 수 있습니다.',
      en: 'The `X-Content-Type-Options: nosniff` header is missing, allowing the browser to incorrectly guess (MIME sniff) the response type. An attacker can exploit this to execute malicious scripts disguised as image or text files.',
    },
    remedy: {
      ko: '모든 응답에 `X-Content-Type-Options: nosniff` 헤더를 추가하고, 각 리소스가 올바른 `Content-Type`을 반환하는지 확인하세요.',
      en: 'Add the `X-Content-Type-Options: nosniff` header to every response, and verify that each resource returns the correct `Content-Type`.',
    },
  },
  'Information Disclosure - Suspicious Comments': {
    cause: {
      ko: '소스코드나 응답에 내부 정보(TODO, FIXME, 비밀번호 힌트, 내부 시스템 정보 등)가 포함된 주석이 노출되어 있습니다. 공격자가 이를 통해 시스템 구조나 취약점을 파악할 수 있습니다.',
      en: 'Comments containing internal information (TODO, FIXME, password hints, internal system details, etc.) are exposed in the source code or response. An attacker can use these to learn about the system architecture or discover vulnerabilities.',
    },
    remedy: {
      ko: '프로덕션 빌드 시 민감한 주석을 자동으로 제거하도록 빌드 도구를 설정하세요. 코드 리뷰에서 민감 정보가 포함된 주석을 차단하는 정책을 도입하고, 시크릿 키나 내부 경로는 절대 주석에 기록하지 마세요.',
      en: 'Configure your build tooling to automatically strip sensitive comments in production builds. Adopt a code review policy that blocks comments containing sensitive information, and never record secret keys or internal paths in comments.',
    },
  },
  'Strict-Transport-Security Header Not Set': {
    cause: {
      ko: 'HSTS(HTTP Strict Transport Security) 헤더가 없어 브라우저가 HTTP로 초기 연결을 시도할 수 있습니다. 이를 공격자가 가로채 SSL 스트리핑 공격으로 HTTPS 연결을 HTTP로 다운그레이드할 수 있습니다.',
      en: 'The HSTS (HTTP Strict Transport Security) header is missing, so the browser may attempt an initial connection over HTTP. An attacker can intercept this and downgrade the HTTPS connection to HTTP via an SSL stripping attack.',
    },
    remedy: {
      ko: '`Strict-Transport-Security: max-age=31536000; includeSubDomains` 헤더를 추가하세요. HTTPS가 완전히 구성된 후 적용하고, HSTS Preload List 등록도 고려하세요.',
      en: 'Add the `Strict-Transport-Security: max-age=31536000; includeSubDomains` header. Apply it only after HTTPS is fully configured, and consider registering the domain with the HSTS Preload List.',
    },
  },
  'Server Leaks Version Information via "Server" HTTP Response Header Field': {
    cause: {
      ko: '`Server` 응답 헤더가 서버 소프트웨어와 버전 정보를 노출하고 있습니다. 공격자가 이 정보를 이용해 알려진 취약점을 대상으로 표적 공격을 할 수 있습니다.',
      en: 'The `Server` response header exposes the server software and version information. An attacker can use this information to target known vulnerabilities in that specific version.',
    },
    remedy: {
      ko: '웹 서버 설정에서 `Server` 헤더를 제거하거나 값을 최소화하세요.\n- Nginx: `server_tokens off;`\n- Apache: `ServerTokens Prod` + `ServerSignature Off`\n- Express: `app.disable(\'x-powered-by\')`',
      en: "Remove or minimize the `Server` header in your web server configuration.\n- Nginx: `server_tokens off;`\n- Apache: `ServerTokens Prod` + `ServerSignature Off`\n- Express: `app.disable('x-powered-by')`",
    },
  },
  'Cookie Without Secure Flag': {
    cause: {
      ko: '쿠키에 `Secure` 플래그가 없어 HTTP 연결에서도 전송될 수 있습니다. 네트워크를 도청하는 공격자(중간자 공격)가 쿠키를 가로채 세션을 탈취할 수 있습니다.',
      en: 'The cookie lacks the `Secure` flag, so it can be transmitted over an unencrypted HTTP connection. An attacker eavesdropping on the network (man-in-the-middle) can intercept the cookie and hijack the session.',
    },
    remedy: {
      ko: '세션 쿠키 및 인증 관련 쿠키 모두에 `Secure` 플래그를 추가하세요. HTTPS만 사용하는 서비스라면 `HttpOnly; Secure; SameSite=Strict` 조합을 권장합니다.',
      en: 'Add the `Secure` flag to all session and authentication-related cookies. For services that use HTTPS exclusively, we recommend combining `HttpOnly; Secure; SameSite=Strict`.',
    },
  },
  'Cookie No HttpOnly Flag': {
    cause: {
      ko: '쿠키에 `HttpOnly` 플래그가 없어 JavaScript(`document.cookie`)로 쿠키를 읽을 수 있습니다. XSS 취약점과 결합되면 공격자가 세션 쿠키를 탈취해 계정을 탈취할 수 있습니다.',
      en: 'The cookie lacks the `HttpOnly` flag, allowing it to be read via JavaScript (`document.cookie`). Combined with an XSS vulnerability, an attacker can steal the session cookie and take over the account.',
    },
    remedy: {
      ko: '세션·인증 관련 모든 쿠키에 `HttpOnly` 플래그를 추가하세요. 클라이언트 JS에서 쿠키를 직접 읽을 필요가 없다면 반드시 설정해야 합니다.',
      en: 'Add the `HttpOnly` flag to all session and authentication-related cookies. This should always be set unless client-side JavaScript genuinely needs to read the cookie directly.',
    },
  },
  'Vulnerable JS Library': {
    cause: {
      ko: '알려진 보안 취약점이 있는 버전의 JavaScript 라이브러리를 사용 중입니다. 공격자가 공개된 익스플로잇을 이용해 XSS, 프로토타입 오염 등의 공격을 수행할 수 있습니다.',
      en: 'A version of a JavaScript library with known security vulnerabilities is in use. An attacker can leverage publicly available exploits to perform attacks such as XSS or prototype pollution.',
    },
    remedy: {
      ko: '라이브러리를 최신 보안 패치 버전으로 업데이트하세요. `npm audit` 또는 Snyk, Dependabot 등의 도구로 정기적으로 의존성 취약점을 점검하세요.',
      en: 'Update the library to the latest patched version. Regularly check for dependency vulnerabilities using tools such as `npm audit`, Snyk, or Dependabot.',
    },
  },
  'HTTPS Content Available via HTTP': {
    cause: {
      ko: 'HTTPS로 제공되는 사이트의 콘텐츠가 HTTP로도 접근 가능합니다. HTTP는 암호화되지 않아 중간자(MITM) 공격자가 전송 중인 데이터를 도청하거나 변조할 수 있습니다. 또한 HSTS가 설정되지 않은 경우 SSL 스트리핑 공격으로 HTTPS 연결을 강제로 HTTP로 다운그레이드할 수 있습니다.',
      en: 'Content served over HTTPS is also accessible over HTTP. Because HTTP is unencrypted, a man-in-the-middle (MITM) attacker can eavesdrop on or tamper with data in transit. Additionally, if HSTS is not configured, an SSL stripping attack can force the HTTPS connection to downgrade to HTTP.',
    },
    remedy: {
      ko: '모든 HTTP 요청을 HTTPS로 리다이렉트하도록 서버를 설정하세요.\n- Nginx: `return 301 https://$host$request_uri;`\n- Apache: `RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]`\n\n추가로 `Strict-Transport-Security: max-age=31536000; includeSubDomains` 헤더를 설정해 브라우저가 이후 요청을 항상 HTTPS로 전송하도록 강제하세요.',
      en: 'Configure the server to redirect all HTTP requests to HTTPS.\n- Nginx: `return 301 https://$host$request_uri;`\n- Apache: `RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301]`\n\nAdditionally, set the `Strict-Transport-Security: max-age=31536000; includeSubDomains` header to force the browser to always send subsequent requests over HTTPS.',
    },
    reference: 'https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/09-Testing_for_Weak_Cryptography/02-Testing_for_Padding_Oracle',
  },

  // ── Frequently detected ZAP findings ───────────────────────────────────────────

  'Absence of Anti-CSRF Tokens': {
    cause: {
      ko: 'HTML 폼에 CSRF 토큰이 없습니다. CSRF(Cross-Site Request Forgery) 공격은 피해자가 의도하지 않은 상태에서 공격자가 지정한 요청을 전송하도록 강제하는 방식입니다. 피해자가 해당 사이트에 로그인된 상태라면 공격자는 피해자 권한으로 임의의 작업을 실행할 수 있습니다.',
      en: 'The HTML form is missing a CSRF token. A CSRF (Cross-Site Request Forgery) attack forces a victim to unknowingly submit a request specified by the attacker. If the victim is logged into the site, the attacker can perform arbitrary actions with the victim\'s privileges.',
    },
    remedy: {
      ko: '모든 상태 변경 폼에 서버에서 생성한 예측 불가능한 CSRF 토큰을 포함하세요.\n- Spring Security: `csrf()` 기본 활성화\n- Django: `{% csrf_token %}` 템플릿 태그 사용\n- 또는 `SameSite=Strict` 쿠키 속성으로 보완하세요.',
      en: 'Include a server-generated, unpredictable CSRF token in every state-changing form.\n- Spring Security: `csrf()` is enabled by default\n- Django: use the `{% csrf_token %}` template tag\n- Or supplement with the `SameSite=Strict` cookie attribute.',
    },
    reference: 'https://owasp.org/www-community/attacks/csrf',
  },
  'Sub Resource Integrity Attribute Missing': {
    cause: {
      ko: '외부 CDN에서 불러오는 스크립트·스타일시트에 `integrity` 속성이 없습니다. CDN이 해킹되거나 파일이 변조될 경우 악성 코드가 그대로 사용자 브라우저에서 실행될 수 있습니다.',
      en: 'Scripts and stylesheets loaded from an external CDN lack an `integrity` attribute. If the CDN is compromised or the file is tampered with, malicious code can execute directly in the user\'s browser.',
    },
    remedy: {
      ko: '외부 리소스 태그에 `integrity`와 `crossorigin` 속성을 추가하세요.\n예) `<script src="..." integrity="sha384-xxxx" crossorigin="anonymous"></script>`\nhttps://www.srihash.org/ 에서 해시값을 자동으로 생성할 수 있습니다.',
      en: 'Add `integrity` and `crossorigin` attributes to external resource tags.\nExample: `<script src="..." integrity="sha384-xxxx" crossorigin="anonymous"></script>`\nYou can automatically generate the hash value at https://www.srihash.org/.',
    },
    reference: 'https://developer.mozilla.org/ko/docs/Web/Security/Subresource_Integrity',
  },
  'Cookie without SameSite Attribute': {
    cause: {
      ko: '쿠키에 `SameSite` 속성이 없습니다. 이 경우 브라우저가 크로스 사이트 요청에도 쿠키를 함께 전송하여 CSRF 공격에 노출될 수 있습니다.',
      en: 'The cookie lacks a `SameSite` attribute. In this case, the browser also sends the cookie on cross-site requests, exposing the site to CSRF attacks.',
    },
    remedy: {
      ko: '쿠키 설정 시 `SameSite` 속성을 추가하세요.\n- `SameSite=Strict`: 크로스 사이트 요청에서 쿠키를 전혀 전송하지 않음 (가장 안전)\n- `SameSite=Lax`: 최상위 네비게이션 GET 요청에만 전송 (일반적인 권장값)\n- `SameSite=None; Secure`: 명시적으로 크로스 사이트 허용 시 사용',
      en: 'Add a `SameSite` attribute when setting cookies.\n- `SameSite=Strict`: never sends the cookie on cross-site requests (safest)\n- `SameSite=Lax`: sends the cookie only for top-level navigation GET requests (the common recommended value)\n- `SameSite=None; Secure`: use when cross-site access must be explicitly allowed',
    },
  },
  'Cross-Domain JavaScript Source File Inclusion': {
    cause: {
      ko: '외부 도메인의 JavaScript 파일을 직접 불러오고 있습니다. 해당 외부 도메인이 해킹되거나 악의적인 경우, 변조된 스크립트가 사용자 브라우저에서 실행되어 세션 탈취·악성코드 주입이 발생할 수 있습니다.',
      en: 'A JavaScript file is being loaded directly from an external domain. If that external domain is compromised or malicious, a tampered script can execute in the user\'s browser, leading to session hijacking or malware injection.',
    },
    remedy: {
      ko: '가능하면 외부 JS를 직접 호스팅하거나, SRI(`integrity`) 속성을 적용하세요.\n신뢰할 수 없는 출처의 스크립트는 제거하고, CSP의 `script-src` 지시어로 허용 도메인을 명시적으로 제한하세요.',
      en: 'Where possible, host the external JS file yourself, or apply SRI (`integrity`) attributes.\nRemove scripts from untrusted sources, and explicitly restrict allowed domains using the CSP `script-src` directive.',
    },
  },
  'Timestamp Disclosure - Unix': {
    cause: {
      ko: '응답 본문이나 헤더에 Unix 타임스탬프가 노출되어 있습니다. 공격자가 이를 통해 서버 내부 시간 정보, 파일 생성·수정 시각, 세션 만료 패턴 등을 추측하는 데 활용할 수 있습니다.',
      en: 'A Unix timestamp is exposed in the response body or headers. An attacker can use this to infer internal server timing information, file creation/modification times, or session expiration patterns.',
    },
    remedy: {
      ko: '응답에서 불필요한 타임스탬프 정보를 제거하거나 노출하지 않도록 코드를 수정하세요. 꼭 필요한 경우 사람이 읽기 어려운 형식으로 변환하거나 임의값을 추가해 패턴을 숨기세요.',
      en: 'Modify the code to remove unnecessary timestamp information from responses, or avoid exposing it altogether. If it is genuinely required, convert it to a less human-readable format or add random noise to obscure the pattern.',
    },
  },
  'External Redirect': {
    cause: {
      ko: '사용자 입력값(파라미터)을 검증 없이 리다이렉트 URL로 사용하고 있습니다. 공격자가 악의적인 URL로 파라미터를 조작하면 피싱 사이트로 사용자를 유도하거나, 인증 토큰 등 민감 정보를 탈취하는 오픈 리다이렉트 공격이 가능합니다.',
      en: 'User input (a parameter) is used as a redirect URL without validation. If an attacker manipulates the parameter with a malicious URL, they can lure users to a phishing site or steal sensitive information such as authentication tokens via an open redirect attack.',
    },
    remedy: {
      ko: '리다이렉트 URL을 화이트리스트로 관리하고, 외부 도메인으로의 리다이렉트는 차단하세요.\n예) 허용된 경로 목록만 사용하거나, 상대 경로만 허용하는 방식으로 구현하세요.',
      en: 'Manage redirect URLs with an allowlist, and block redirects to external domains.\nExample: implement this by using only an approved list of paths, or by allowing only relative paths.',
    },
    reference: 'https://cheatsheetseries.owasp.org/cheatsheets/Unvalidated_Redirects_and_Forwards_Cheat_Sheet.html',
  },
  'CSP: script-src unsafe-inline': {
    cause: {
      ko: 'Content-Security-Policy의 `script-src`에 `unsafe-inline`이 허용되어 있습니다. 이 설정은 인라인 `<script>` 태그와 이벤트 핸들러 속성(`onclick` 등)의 실행을 허용하므로 CSP가 XSS 방어 역할을 사실상 수행하지 못합니다.',
      en: 'The Content-Security-Policy `script-src` directive allows `unsafe-inline`. This setting permits execution of inline `<script>` tags and event handler attributes (e.g. `onclick`), which effectively defeats the CSP\'s role as an XSS defense.',
    },
    remedy: {
      ko: '`unsafe-inline` 대신 nonce 또는 hash 기반 방식을 사용하세요.\n예) `Content-Security-Policy: script-src \'nonce-{랜덤값}\'`\n매 요청마다 새로운 nonce를 생성하고 허용된 스크립트 태그에만 적용하세요.',
      en: "Use a nonce- or hash-based approach instead of `unsafe-inline`.\nExample: `Content-Security-Policy: script-src 'nonce-{random-value}'`\nGenerate a new nonce for every request and apply it only to approved script tags.",
    },
  },
  'CSP: style-src unsafe-inline': {
    cause: {
      ko: 'Content-Security-Policy의 `style-src`에 `unsafe-inline`이 허용되어 인라인 스타일 적용이 가능합니다. CSS 인젝션 공격을 통해 UI를 변조하거나 민감 정보를 추출하는 데 악용될 수 있습니다.',
      en: 'The Content-Security-Policy `style-src` directive allows `unsafe-inline`, permitting inline styles. This can be exploited via CSS injection attacks to tamper with the UI or exfiltrate sensitive information.',
    },
    remedy: {
      ko: '`unsafe-inline` 대신 nonce 또는 hash 기반 방식으로 인라인 스타일을 제어하거나, 스타일을 외부 CSS 파일로 분리하세요.',
      en: 'Control inline styles using a nonce- or hash-based approach instead of `unsafe-inline`, or move the styles into an external CSS file.',
    },
  },
  'Server Leaks Information via "X-Powered-By" HTTP Response Header Field(s)': {
    cause: {
      ko: '`X-Powered-By` 헤더가 사용 중인 프레임워크나 서버 기술 스택 정보를 노출합니다. 공격자가 특정 버전의 알려진 취약점을 겨냥한 공격에 활용할 수 있습니다.',
      en: 'The `X-Powered-By` header exposes the framework or server technology stack in use. An attacker can use this to target known vulnerabilities in that specific version.',
    },
    remedy: {
      ko: '`X-Powered-By` 헤더를 응답에서 제거하세요.\n- Express: `app.disable(\'x-powered-by\')`\n- PHP: `php.ini`에서 `expose_php = Off`\n- Spring Boot: `server.server-header=` 빈값으로 설정',
      en: "Remove the `X-Powered-By` header from responses.\n- Express: `app.disable('x-powered-by')`\n- PHP: set `expose_php = Off` in `php.ini`\n- Spring Boot: set `server.server-header=` to an empty value",
    },
  },
  'Re-examine Cache-control Directives': {
    cause: {
      ko: '응답의 `Cache-Control` 헤더 설정이 민감한 데이터를 브라우저·프록시 캐시에 저장하도록 허용할 수 있습니다. 공유 컴퓨터나 중간 프록시에서 인증 후 페이지가 캐시되어 다른 사용자에게 노출될 위험이 있습니다.',
      en: 'The `Cache-Control` header configuration on the response may allow sensitive data to be stored in browser or proxy caches. On shared computers or intermediate proxies, a post-authentication page could be cached and exposed to other users.',
    },
    remedy: {
      ko: '인증이 필요하거나 민감한 정보가 포함된 응답에는 아래 헤더를 추가하세요.\n`Cache-Control: no-store, no-cache, must-revalidate`\n`Pragma: no-cache`',
      en: 'Add the following headers to responses that require authentication or contain sensitive information:\n`Cache-Control: no-store, no-cache, must-revalidate`\n`Pragma: no-cache`',
    },
  },
  'Session Management Response Identified': {
    cause: {
      ko: '응답에서 세션 관리와 관련된 쿠키나 토큰이 식별되었습니다. 세션 토큰이 안전하지 않은 방식으로 전송되거나 저장될 경우 세션 하이재킹 공격에 노출될 수 있습니다.',
      en: 'A cookie or token related to session management was identified in the response. If the session token is transmitted or stored insecurely, the site is exposed to session hijacking attacks.',
    },
    remedy: {
      ko: '세션 쿠키에 `HttpOnly`, `Secure`, `SameSite=Strict` 속성을 모두 적용하고, HTTPS 환경에서만 세션을 운용하세요. 로그아웃 시 서버 측에서 세션을 완전히 무효화하세요.',
      en: 'Apply the `HttpOnly`, `Secure`, and `SameSite=Strict` attributes to session cookies, and operate sessions only over HTTPS. Fully invalidate the session on the server side on logout.',
    },
  },
  'User Controllable HTML Element Attribute (Potential XSS)': {
    cause: {
      ko: '사용자 입력값이 HTML 요소의 속성에 충분한 이스케이핑 없이 삽입되고 있습니다. 공격자가 `"><script>` 같은 페이로드를 주입해 XSS(크로스 사이트 스크립팅) 공격을 수행할 수 있습니다.',
      en: 'User input is inserted into an HTML element attribute without sufficient escaping. An attacker can inject a payload such as `"><script>` to perform an XSS (Cross-Site Scripting) attack.',
    },
    remedy: {
      ko: '사용자 입력값을 HTML 속성에 출력할 때 반드시 이스케이핑 처리하세요.\n- HTML 속성에는 `"` → `&quot;`, `<` → `&lt;` 변환\n- 템플릿 엔진의 자동 이스케이핑 기능을 활성화하고, 직접 HTML을 조작하는 코드는 최소화하세요.',
      en: 'Always escape user input when rendering it into HTML attributes.\n- For HTML attributes, convert `"` → `&quot;` and `<` → `&lt;`\n- Enable your template engine\'s automatic escaping feature, and minimize code that manipulates HTML directly.',
    },
    reference: 'https://cheatsheetseries.owasp.org/cheatsheets/Cross_Site_Scripting_Prevention_Cheat_Sheet.html',
  },
  'Authentication Request Identified': {
    cause: {
      ko: '인증 요청(로그인 폼 등)이 탐지되었습니다. 브루트포스 방어, 계정 잠금, 안전한 비밀번호 전송 여부를 점검이 필요합니다.',
      en: 'An authentication request (e.g. a login form) was detected. You should verify brute-force protection, account lockout policies, and secure transmission of passwords.',
    },
    remedy: {
      ko: '로그인 엔드포인트에 다음을 적용하세요.\n- HTTPS를 통해서만 자격 증명 전송\n- 로그인 실패 횟수 제한 및 계정 잠금 정책\n- CAPTCHA 또는 MFA 적용\n- 비밀번호를 bcrypt 등 단방향 해시로 저장',
      en: 'Apply the following to the login endpoint:\n- Transmit credentials only over HTTPS\n- Limit failed login attempts and apply an account lockout policy\n- Apply CAPTCHA or MFA\n- Store passwords using a one-way hash such as bcrypt',
    },
  },
  'Information Disclosure - Debug Error Messages': {
    cause: {
      ko: '서버가 상세한 디버그 에러 메시지(스택 트레이스, DB 쿼리, 파일 경로 등)를 응답에 노출하고 있습니다. 공격자가 이를 통해 내부 구조를 파악하고 더 정교한 공격을 준비할 수 있습니다.',
      en: 'The server exposes detailed debug error messages (stack traces, DB queries, file paths, etc.) in its responses. An attacker can use these to learn about the internal architecture and prepare more sophisticated attacks.',
    },
    remedy: {
      ko: '프로덕션 환경에서는 상세 에러 메시지 출력을 비활성화하고, 사용자에게는 일반적인 오류 페이지만 표시하세요.\n- Spring Boot: `server.error.include-stacktrace=never`\n- Django: `DEBUG = False`\n- Express: 커스텀 에러 핸들러에서 스택 트레이스 숨기기',
      en: 'Disable detailed error output in production and show users only a generic error page.\n- Spring Boot: `server.error.include-stacktrace=never`\n- Django: `DEBUG = False`\n- Express: hide the stack trace in a custom error handler',
    },
  },
  'SQL Injection': {
    cause: {
      ko: '사용자 입력값이 SQL 쿼리에 직접 삽입되어 있습니다. 공격자가 악의적인 SQL 구문을 주입해 데이터베이스의 모든 데이터를 조회·수정·삭제하거나 서버를 장악할 수 있는 매우 심각한 취약점입니다.',
      en: 'User input is inserted directly into a SQL query. This is a critical vulnerability that allows an attacker to inject malicious SQL statements to read, modify, or delete any data in the database, or even take over the server.',
    },
    remedy: {
      ko: '모든 DB 쿼리에 Prepared Statement(파라미터화된 쿼리)를 사용하세요.\n- Java: `PreparedStatement`\n- Python: `cursor.execute("SELECT * FROM t WHERE id=%s", (id,))`\n- ORM 사용 시 raw query 대신 ORM 메서드 활용\n사용자 입력값을 쿼리 문자열에 직접 연결(concatenation)하는 코드를 모두 제거하세요.',
      en: 'Use prepared statements (parameterized queries) for all database queries.\n- Java: `PreparedStatement`\n- Python: `cursor.execute("SELECT * FROM t WHERE id=%s", (id,))`\n- When using an ORM, prefer ORM methods over raw queries\nRemove all code that directly concatenates user input into query strings.',
    },
    reference: 'https://cheatsheetseries.owasp.org/cheatsheets/SQL_Injection_Prevention_Cheat_Sheet.html',
  },
  'Path Traversal': {
    cause: {
      ko: '파일 경로에 사용자 입력값(`../` 등)이 포함될 수 있어, 공격자가 서버의 허용되지 않은 디렉토리에 접근해 민감한 파일을 읽거나 실행할 수 있습니다.',
      en: 'A file path can include user input (e.g. `../`), allowing an attacker to access unauthorized directories on the server and read or execute sensitive files.',
    },
    remedy: {
      ko: '파일 경로 구성 시 사용자 입력을 사용하지 않거나, 반드시 사용해야 한다면 허용 목록(화이트리스트)으로 검증하세요.\n`Path.normalize()` 후 허용된 기본 디렉토리 내에 있는지 반드시 확인하세요.',
      en: 'Avoid using user input when constructing file paths, or if it is unavoidable, validate it against an allowlist.\nAfter calling `Path.normalize()`, always verify that the resulting path is within the allowed base directory.',
    },
  },
  'Remote OS Command Injection': {
    cause: {
      ko: '사용자 입력값이 OS 명령어 실행에 사용되고 있습니다. 공격자가 악의적인 명령어를 주입해 서버를 완전히 장악할 수 있는 매우 위험한 취약점입니다.',
      en: 'User input is used when executing OS commands. This is a highly dangerous vulnerability that allows an attacker to inject malicious commands and fully take over the server.',
    },
    remedy: {
      ko: 'OS 명령어 실행 함수에 사용자 입력값을 직접 전달하지 마세요. 반드시 필요하다면 허용된 명령어 목록만 사용하고, 쉘 인터프리터를 거치지 않는 방식(`execFile` 등)으로 실행하세요.',
      en: 'Do not pass user input directly to OS command execution functions. If it is genuinely necessary, restrict execution to an allowed list of commands and run them via a method that bypasses the shell interpreter (e.g. `execFile`).',
    },
  },
  'Absence of Anti-CSRF Tokens - No Known Anti-CSRF Token': {
    cause: {
      ko: 'HTML 폼에 CSRF 방어 토큰이 없어 크로스 사이트 요청 위조 공격에 취약합니다. 인증된 사용자의 세션을 도용해 의도하지 않은 요청을 서버에 전송할 수 있습니다.',
      en: 'The HTML form lacks a CSRF protection token, making it vulnerable to Cross-Site Request Forgery attacks. An attacker can hijack an authenticated user\'s session to send unintended requests to the server.',
    },
    remedy: {
      ko: '모든 상태 변경 폼에 CSRF 토큰을 추가하거나, `SameSite=Strict` 쿠키 속성으로 보완하세요.',
      en: 'Add a CSRF token to every state-changing form, or supplement protection with the `SameSite=Strict` cookie attribute.',
    },
  },
}

export function getVulnMeta(vulnType: string): VulnMeta | null {
  const lang = i18n.language === 'en' ? 'en' : 'ko'
  const resolve = (raw: RawVulnMeta): VulnMeta => ({
    cause: raw.cause[lang],
    remedy: raw.remedy[lang],
    reference: raw.reference,
  })
  const exact = rawMeta[vulnType]
  if (exact) return resolve(exact)
  const key = Object.keys(rawMeta).find((k) => vulnType.toLowerCase().includes(k.toLowerCase()))
  return key ? resolve(rawMeta[key]) : null
}
