const SPREADSHEET_ID = '1TgA_-C9rDPRvgxTnG5cPnWihwC48KZxod-sPeEoMWUc';

const PUBLIC_SHEETS = {
  content: 'CONTENT_DB',
  nav: 'NAV_MODULES',
  market: 'MARKET_TOP3',
  education: 'EDUCATION',
  skills: 'SKILLS',
  equipment: 'EQUIPMENT',
  actionPlan: 'ACTION_PLAN',
  scripts: 'SCRIPTS',
  products: 'PRODUCTS',
  portfolio: 'PORTFOLIO',
  guideCopy: 'GUIDE_COPY',
  photoLessons: 'PHOTO_LESSONS',
  cameraPresets: 'CAMERA_PRESETS',
  sources: 'SOURCES'
};

function doGet(e) {
  if (e && e.parameter && e.parameter.api === 'siteData') {
    return jsonOutput_({ok:true, data:getSiteData()});
  }

  return HtmlService
    .createTemplateFromFile('Index')
    .evaluate()
    .setTitle('사진으로 먹고살기')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1, minimum-scale=1, maximum-scale=1, user-scalable=no, viewport-fit=cover');
}

function doPost(e) {
  try {
    const body = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    const action = String(body.action || '');

    let result;
    if (action === 'requestQuestionLoginCode') {
      result = requestQuestionLoginCode(body.email);
    } else if (action === 'verifyQuestionLoginCode') {
      result = verifyQuestionLoginCode(body.email, body.code);
    } else if (action === 'getQuestionHistory') {
      result = getQuestionHistory(body.token);
    } else if (action === 'saveQuestionHistory') {
      result = saveQuestionHistory(body.token, body.payload || {});
    } else if (action === 'deleteQuestionHistory') {
      result = deleteQuestionHistory(body.token, body.id);
    } else {
      result = {ok:false, message:'지원하지 않는 요청입니다.'};
    }

    return jsonOutput_(result);
  } catch (err) {
    return jsonOutput_({ok:false, message:String(err && err.message ? err.message : err)});
  }
}

function jsonOutput_(data) {
  return ContentService
    .createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function getSiteData() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const raw = {};

  Object.keys(PUBLIC_SHEETS).forEach((key) => {
    raw[key] = sheetToObjects_(ss.getSheetByName(PUBLIC_SHEETS[key]));
  });

  const content = {};
  raw.content.forEach((row) => {
    if (row['키']) content[row['키']] = row['값'] || '';
  });

  const numberOf = (v) => Number(String(v || '').replace(/[^\d.-]/g, '')) || 9999;
  const ordered = (rows) => (rows || []).sort((a, b) => numberOf(a['순서']) - numberOf(b['순서']));

  return {
    content,
    nav: ordered(raw.nav).filter(r => String(r['enabled']).toUpperCase() !== 'FALSE'),
    market: raw.market,
    education: raw.education,
    skills: raw.skills,
    equipment: raw.equipment,
    actionPlan: raw.actionPlan,
    scripts: ordered(raw.scripts),
    products: raw.products,
    portfolio: raw.portfolio,
    guideCopy: ordered(raw.guideCopy),
    photoLessons: ordered(raw.photoLessons),
    cameraPresets: raw.cameraPresets,
    sources: raw.sources
  };
}

function sheetToObjects_(sheet) {
  if (!sheet) return [];
  const values = sheet.getDataRange().getDisplayValues();
  if (!values.length) return [];

  const headers = values[0].map(v => String(v || '').trim());

  return values
    .slice(1)
    .filter(row => row.some(cell => String(cell || '').trim() !== ''))
    .map(row => {
      const obj = {};
      headers.forEach((header, i) => {
        if (header) obj[header] = row[i] ?? '';
      });
      return obj;
    });
}

/* ==========================================================
 * 질문 기록 동기화
 * - OpenAI API를 사용하지 않습니다.
 * - 로그인 없이도 브라우저 localStorage에 질문 기록이 남습니다.
 * - 이메일 로그인은 Google Sheet에 기록을 동기화할 때만 사용합니다.
 *
 * QUESTION_USERS
 * email | enabled | name
 *
 * QUESTION_HISTORY
 * id | email | selected_text | question | created_at | updated_at
 * ========================================================== */

function requestQuestionLoginCode(email) {
  email = normalizeEmail_(email);
  if (!email) return {ok:false, message:'이메일 주소를 확인해 주세요.'};

  ensureQuestionSheets_();

  if (!isAllowedQuestionUser_(email)) {
    return {
      ok:false,
      message:'허용된 이메일이 아닙니다. QUESTION_USERS 시트에 이메일을 추가한 뒤 다시 시도해 주세요.'
    };
  }

  const cache = CacheService.getScriptCache();
  const rateKey = 'qrate:' + hashText_(email);
  if (cache.get(rateKey)) {
    return {ok:false, message:'인증 코드는 1분 뒤 다시 요청할 수 있습니다.'};
  }

  const code = String(Math.floor(100000 + Math.random() * 900000));
  cache.put('qotp:' + hashText_(email), code, 600);
  cache.put(rateKey, '1', 60);

  MailApp.sendEmail({
    to: email,
    subject: '[사진 로드맵] 로그인 인증 코드',
    htmlBody:
      '<div style="font-family:Arial,sans-serif;line-height:1.6">' +
      '<h2 style="margin:0 0 16px">사진 로드맵 로그인</h2>' +
      '<p>인증 코드는 <b style="font-size:24px">' + code + '</b> 입니다.</p>' +
      '<p>10분 안에 입력해 주세요.</p>' +
      '</div>'
  });

  return {ok:true};
}

