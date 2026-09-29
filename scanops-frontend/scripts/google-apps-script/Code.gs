/**
 * ScanOps 오류 신고 위젯 → Google Sheets 저장용 Apps Script.
 *
 * 배포 방법:
 * 1. 대상 Google Sheet 열기 → 확장 프로그램 → Apps Script
 *    (script.google.com에서 새 프로젝트로 직접 만들면 "독립형" 프로젝트가 되어
 *    SpreadsheetApp.getActiveSpreadsheet()가 null을 반환한다 — 그래서 아래처럼
 *    시트 ID로 직접 여는 방식을 쓴다. 독립형 프로젝트로 만들었어도 이 코드는 그대로 동작한다.)
 * 2. 기본 Code.gs 내용을 지우고 이 파일 내용을 붙여넣기 → 저장
 * 3. 배포 → 새 배포 → 유형: 웹 앱
 *    - 실행 계정: 나
 *    - 액세스 권한이 있는 사용자: 모든 사용자
 * 4. 배포 후 나오는 웹 앱 URL을 복사
 * 5. scanops-frontend의 .env(또는 Vercel 환경변수)에 아래처럼 설정
 *      VITE_FEEDBACK_WEBAPP_URL=<복사한 URL>
 *
 * 참고: 프론트엔드는 CORS preflight를 피하려고 Content-Type을 text/plain으로
 * 보낸다. 그래서 실제 헤더와 무관하게 본문을 JSON으로 파싱한다.
 */
var SHEET_ID = '1pPI3VMLJQCdrej27x7wxvMvWiv3Vu1_g8OzVR_HLmWs';

function doPost(e) {
  var ss = SpreadsheetApp.openById(SHEET_ID);
  var sheet = ss.getSheetByName('신고내역') || ss.getActiveSheet();

  var data = {};
  try {
    data = JSON.parse(e.postData.contents);
  } catch (err) {
    data = {};
  }

  sheet.appendRow([
    new Date(),
    data.message || '',
    data.page || '',
    data.userEmail || '',
    data.userName || '',
    data.userAgent || '',
  ]);

  return ContentService
    .createTextOutput(JSON.stringify({ ok: true }))
    .setMimeType(ContentService.MimeType.JSON);
}
