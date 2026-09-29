/*  ScanOps 베타테스터 사용경험 설문 수집
 *  ─ 배포: 확장 프로그램 > Apps Script > 배포 > 새 배포 > 웹 앱
 *          실행 사용자: 나 / 액세스 권한: 모든 사용자
 *  ─ 코드를 바꾼 뒤에는 반드시 "새 배포"를 만들거나 기존 배포를 "수정 > 새 버전"으로 올려야 반영됩니다.
 *
 *  기존 마케팅 설문(리더보드·추천코드·커피 이벤트)용 스크립트에서 COLS만
 *  ScanOps 앱의 실제 문항에 맞게 바꾼 버전입니다. doPost/doGet 로직은 그대로예요.
 */

const COLS = [
  'submittedAt', 'userEmail', 'userName',
  'priorToolUsed', 'priorToolWhat', 'comparisonVsPrior',
  'purpose',
  'role', 'roleOther',
  'reportClarity',
  'falsePositive', 'falsePositiveDetail',
  'continueIntent', 'continueReason',
  'recommendIntent',
  'likedPoints', 'wishFeature',
  'missedVuln', 'missedVulnDetail',
  'scanSpeed',
  'clientId', 'userAgent',
];

/* ---------------- 저장 ---------------- */
function doPost(e) {
  const lock = LockService.getScriptLock();
  lock.waitLock(10000);
  try {
    const data = JSON.parse(e.postData.contents);
    const sh = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
    const header = ensureHeader_(sh);

    const row = header.map(function (c) {
      const v = data[c];
      if (Array.isArray(v)) return v.join(', ');
      return (v === undefined || v === null) ? '' : v;
    });

    // 같은 기기(clientId)가 다시 제출하면 새 행을 쌓지 않고 기존 행을 갱신합니다.
    const idxClient = header.indexOf('clientId');
    const cid = String(data.clientId || '');
    let target = 0;
    if (cid && idxClient >= 0 && sh.getLastRow() > 1) {
      const col = sh.getRange(2, idxClient + 1, sh.getLastRow() - 1, 1).getValues();
      for (let i = 0; i < col.length; i++) {
        if (String(col[i][0]) === cid) { target = i + 2; break; }
      }
    }
    if (target) sh.getRange(target, 1, 1, header.length).setValues([row]);
    else        sh.appendRow(row);

    return json_({ ok: true, updated: !!target });
  } catch (err) {
    return json_({ ok: false, error: String(err) });
  } finally {
    lock.releaseLock();
  }
}

/* ---------------- 유틸 ---------------- */
function ensureHeader_(sh) {
  if (sh.getLastRow() === 0) {
    sh.appendRow(COLS);
    sh.setFrozenRows(1);
    return COLS.slice();
  }
  let header = sh.getRange(1, 1, 1, sh.getLastColumn()).getValues()[0]
                 .map(function (v) { return String(v || ''); });
  while (header.length && header[header.length - 1] === '') header.pop();

  const missing = COLS.filter(function (c) { return header.indexOf(c) === -1; });
  if (missing.length) {
    sh.getRange(1, header.length + 1, 1, missing.length).setValues([missing]);
    header = header.concat(missing);
  }
  return header;
}

function json_(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}