function verifyQuestionLoginCode(email, code) {
  email = normalizeEmail_(email);
  code = String(code || '').trim();

  if (!email || !/^\d{6}$/.test(code)) {
    return {ok:false, message:'이메일과 6자리 인증 코드를 확인해 주세요.'};
  }

  const cache = CacheService.getScriptCache();
  const otpKey = 'qotp:' + hashText_(email);
  const saved = cache.get(otpKey);

  if (!saved || saved !== code) {
    return {ok:false, message:'인증 코드가 맞지 않거나 만료되었습니다.'};
  }

  cache.remove(otpKey);

  const token = Utilities.getUuid().replace(/-/g,'') + Utilities.getUuid().replace(/-/g,'');
  cache.put('qsess:' + token, email, 21600);

  return {
    ok:true,
    token,
    email,
    history:getQuestionHistoryByEmail_(email)
  };
}

function getQuestionHistory(token) {
  const email = sessionEmail_(token);
  if (!email) return {ok:false, message:'로그인이 만료되었습니다.', history:[]};

  return {
    ok:true,
    email,
    history:getQuestionHistoryByEmail_(email)
  };
}

function saveQuestionHistory(token, payload) {
  const email = sessionEmail_(token);
  if (!email) return {ok:false, message:'로그인이 만료되었습니다.'};

  payload = payload || {};
  const selectedText = String(payload.selectedText || '').trim().slice(0, 5000);
  const question = String(payload.question || '').trim().slice(0, 3000);
  const requestedId = String(payload.id || '').trim().slice(0, 160);

  if (!selectedText || !question) {
    return {ok:false, message:'선택 문장과 질문을 입력해 주세요.'};
  }

  ensureQuestionSheets_();
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('QUESTION_HISTORY');
  const now = Utilities.formatDate(new Date(), 'Asia/Seoul', 'yyyy-MM-dd HH:mm:ss');
  const id = requestedId || Utilities.getUuid();

  let createdAt = now;
  let updated = false;

  if (sheet.getLastRow() >= 2) {
    const values = sheet.getRange(2,1,sheet.getLastRow()-1,6).getDisplayValues();

    for (let i = 0; i < values.length; i++) {
      if (String(values[i][0]) === id && normalizeEmail_(values[i][1]) === email) {
        const row = i + 2;
        createdAt = values[i][4] || now;
        sheet.getRange(row,3,1,4).setValues([[selectedText, question, createdAt, now]]);
        updated = true;
        break;
      }
    }
  }

  if (!updated) {
    sheet.appendRow([id, email, selectedText, question, now, now]);
  }

  return {
    ok:true,
    item:{
      id,
      email,
      selected_text:selectedText,
      question,
      created_at:createdAt,
      updated_at:now
    }
  };
}

function deleteQuestionHistory(token, id) {
  const email = sessionEmail_(token);
  if (!email) return {ok:false, message:'로그인이 만료되었습니다.'};

  id = String(id || '').trim();
  if (!id) return {ok:false, message:'삭제할 질문을 찾지 못했습니다.'};

  ensureQuestionSheets_();

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('QUESTION_HISTORY');

  if (sheet.getLastRow() < 2) return {ok:true};

  const values = sheet.getRange(2,1,sheet.getLastRow()-1,2).getDisplayValues();

  for (let i = values.length - 1; i >= 0; i--) {
    if (
      String(values[i][0]) === id &&
      normalizeEmail_(values[i][1]) === email
    ) {
      sheet.deleteRow(i + 2);
      return {ok:true};
    }
  }

  return {ok:true};
}

function ensureQuestionSheets_() {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);

  let users = ss.getSheetByName('QUESTION_USERS');
  if (!users) {
    users = ss.insertSheet('QUESTION_USERS');
    users.getRange(1,1,1,3).setValues([['email','enabled','name']]);
    users.setFrozenRows(1);
  }

  let history = ss.getSheetByName('QUESTION_HISTORY');
  if (!history) {
    history = ss.insertSheet('QUESTION_HISTORY');
    history.getRange(1,1,1,6).setValues([['id','email','selected_text','question','created_at','updated_at']]);
    history.setFrozenRows(1);
  }
}

function isAllowedQuestionUser_(email) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('QUESTION_USERS');
  if (!sheet || sheet.getLastRow() < 2) return false;

  const rows = sheet.getRange(2,1,sheet.getLastRow()-1,3).getDisplayValues();
  return rows.some(row =>
    normalizeEmail_(row[0]) === email &&
    String(row[1] || '').toUpperCase() !== 'FALSE'
  );
}

function getQuestionHistoryByEmail_(email) {
  ensureQuestionSheets_();
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  const sheet = ss.getSheetByName('QUESTION_HISTORY');
  if (sheet.getLastRow() < 2) return [];

  const values = sheet.getRange(2,1,sheet.getLastRow()-1,6).getDisplayValues();

  return values
    .filter(row => normalizeEmail_(row[1]) === email)
    .slice(-100)
    .reverse()
    .map(row => ({
      id:row[0],
      email:row[1],
      selected_text:row[2],
      question:row[3],
      created_at:row[4],
      updated_at:row[5]
    }));
}

function sessionEmail_(token) {
  token = String(token || '').trim();
  if (!token) return '';
  return normalizeEmail_(
    CacheService.getScriptCache().get('qsess:' + token) || ''
  );
}

function normalizeEmail_(email) {
  email = String(email || '').trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? email : '';
}

function hashText_(text) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(text || ''),
    Utilities.Charset.UTF_8
  );

  return bytes
    .map(b => ('0' + ((b + 256) % 256).toString(16)).slice(-2))
    .join('');
}
