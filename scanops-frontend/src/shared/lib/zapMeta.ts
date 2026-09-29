/**
 * ZAP 경보(영어)를 한국어/영어 친화 메타로 변환하는 사전.
 * ZAP 경보 종류는 한정적이라, 흔한 것들을 이름·한 줄 설명·요약·공격·해결로 매핑한다.
 * 백엔드 AI 메타가 없거나 영어일 때 프론트에서 깔끔한 카드로 보여주기 위함.
 */
import i18n from './i18n'

export interface ZapMeta {
  name: string
  cwe?: string
  plain: string // "쉽게 말하면"
  summary: string
  attack: string
  fix: string
}

interface LocalizedText {
  ko: string
  en: string
}

interface LocalizedZapMeta {
  name: LocalizedText
  cwe?: string
  plain: LocalizedText
  summary: LocalizedText
  attack: LocalizedText
  fix: LocalizedText
}

interface Rule { keys: string[]; meta: LocalizedZapMeta }

const RULES: Rule[] = [
  {
    keys: ['anti-clickjacking', 'x-frame-options', 'clickjacking'],
    meta: {
      name: { ko: '클릭재킹 방지 헤더 누락', en: 'Missing Anti-Clickjacking Header' },
      cwe: 'CWE-1021',
      plain: {
        ko: '페이지가 투명하게 덧씌워져, 사용자가 모르고 악성 버튼을 누르게 만들 수 있어요.',
        en: 'Your page can be invisibly overlaid, tricking users into clicking a malicious button without knowing it.',
      },
      summary: {
        ko: '응답에 X-Frame-Options 또는 CSP frame-ancestors가 없어 클릭재킹에 노출됩니다.',
        en: 'The response lacks X-Frame-Options or a CSP frame-ancestors directive, exposing it to clickjacking.',
      },
      attack: {
        ko: '공격자가 우리 페이지를 투명한 iframe으로 덮어, 사용자가 의도치 않은 클릭(결제·삭제 등)을 하도록 유도합니다.',
        en: 'An attacker overlays your page in a transparent iframe, luring users into unintended clicks (payments, deletions, etc.).',
      },
      fix: {
        ko: "응답 헤더에 X-Frame-Options: DENY(또는 SAMEORIGIN), 혹은 CSP frame-ancestors 'none'을 설정하세요.",
        en: "Set the response header X-Frame-Options: DENY (or SAMEORIGIN), or a CSP frame-ancestors 'none' directive.",
      },
    },
  },
  {
    keys: ['x-content-type-options'],
    meta: {
      name: { ko: '콘텐츠 타입 스니핑 방지 헤더 누락', en: 'Missing X-Content-Type-Options Header' },
      cwe: 'CWE-693',
      plain: {
        ko: '브라우저가 파일 종류를 멋대로 추측해서, 이미지인 척한 악성 스크립트가 실행될 수 있어요.',
        en: 'The browser guesses the file type on its own, so a malicious script disguised as an image could get executed.',
      },
      summary: {
        ko: 'X-Content-Type-Options: nosniff가 없어 MIME 스니핑으로 인한 XSS 위험이 있습니다.',
        en: 'X-Content-Type-Options: nosniff is missing, creating an XSS risk via MIME sniffing.',
      },
      attack: {
        ko: '브라우저가 Content-Type을 무시하고 응답을 스크립트로 해석하면 악성 코드가 실행됩니다.',
        en: 'If the browser ignores Content-Type and interprets the response as a script, malicious code gets executed.',
      },
      fix: {
        ko: '응답 헤더에 X-Content-Type-Options: nosniff 를 추가하세요.',
        en: 'Add the response header X-Content-Type-Options: nosniff.',
      },
    },
  },
  {
    keys: ['content security policy', 'csp'],
    meta: {
      name: { ko: '콘텐츠 보안 정책(CSP) 미설정', en: 'Content Security Policy (CSP) Not Set' },
      cwe: 'CWE-693',
      plain: {
        ko: '악성 스크립트가 끼어들어도 막아줄 "허용 목록"이 없어서 XSS 피해가 커질 수 있어요.',
        en: 'There is no "allow-list" to block malicious scripts that sneak in, so XSS damage can spread further.',
      },
      summary: {
        ko: 'CSP 헤더가 없어 XSS·데이터 인젝션의 영향 범위가 커집니다.',
        en: 'The missing CSP header widens the blast radius of XSS and data-injection attacks.',
      },
      attack: {
        ko: '주입된 스크립트나 외부 리소스 로드를 제한할 정책이 없어 XSS 피해가 확대됩니다.',
        en: 'With no policy restricting injected scripts or external resource loading, XSS impact is amplified.',
      },
      fix: {
        ko: 'Content-Security-Policy 헤더로 script-src 등 신뢰 출처를 명시적으로 제한하세요.',
        en: 'Use the Content-Security-Policy header to explicitly restrict trusted sources via script-src and similar directives.',
      },
    },
  },
  {
    keys: ['strict-transport-security', 'hsts'],
    meta: {
      name: { ko: 'HSTS 헤더 미설정', en: 'HSTS Header Not Set' },
      cwe: 'CWE-319',
      plain: {
        ko: '사용자가 실수로 http로 접속하면 중간에서 가로채일 수 있어요. https 강제가 안 돼 있어요.',
        en: "If a user accidentally connects over http, the connection can be intercepted — https isn't being enforced.",
      },
      summary: {
        ko: 'HSTS가 없어 SSL stripping·다운그레이드 공격에 노출됩니다.',
        en: 'Without HSTS, the site is exposed to SSL stripping and downgrade attacks.',
      },
      attack: {
        ko: '중간자가 https를 http로 다운그레이드해 통신을 가로챌 수 있습니다.',
        en: 'A man-in-the-middle can downgrade https to http and intercept the traffic.',
      },
      fix: {
        ko: 'Strict-Transport-Security: max-age=31536000; includeSubDomains 를 설정하세요.',
        en: 'Set Strict-Transport-Security: max-age=31536000; includeSubDomains.',
      },
    },
  },
  {
    keys: ['httponly'],
    meta: {
      name: { ko: '쿠키 HttpOnly 플래그 누락', en: 'Cookie Missing HttpOnly Flag' },
      cwe: 'CWE-1004',
      plain: {
        ko: '로그인 쿠키를 자바스크립트가 읽을 수 있어서, XSS가 생기면 계정을 통째로 탈취당할 수 있어요.',
        en: 'JavaScript can read the login cookie, so if XSS occurs, the account can be hijacked entirely.',
      },
      summary: {
        ko: '쿠키에 HttpOnly가 없어 스크립트(XSS)로 세션 쿠키가 탈취될 수 있습니다.',
        en: 'The cookie lacks HttpOnly, so a script (via XSS) can steal the session cookie.',
      },
      attack: {
        ko: 'XSS로 document.cookie를 읽어 세션을 탈취합니다.',
        en: 'An attacker uses XSS to read document.cookie and hijack the session.',
      },
      fix: {
        ko: '세션 쿠키에 HttpOnly 속성을 설정하세요.',
        en: 'Set the HttpOnly attribute on session cookies.',
      },
    },
  },
  {
    keys: ['secure flag', 'no secure'],
    meta: {
      name: { ko: '쿠키 Secure 플래그 누락', en: 'Cookie Missing Secure Flag' },
      cwe: 'CWE-614',
      plain: {
        ko: '로그인 쿠키가 암호화 안 된 http로도 전송돼서, 중간에서 가로채일 수 있어요.',
        en: 'The login cookie can also be sent over unencrypted http, so it can be intercepted in transit.',
      },
      summary: {
        ko: '쿠키에 Secure가 없어 평문(HTTP) 전송 시 탈취 위험이 있습니다.',
        en: 'The cookie lacks the Secure flag, risking interception when sent in plaintext over HTTP.',
      },
      attack: {
        ko: 'HTTP 요청에 쿠키가 실려 중간자가 가로챕니다.',
        en: 'The cookie rides along on an HTTP request and is intercepted by a man-in-the-middle.',
      },
      fix: {
        ko: '쿠키에 Secure 속성을 설정하고 HTTPS만 사용하세요.',
        en: 'Set the Secure attribute on the cookie and use HTTPS exclusively.',
      },
    },
  },
  {
    keys: ['samesite'],
    meta: {
      name: { ko: '쿠키 SameSite 속성 누락', en: 'Cookie Missing SameSite Attribute' },
      cwe: 'CWE-1275',
      plain: {
        ko: '다른 사이트에서 우리 사이트로 요청을 위조하는 CSRF를 막는 설정이 빠졌어요.',
        en: 'The setting that blocks CSRF — forged requests sent from another site to yours — is missing.',
      },
      summary: {
        ko: 'SameSite 속성이 없어 CSRF 위험이 있습니다.',
        en: 'The missing SameSite attribute creates a CSRF risk.',
      },
      attack: {
        ko: '타 사이트에서 위조 요청 시 쿠키가 자동 전송되어 CSRF가 가능합니다.',
        en: 'When a forged request comes from another site, the cookie is sent automatically, enabling CSRF.',
      },
      fix: {
        ko: '쿠키에 SameSite=Lax 이상을 설정하세요.',
        en: 'Set SameSite=Lax or stricter on the cookie.',
      },
    },
  },
  {
    keys: ['server leaks version', 'server' /* Server 헤더 */ ],
    meta: {
      name: { ko: '서버 버전 정보 노출', en: 'Server Version Information Disclosure' },
      cwe: 'CWE-200',
      plain: {
        ko: '서버 종류·버전이 그대로 드러나서, 공격자가 그 버전의 알려진 취약점을 노리기 쉬워져요.',
        en: 'The server type and version are exposed as-is, making it easy for attackers to target known vulnerabilities in that version.',
      },
      summary: {
        ko: 'Server 헤더로 소프트웨어 버전이 노출됩니다.',
        en: 'The Server header discloses the software version.',
      },
      attack: {
        ko: '노출된 버전의 공개 취약점(CVE)을 표적 삼아 공격합니다.',
        en: 'Attackers target publicly known vulnerabilities (CVEs) for the disclosed version.',
      },
      fix: {
        ko: 'Server 헤더에서 버전 정보를 제거하거나 숨기세요.',
        en: 'Remove or mask the version information in the Server header.',
      },
    },
  },
  {
    keys: ['x-powered-by'],
    meta: {
      name: { ko: 'X-Powered-By 정보 노출', en: 'X-Powered-By Information Disclosure' },
      cwe: 'CWE-200',
      plain: {
        ko: '사용하는 기술 스택이 노출돼서 공격 표면을 좁혀주는 단서가 돼요.',
        en: 'Your technology stack is exposed, giving attackers clues that narrow down the attack surface.',
      },
      summary: {
        ko: 'X-Powered-By 헤더로 기술 스택이 노출됩니다.',
        en: 'The X-Powered-By header discloses the technology stack.',
      },
      attack: {
        ko: '기술 스택을 알아내 표적 공격에 활용합니다.',
        en: 'Attackers identify the technology stack and use it to craft targeted attacks.',
      },
      fix: {
        ko: 'X-Powered-By 등 불필요한 정보 노출 헤더를 제거하세요.',
        en: 'Remove unnecessary information-disclosing headers such as X-Powered-By.',
      },
    },
  },
  {
    keys: ['permissions policy', 'permissions-policy', 'feature policy'],
    meta: {
      name: { ko: 'Permissions-Policy 헤더 미설정', en: 'Permissions-Policy Header Not Set' },
      cwe: 'CWE-693',
      plain: {
        ko: '카메라·위치 같은 브라우저 기능 사용을 제한하는 정책이 없어요.',
        en: "There's no policy restricting use of browser features like the camera or geolocation.",
      },
      summary: {
        ko: 'Permissions-Policy가 없어 브라우저 기능 오남용을 제한하지 못합니다.',
        en: 'The missing Permissions-Policy fails to restrict misuse of browser features.',
      },
      attack: {
        ko: '악성 스크립트가 카메라·위치 등 민감 기능 접근을 시도할 수 있습니다.',
        en: 'A malicious script could attempt to access sensitive features like the camera or geolocation.',
      },
      fix: {
        ko: 'Permissions-Policy 헤더로 필요한 기능만 허용하세요.',
        en: 'Use the Permissions-Policy header to allow only the features you actually need.',
      },
    },
  },
  {
    keys: ['timestamp disclosure'],
    meta: {
      name: { ko: '타임스탬프 노출', en: 'Timestamp Disclosure' },
      cwe: 'CWE-200',
      plain: {
        ko: '응답에 시간값이 노출돼요. 보통 위험은 낮지만 불필요한 정보가 새는 거예요.',
        en: 'A timestamp value is exposed in the response. Risk is usually low, but it is still an unnecessary information leak.',
      },
      summary: {
        ko: '응답에 타임스탬프가 노출됩니다(정보 노출).',
        en: 'A timestamp is disclosed in the response (information disclosure).',
      },
      attack: {
        ko: '노출된 값으로 서버 동작을 추정할 수 있습니다(영향 낮음).',
        en: 'The exposed value can be used to infer server behavior (low impact).',
      },
      fix: {
        ko: '불필요한 타임스탬프 노출을 제거하세요.',
        en: 'Remove unnecessary timestamp disclosures.',
      },
    },
  },
  {
    keys: ['suspicious comments', 'information disclosure'],
    meta: {
      name: { ko: '정보 노출 (주석/디버그)', en: 'Information Disclosure (Comments/Debug)' },
      cwe: 'CWE-200',
      plain: {
        ko: '코드 주석이나 디버그 정보가 사용자에게 보여서 내부 정보가 샐 수 있어요.',
        en: 'Code comments or debug information are visible to users, potentially leaking internal details.',
      },
      summary: {
        ko: '응답에 개발용 주석·디버그 정보가 포함되어 정보가 노출됩니다.',
        en: 'The response includes development comments or debug information, disclosing internal details.',
      },
      attack: {
        ko: '노출된 단서에서 내부 로직·경로를 파악합니다.',
        en: 'Attackers use the exposed clues to map out internal logic and paths.',
      },
      fix: {
        ko: '배포 빌드에서 민감한 주석·디버그 출력을 제거하세요.',
        en: 'Strip sensitive comments and debug output from production builds.',
      },
    },
  },
  {
    keys: ['cross-domain javascript', 'cross-domain script'],
    meta: {
      name: { ko: '외부 도메인 스크립트 포함', en: 'Cross-Domain JavaScript Source File Inclusion' },
      cwe: 'CWE-829',
      plain: {
        ko: '다른 도메인의 자바스크립트를 불러오는데, 그 출처가 뚫리면 우리도 위험해져요.',
        en: "You're loading JavaScript from another domain — if that source is compromised, your site is at risk too.",
      },
      summary: {
        ko: '외부 도메인 JS를 로드해 공급망 위험이 있습니다.',
        en: 'Loading JS from an external domain introduces a supply-chain risk.',
      },
      attack: {
        ko: '외부 스크립트 출처가 변조되면 우리 사이트에서 악성코드가 실행됩니다.',
        en: 'If the external script source is tampered with, malicious code runs on your site.',
      },
      fix: {
        ko: 'SRI(무결성 해시)를 적용하거나 신뢰 출처만 사용하세요.',
        en: 'Apply SRI (Subresource Integrity hashes) or only load scripts from trusted sources.',
      },
    },
  },
  {
    keys: ['anti-csrf', 'csrf token'],
    meta: {
      name: { ko: 'CSRF 토큰 부재', en: 'Missing Anti-CSRF Token' },
      cwe: 'CWE-352',
      plain: {
        ko: '폼에 위조 방지 토큰이 없어서, 사용자가 모르게 요청이 위조될 수 있어요.',
        en: "The form has no anti-forgery token, so requests can be forged without the user's knowledge.",
      },
      summary: {
        ko: 'Anti-CSRF 토큰이 없어 CSRF 공격에 노출됩니다.',
        en: 'The missing anti-CSRF token exposes the form to CSRF attacks.',
      },
      attack: {
        ko: '타 사이트에서 위조한 폼 전송으로 사용자 행위를 가장합니다.',
        en: 'Attackers submit a forged form from another site to impersonate the user\'s actions.',
      },
      fix: {
        ko: '상태 변경 요청에 CSRF 토큰을 추가하고 검증하세요.',
        en: 'Add and validate a CSRF token on every state-changing request.',
      },
    },
  },
  {
    keys: ['cache-control', 'cache control'],
    meta: {
      name: { ko: '캐시 제어 헤더 점검 필요', en: 'Cache-Control Header Needs Review' },
      cwe: 'CWE-525',
      plain: {
        ko: '민감한 페이지가 캐시에 남아 다른 사람이 볼 수 있을지도 몰라요.',
        en: 'A sensitive page may remain in a cache where someone else could view it.',
      },
      summary: {
        ko: 'Cache-Control 설정이 부적절할 수 있습니다.',
        en: 'The Cache-Control configuration may be inadequate.',
      },
      attack: {
        ko: '공유 기기·프록시 캐시에 민감 응답이 남아 노출될 수 있습니다.',
        en: 'Sensitive responses can remain in shared devices or proxy caches and be exposed.',
      },
      fix: {
        ko: '민감 응답에 Cache-Control: no-store 를 설정하세요.',
        en: 'Set Cache-Control: no-store on sensitive responses.',
      },
    },
  },
]

const norm = (s: string) => s.toLowerCase()

export function enrichZap(alertName: string): ZapMeta | null {
  const a = norm(alertName)
  const lang = i18n.language === 'en' ? 'en' : 'ko'
  for (const r of RULES) {
    if (r.keys.some((k) => a.includes(norm(k)))) {
      const m = r.meta
      return {
        name: m.name[lang],
        cwe: m.cwe,
        plain: m.plain[lang],
        summary: m.summary[lang],
        attack: m.attack[lang],
        fix: m.fix[lang],
      }
    }
  }
  return null
}
