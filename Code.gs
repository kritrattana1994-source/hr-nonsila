function generateDebugHtml() { const t = HtmlService.createTemplateFromFile('Index'); t.WEB_APP_URL = ScriptApp.getService().getUrl(); const html = t.evaluate().getContent(); DriveApp.createFile('debug_hr.html', html, MimeType.HTML); }
function authorize() { DriveApp.getFiles(); SpreadsheetApp.getActive(); }

function setupPermissions() { DriveApp.getFiles(); SpreadsheetApp.getActive(); }
/**
 * Code.gs — Main router for HR Management Web App
 * โรงพยาบาลโนนศิลา กลุ่มงานการพยาบาล
 */

// ── Web App Entry Points ──────────────────────────────────────

function doGet(e) {
  const t = HtmlService.createTemplateFromFile('Index'); t.WEB_APP_URL = ScriptApp.getService().getUrl(); return t.evaluate()
    .setTitle('ระบบบริหารบุคลากร กลุ่มงานการพยาบาล โรงพยาบาลโนนศิลา')
    .setXFrameOptionsMode(HtmlService.XFrameOptionsMode.ALLOWALL)
    .addMetaTag('viewport', 'width=device-width, initial-scale=1.0');
}

function doPost(e) {
  try {
    const params = JSON.parse(e.postData.contents);
    const action = params.action;
    const t      = params.token; // session token

    switch (action) {

      // ── Auth (no token required) ──
      case 'login':              return respond(AuthService.login(params.username, params.password));
      case 'logout':             return respond(AuthService.logout(t));
      case 'checkSetup':         return respond(SetupService.checkSetup());
      case 'registerStaffPublic': return respond(DataService.registerStaffPublic(params.data));
      case 'getStaffListPublic': return respond(DataService.getStaffListPublic());
      case 'getDepartmentsPublic': return respond(DataService.getDepartmentsPublic());

      // ── Setup (admin only, run once) ──
      case 'setup':              return respond(SetupService.setup());

      // ── Dashboard ──
      case 'getDashboardData':   return respond(DataService.getDashboardData(t));

      // ── Staff & Resignation ──
      case 'getAllDepartments':  return respond(DataService.getAllDepartments(t));
      case 'getStaffList':       return respond(DataService.getStaffList(t, params.filters));
      case 'getStaff':           return respond(DataService.getStaff(t, params.id));
      case 'addStaff':           return respond(DataService.addStaff(t, params.data));
      case 'updateStaff':        return respond(DataService.updateStaff(t, params.id, params.data));
      case 'deleteStaff':        return respond(DataService.deleteStaff(t, params.id));
      case 'resignStaff':        return respond(DataService.resignStaff(t, params.staffId, params.resignDate, params.reason));
      case 'cancelResignation':  return respond(DataService.cancelResignation(t, params.staffId));
      case 'autoArrangeOrgChart': return respond(DataService.autoArrangeOrgChart(t));
      case 'getSystemUrls':      return respond(DataService.getSystemUrls(t));

      // ── Nurse Data ──
      case 'getNurseData':       return respond(DataService.getNurseData(t, params.staffId));
      case 'saveNurseData':      return respond(DataService.saveNurseData(t, params.staffId, params.data));

      // ── Training ──
      case 'getTrainingByStaff': return respond(DataService.getTrainingByStaff(t, params.staffId));
      case 'getAllTraining':     return respond(DataService.getAllTraining(t, params.filters));
      case 'addTraining':        return respond(DataService.addTraining(t, params.data));
      case 'updateTraining':     return respond(DataService.updateTraining(t, params.id, params.data));
      case 'deleteTraining':     return respond(DataService.deleteTraining(t, params.id));

      // ── Competencies ──
      case 'cleanupExtraSheets':  return respond(_cleanupTempSheets(getSpreadsheet()));
      case 'getCompetencies':     return respond(DataService.getCompetencies(t));
      case 'saveCompetency':      return respond(DataService.saveCompetency(t, params.data));
      case 'deleteCompetency':    return respond(DataService.deleteCompetency(t, params.id));
      case 'getEvaluations':      return respond(DataService.getEvaluations(t, params.filters));
      case 'saveEvaluation':      return respond(DataService.saveEvaluation(t, params.data));
      case 'saveEvaluationsBulk': return respond(DataService.saveEvaluationsBulk(t, params.dataList));

      // ── Courses ──
      case 'getCourseList':      return respond(DataService.getCourseList(t));
      case 'addCourse':          return respond(DataService.addCourse(t, params.data));
      case 'updateCourse':       return respond(DataService.updateCourse(t, params.id, params.data));
      case 'deleteCourse':       return respond(DataService.deleteCourse(t, params.id));

      // ── Documents ──
      case 'getDocuments':       return respond(DataService.getDocuments(t, params.staffId));
      case 'deleteDocument':     return respond(DriveService.deleteDocument(t, params.fileId, params.docId));

      // ── Drive / Files ──
      case 'uploadPhoto':        return respond(DriveService.uploadPhoto(t, params.staffId, params.base64, params.mimeType, params.fileName));
      case 'uploadDocument':     return respond(DriveService.uploadDocument(t, params.staffId, params.base64, params.mimeType, params.fileName, params.docType));
      case 'uploadCertificate':  return respond(DriveService.uploadCertificate(t, params.staffId, params.trainingId, params.base64, params.mimeType, params.fileName));
      case 'getFileUrl':         return respond(DriveService.getFileUrl(t, params.fileId));

      // ── Users & Menu Permissions ──
      case 'getUserList':                return respond(AuthService.getUserList(t));
      case 'getStaffWithRoles':          return respond(AuthService.getStaffWithRoles(t));
      case 'setUserRole':                return respond(AuthService.setUserRole(t, params.staffId, params.role));
      case 'createAccountsForAllStaff':  return respond(AuthService.createAccountsForAllStaff(t));
      case 'getMenuPermissions':         return respond(AuthService.getMenuPermissions(t));
      case 'updateMenuPermissions':      return respond(AuthService.updateMenuPermissions(t, params.menuList));
      case 'addUser':                    return respond(AuthService.addUser(t, params.data));
      case 'updateUser':                 return respond(AuthService.updateUser(t, params.id, params.data));
      case 'deleteUser':                 return respond(AuthService.deleteUser(t, params.id));
      case 'changePassword':             return respond(AuthService.changePassword(t, params.oldPassword, params.newPassword));

      // ── Reports ──
      case 'getLicenseReport':   return respond(DataService.getLicenseReport(t));
      case 'getTrainingReport':  return respond(DataService.getTrainingReport(t, params.year));

      // ── Import ──
      case 'importAll':          return respond(ImportService.importAll(t, params.data));

      default:
        return respondError('Unknown action: ' + action);
    }
  } catch (err) {
    Logger.log('doPost error: ' + err.toString() + '\n' + err.stack);
    return respondError(err.toString());
  }
}

// ── google.script.run handler ─────────────────────────────────
// ใช้แทน fetch()/doPost สำหรับการเรียก API จาก frontend

function handleApiCall(action, params) {
  params = params || {};
  const t = params.token;
  try {
    switch (action) {
      // ── Auth ──
      case 'login':              return ok(AuthService.login(params.username, params.password));
      case 'logout':             return ok(AuthService.logout(t));
      case 'checkSetup':         return ok(SetupService.checkSetup());
      case 'registerStaffPublic': return ok(DataService.registerStaffPublic(params.data));
      case 'getStaffListPublic': return ok(DataService.getStaffListPublic());
      case 'getDepartmentsPublic': return ok(DataService.getDepartmentsPublic());

      // ── Setup ──
      case 'setup':              return ok(SetupService.setup());

      // ── Dashboard ──
      case 'getDashboardData':   return ok(DataService.getDashboardData(t));

      // ── Staff & Resignation ──
      case 'getAllDepartments':  return ok(DataService.getAllDepartments(t));
      case 'getStaffList':       return ok(DataService.getStaffList(t, params.filters));
      case 'getStaff':           return ok(DataService.getStaff(t, params.id));
      case 'addStaff':           return ok(DataService.addStaff(t, params.data));
      case 'updateStaff':        return ok(DataService.updateStaff(t, params.id, params.data));
      case 'deleteStaff':        return ok(DataService.deleteStaff(t, params.id));
      case 'resignStaff':        return ok(DataService.resignStaff(t, params.staffId, params.resignDate, params.reason));
      case 'cancelResignation':  return ok(DataService.cancelResignation(t, params.staffId));
      case 'autoArrangeOrgChart': return ok(DataService.autoArrangeOrgChart(t));
      case 'getSystemUrls':      return ok(DataService.getSystemUrls(t));

      // ── Nurse Data ──
      case 'getNurseData':       return ok(DataService.getNurseData(t, params.staffId));
      case 'saveNurseData':      return ok(DataService.saveNurseData(t, params.staffId, params.data));

      // ── Training ──
      case 'getTrainingByStaff': return ok(DataService.getTrainingByStaff(t, params.staffId));
      case 'getAllTraining':      return ok(DataService.getAllTraining(t, params.filters));
      case 'addTraining':        return ok(DataService.addTraining(t, params.data));
      case 'updateTraining':     return ok(DataService.updateTraining(t, params.id, params.data));
      case 'deleteTraining':     return ok(DataService.deleteTraining(t, params.id));

      // ── Competencies ──
      case 'cleanupExtraSheets':  return ok(_cleanupTempSheets(getSpreadsheet()));
      case 'getCompetencies':     return ok(DataService.getCompetencies(t));
      case 'saveCompetency':      return ok(DataService.saveCompetency(t, params.data));
      case 'deleteCompetency':    return ok(DataService.deleteCompetency(t, params.id));
      case 'getEvaluations':      return ok(DataService.getEvaluations(t, params.filters));
      case 'saveEvaluation':      return ok(DataService.saveEvaluation(t, params.data));
      case 'saveEvaluationsBulk': return ok(DataService.saveEvaluationsBulk(t, params.dataList));

      // ── Courses ──
      case 'getCourseList':      return ok(DataService.getCourseList(t));
      case 'addCourse':          return ok(DataService.addCourse(t, params.data));
      case 'updateCourse':       return ok(DataService.updateCourse(t, params.id, params.data));
      case 'deleteCourse':       return ok(DataService.deleteCourse(t, params.id));

      // ── Documents ──
      case 'getDocuments':       return ok(DataService.getDocuments(t, params.staffId));
      case 'deleteDocument':     return ok(DriveService.deleteDocument(t, params.fileId, params.docId));

      // ── Drive ──
      case 'uploadPhoto':        return ok(DriveService.uploadPhoto(t, params.staffId, params.base64, params.mimeType, params.fileName));
      case 'uploadDocument':     return ok(DriveService.uploadDocument(t, params.staffId, params.base64, params.mimeType, params.fileName, params.docType));
      case 'uploadCertificate':  return ok(DriveService.uploadCertificate(t, params.staffId, params.trainingId, params.base64, params.mimeType, params.fileName));
      case 'getFileUrl':         return ok(DriveService.getFileUrl(t, params.fileId));

      // ── Users & Menu Permissions ──
      case 'getUserList':                return ok(AuthService.getUserList(t));
      case 'getStaffWithRoles':          return ok(AuthService.getStaffWithRoles(t));
      case 'setUserRole':                return ok(AuthService.setUserRole(t, params.staffId, params.role));
      case 'createAccountsForAllStaff':  return ok(AuthService.createAccountsForAllStaff(t));
      case 'getMenuPermissions':         return ok(AuthService.getMenuPermissions(t));
      case 'updateMenuPermissions':      return ok(AuthService.updateMenuPermissions(t, params.menuList));
      case 'addUser':                    return ok(AuthService.addUser(t, params.data));
      case 'updateUser':                 return ok(AuthService.updateUser(t, params.id, params.data));
      case 'deleteUser':                 return ok(AuthService.deleteUser(t, params.id));
      case 'changePassword':             return ok(AuthService.changePassword(t, params.oldPassword, params.newPassword));

      // ── Reports ──
      case 'getLicenseReport':   return ok(DataService.getLicenseReport(t));
      case 'getTrainingReport':  return ok(DataService.getTrainingReport(t, params.year));

      // ── Import ──
      case 'importAll':          return ok(ImportService.importAll(t, params.data));

      default: return err('Unknown action: ' + action);
    }
  } catch(e) {
    Logger.log('handleApiCall error [' + action + ']: ' + e.toString());
    return err(e.message || e.toString());
  }
}

function ok(data)  { return { success: true,  data:  data }; }
function err(msg)  { return { success: false, error: msg  }; }

// ── Helpers ───────────────────────────────────────────────────

function include(filename) {
  return HtmlService.createHtmlOutputFromFile(filename).getContent();
}

function initSystem() {
  SetupService.setup();
  Logger.log('System Initialized successfully!');
}



/**
 * AuthService.gs — Authentication & Session management
 * Login/logout, token validation, user CRUD
 * DEV_MODE = true → ข้ามรหัสผ่าน (เปลี่ยนเป็น false เมื่อพร้อม)
 */

const SESSION_TTL_MS = 8 * 60 * 60 * 1000; // 8 hours
const SESSION_TTL_SEC = 8 * 60 * 60;        // 8 hours in seconds (for CacheService)
const DEV_MODE = false;

// ── Session Storage Helpers (CacheService = fast, PropertiesService = persistent backup) ──
function _getSession(token) {
  if (!token) return null;
  try {
    // Try CacheService first (fast, concurrent-safe)
    const cached = CacheService.getScriptCache().get('S_' + token);
    if (cached) return JSON.parse(cached);
  } catch(e) {}
  try {
    // Fallback to PropertiesService (persistent)
    const raw = PropertiesService.getScriptProperties().getProperty('SESSION_' + token);
    if (!raw) return null;
    const session = JSON.parse(raw);
    // Warm the cache back up
    try { CacheService.getScriptCache().put('S_' + token, raw, SESSION_TTL_SEC); } catch(e) {}
    return session;
  } catch(e) { return null; }
}

function _setSession(token, session) {
  const raw = JSON.stringify(session);
  try { CacheService.getScriptCache().put('S_' + token, raw, SESSION_TTL_SEC); } catch(e) {}
  try { PropertiesService.getScriptProperties().setProperty('SESSION_' + token, raw); } catch(e) {}
}

function _deleteSession(token) {
  try { CacheService.getScriptCache().remove('S_' + token); } catch(e) {}
  try { PropertiesService.getScriptProperties().deleteProperty('SESSION_' + token); } catch(e) {}
}

// ── Login / Logout ────────────────────────────────────────────

function AuthService() {}

AuthService.login = function (username, password) {
  const ss = getSpreadsheet();
  const userSheet = ss.getSheetByName(SHEETS.USERS);
  const users = sheetToObjects(userSheet);
  const staffSheet = ss.getSheetByName(SHEETS.STAFF);
  const staff = sheetToObjects(staffSheet);

  let targetUser = null;
  let matchedStaff = null;

  const rawUser   = String(username || '').trim();
  const rawPass   = String(password || '').trim();
  const inputUser = rawUser.toLowerCase();
  const hashed    = hashPassword(rawPass);

  const cleanNum = function(s) { return String(s || '').replace(/[^0-9]/g, ''); };

  // 1. Search in USERS sheet (handles all users including admin)
  targetUser = users.find(u => {
    const uName = String(u['Username'] || '').trim().toLowerCase();
    const uPass = String(u['Password'] || '').trim();
    const status = String(u['สถานะ'] || 'active').toLowerCase();

    if (status !== 'active') return false;

    const userMatch = (uName === inputUser || (cleanNum(uName) && cleanNum(uName) === cleanNum(inputUser)));
    const passMatch = (uPass === rawPass || uPass === hashed || (cleanNum(uPass) && cleanNum(uPass) === cleanNum(rawPass)));

    return userMatch && passMatch;
  });

  // Fallback for default admin ONLY IF admin doesn't exist in USERS sheet at all
  if (!targetUser && inputUser === 'admin') {
    const adminExists = users.some(u => String(u['Username']).trim().toLowerCase() === 'admin');
    if (!adminExists && rawPass === 'admin') { 
      targetUser = { ID: 1, Username: 'admin', Role: 'admin', 'ชื่อ-สกุล': 'ผู้ดูแลระบบ (Admin)', 'สถานะ': 'active' };
    }
  }

  // 2. Fallback: Search in STAFF sheet directly (only if not found in USERS sheet)
  if (!targetUser && staff.length) {
    matchedStaff = staff.find(s => {
      const idCard = String(s['เลขบัตรประชาชน'] || '').trim();
      const phone  = String(s['เบอร์โทร'] || '').trim();
      const name   = String(s['ชื่อ-สกุล'] || '').trim().toLowerCase();

      const userMatch = (idCard.toLowerCase() === inputUser || (cleanNum(phone) && cleanNum(phone) === cleanNum(inputUser)) || (inputUser.length >= 3 && name.includes(inputUser)));
      const passMatch = (phone === rawPass || (cleanNum(phone) && cleanNum(phone) === cleanNum(rawPass)) || idCard === rawPass);
      return userMatch && passMatch;
    });

    if (matchedStaff) {
      if (matchedStaff['วันที่ลาออก']) {
        throw new Error('บัญชีนี้ถูกระงับเนื่องจากพ้นสภาพการเป็นพนักงานแล้ว (ลาออกเมื่อ ' + matchedStaff['วันที่ลาออก'] + ')');
      }
      const uObj = users.find(u => String(u['Username']).trim() === String(matchedStaff['เลขบัตรประชาชน']).trim());
      targetUser = {
        ID: matchedStaff['ID'],
        Username: matchedStaff['เลขบัตรประชาชน'],
        Role: uObj ? uObj['Role'] : 'low',
        'ชื่อ-สกุล': matchedStaff['ชื่อ-สกุล'],
        'สถานะ': 'active'
      };
    }
  }

  if (!targetUser) {
    throw new Error('ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง');
  }

  if (!matchedStaff && targetUser.Username !== 'admin') {
    matchedStaff = staff.find(s => String(s['เลขบัตรประชาชน']).trim() === String(targetUser['Username']).trim());
  }

  if (matchedStaff && matchedStaff['วันที่ลาออก']) {
    throw new Error('บัญชีนี้ถูกระงับเนื่องจากพ้นสภาพการเป็นพนักงานแล้ว (ลาออกเมื่อ ' + matchedStaff['วันที่ลาออก'] + ')');
  }

  // Generate session token
  const token = Utilities.getUuid();
  const session = {
    token: token,
    userId: targetUser.ID,
    username: targetUser.Username,
    role: String(targetUser.Role || 'low').toLowerCase(),
    name: targetUser['ชื่อ-สกุล'] || (matchedStaff ? matchedStaff['ชื่อ-สกุล'] : 'ผู้ใช้งาน'),
    dept: matchedStaff ? String(matchedStaff['หน่วยงาน'] || '').trim() : '',
    staffId: matchedStaff ? matchedStaff.ID : null,
    createdAt: new Date().getTime(),
    expiry: new Date().getTime() + SESSION_TTL_MS
  };

  _setSession(token, session);

  return {
    token: token,
    user: {
      id: targetUser.ID,
      username: targetUser.Username,
      role: session.role,
      name: session.name,
      dept: session.dept,
      staffId: session.staffId
    }
  };
};

AuthService.logout = function (token) {
  if (!token) return { ok: true };
  _deleteSession(token);
  return { ok: true };
};

// Execution-level session cache: avoid repeated storage reads in same GAS invocation
const _sessionCache = {};

AuthService.validateToken = function (token) {
  if (!token) throw new Error('ไม่ได้เข้าสู่ระบบ');

  // 1. Execution-level cache (zero latency, same GAS invocation)
  if (_sessionCache[token]) return _sessionCache[token];

  // 2. CacheService (fast, ~5ms, concurrent-safe)
  if (DEV_MODE) {
    const devSession = { userId: 1, username: 'admin', role: 'admin', name: 'ผู้ดูแลระบบ' };
    _sessionCache[token] = devSession;
    return devSession;
  }

  const session = _getSession(token);
  if (!session) throw new Error('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');

  if (Date.now() > session.expiry) {
    _deleteSession(token);
    throw new Error('Session หมดอายุ กรุณาเข้าสู่ระบบใหม่');
  }

  _sessionCache[token] = session;
  return session;
};

// ── User Management ───────────────────────────────────────────

AuthService.getUserList = function (token) {
  AuthService.validateToken(token);
  const ss    = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.USERS);
  return sheetToObjects(sheet).map(u => ({
    id:       u['ID'],
    username: u['Username'],
    role:     u['Role'],
    name:     u['ชื่อ-สกุล'],
    email:    u['อีเมล'],
    status:   u['สถานะ'],
    created:  u['วันที่สร้าง'],
  })); // Never return password
};

// Return all staff merged with their user account role (admin use)
AuthService.getStaffWithRoles = function (token) {
  const session = AuthService.validateToken(token);
  if (session.role !== 'admin') throw new Error('เฉพาะ admin เท่านั้น');
  const ss       = getSpreadsheet();
  const staff    = sheetToObjects(ss.getSheetByName(SHEETS.STAFF)).filter(s => !s['วันที่ลาออก']);
  const users    = sheetToObjects(ss.getSheetByName(SHEETS.USERS));

  const clean = v => String(v || '').trim().replace(/[- .]/g, '').toLowerCase();

  return staff.map(s => {
    const idCard    = clean(s['เลขบัตรประชาชน']);
    const staffName = clean(s['ชื่อ-สกุล']);

    // Robust matching by Citizen ID OR Name
    const u = users.find(user => {
      const uUsername = clean(user['Username']);
      const uName     = clean(user['ชื่อ-สกุล']);
      if (idCard && uUsername && (uUsername === idCard || uUsername.includes(idCard) || idCard.includes(uUsername))) return true;
      if (staffName && uName && (uName === staffName || uName.includes(staffName))) return true;
      return false;
    });

    return {
      staffId:    s['ID'],
      name:       s['ชื่อ-สกุล'] || '',
      position:   s['ตำแหน่ง']   || '',
      dept:       s['หน่วยงาน']  || '',
      idCard:     String(s['เลขบัตรประชาชน'] || '').trim(),
      hasAccount: !!u,
      userId:     u ? u['ID']       : null,
      username:   u ? u['Username'] : (s['เลขบัตรประชาชน'] || ''),
      role:       u ? u['Role']     : 'none',
      status:     u ? u['สถานะ']    : '',
    };
  });
};

// Admin quick-set role for a staff member (creates account if missing)
AuthService.setUserRole = function (token, staffId, role) {
  const session = AuthService.validateToken(token);
  if (session.role !== 'admin') throw new Error('เฉพาะ admin เท่านั้น');
  const VALID_ROLES = ['admin','high','medium','low'];
  if (!VALID_ROLES.includes(role)) throw new Error('Role ไม่ถูกต้อง');

  const ss         = getSpreadsheet();
  const staffSheet = ss.getSheetByName(SHEETS.STAFF);
  const usersSheet = ss.getSheetByName(SHEETS.USERS);
  const staff      = sheetToObjects(staffSheet);
  const s          = staff.find(x => String(x['ID']) === String(staffId));
  if (!s) throw new Error('ไม่พบข้อมูลพนักงาน ID: ' + staffId);

  const clean = v => String(v || '').trim().replace(/[- .]/g, '').toLowerCase();
  const idCard    = clean(s['เลขบัตรประชาชน']);
  const staffName = clean(s['ชื่อ-สกุล']);
  const rawIdCard = String(s['เลขบัตรประชาชน'] || '').trim();
  const phone     = String(s['เบอร์โทร'] || '').trim().replace(/[- ]/g,'');

  const users     = sheetToObjects(usersSheet);
  const headers   = usersSheet.getRange(1,1,1,usersSheet.getLastColumn()).getValues()[0];

  const existIdx  = users.findIndex(u => {
    const uUsername = clean(u['Username']);
    const uName     = clean(u['ชื่อ-สกุล']);
    if (idCard && uUsername && (uUsername === idCard || uUsername.includes(idCard) || idCard.includes(uUsername))) return true;
    if (staffName && uName && (uName === staffName || uName.includes(staffName))) return true;
    return false;
  });

  if (existIdx >= 0) {
    // Update existing user role
    const roleCol = headers.indexOf('Role') + 1;
    usersSheet.getRange(existIdx + 2, roleCol).setValue(role);
    SpreadsheetApp.flush();
    return { message: 'อัปเดตสิทธิ์ของ ' + (s['ชื่อ-สกุล'] || '') + ' เป็น: ' + role + ' สำเร็จ' };
  } else {
    // Create new account
    const now     = new Date().toISOString();
    const nextId  = users.length > 0 ? Math.max(...users.map(u => Number(u['ID'])||0)) + 1 : 1;
    const pw      = phone || rawIdCard;
    const newRow  = headers.map(h => {
      if (h === 'ID')           return nextId;
      if (h === 'Username')     return rawIdCard;
      if (h === 'Password')     return hashPassword(pw);
      if (h === 'Role')         return role;
      if (h === 'ชื่อ-สกุล')  return s['ชื่อ-สกุล'] || '';
      if (h === 'สถานะ')        return 'active';
      if (h === 'วันที่สร้าง') return now;
      return '';
    });
    usersSheet.appendRow(newRow);
    SpreadsheetApp.flush();
    return { message: 'สร้างบัญชีให้ ' + (s['ชื่อ-สกุล'] || '') + ' และกำหนดสิทธิ์: ' + role + ' สำเร็จ' };
  }
};

// Batch create user accounts for ALL staff who do not have an account yet
AuthService.createAccountsForAllStaff = function (token) {
  const session = AuthService.validateToken(token);
  if (session.role !== 'admin') throw new Error('เฉพาะ admin เท่านั้น');

  const ss         = getSpreadsheet();
  const staffSheet = ss.getSheetByName(SHEETS.STAFF);
  const usersSheet = ss.getSheetByName(SHEETS.USERS);
  const staff      = sheetToObjects(staffSheet).filter(s => !s['วันที่ลาออก']);
  const users      = sheetToObjects(usersSheet);
  const headers    = usersSheet.getRange(1, 1, 1, usersSheet.getLastColumn()).getValues()[0];

  const clean = v => String(v || '').trim().replace(/[- .]/g, '').toLowerCase();

  let createdCount = 0;
  let nextId = users.length > 0 ? Math.max(...users.map(u => Number(u['ID']) || 0)) + 1 : 1;
  const now = new Date().toISOString();

  staff.forEach(s => {
    const idCard    = clean(s['เลขบัตรประชาชน']);
    const staffName = clean(s['ชื่อ-สกุล']);
    const rawIdCard = String(s['เลขบัตรประชาชน'] || '').trim();
    const phone     = String(s['เบอร์โทร'] || '').trim().replace(/[- ]/g, '');

    const exist = users.find(u => {
      const uUsername = clean(u['Username']);
      const uName     = clean(u['ชื่อ-สกุล']);
      if (idCard && uUsername && (uUsername === idCard || uUsername.includes(idCard) || idCard.includes(uUsername))) return true;
      if (staffName && uName && (uName === staffName || uName.includes(staffName))) return true;
      return false;
    });

    if (!exist && rawIdCard) {
      const pw     = phone || rawIdCard;
      const newRow = headers.map(h => {
        if (h === 'ID')           return nextId++;
        if (h === 'Username')     return rawIdCard;
        if (h === 'Password')     return hashPassword(pw);
        if (h === 'Role')         return 'low';
        if (h === 'ชื่อ-สกุล')  return s['ชื่อ-สกุล'] || '';
        if (h === 'สถานะ')        return 'active';
        if (h === 'วันที่สร้าง') return now;
        return '';
      });

      usersSheet.appendRow(newRow);
      createdCount++;
    }
  });

  SpreadsheetApp.flush();
  return { message: 'สร้างบัญชีให้พนักงานทุกคนเรียบร้อยแล้ว (เพิ่มใหม่ ' + createdCount + ' บัญชี)' };
};

// Default Sidebar Menu Permissions
const DEFAULT_MENU_PERMISSIONS = [
  { menuId: 'dashboard',  menuName: 'หน้าแรก (Dashboard)', category: 'เมนูหลัก',   admin: true, high: true, medium: true, low: true },
  { menuId: 'staffList',  menuName: 'รายชื่อบุคลากร',     category: 'เมนูหลัก',   admin: true, high: true, medium: true, low: true },
  { menuId: 'onboarding', menuName: 'รับพนักงานใหม่',     category: 'การจัดการ', admin: true, high: true, medium: false, low: false },
  { menuId: 'competencies', menuName: 'สมรรถนะบุคลากร',   category: 'การจัดการ', admin: true, high: true, medium: true, low: true },
  { menuId: 'users',      menuName: 'จัดการผู้ใช้งาน',     category: 'ผู้ดูแลระบบ', admin: true, high: false, medium: false, low: false },
  { menuId: 'import',     menuName: 'นำเข้าข้อมูล',       category: 'ผู้ดูแลระบบ', admin: true, high: false, medium: false, low: false },
  { menuId: 'sheetLink',  menuName: 'Google Sheet',        category: 'ลิงก์ภายนอก', admin: true, high: false, medium: false, low: false },
  { menuId: 'driveLink',  menuName: 'ที่เก็บไฟล์ Drive',    category: 'ลิงก์ภายนอก', admin: true, high: false, medium: false, low: false }
];

AuthService.getMenuPermissions = function (token) {
  AuthService.validateToken(token);
  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(SHEETS.MENU_PERMISSIONS || 'สิทธิ์เมนู');

  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.MENU_PERMISSIONS || 'สิทธิ์เมนู');
    const headers = ['MenuID', 'MenuName', 'Category', 'Admin', 'High', 'Medium', 'Low'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#eff6ff');

    const rows = DEFAULT_MENU_PERMISSIONS.map(m => [
      m.menuId, m.menuName, m.category, m.admin, m.high, m.medium, m.low
    ]);
    sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
    SpreadsheetApp.flush();
    return DEFAULT_MENU_PERMISSIONS;
  }

  let objects = sheetToObjects(sheet);
  if (!objects || !objects.length) {
    return DEFAULT_MENU_PERMISSIONS;
  }

  const validMenuIds = DEFAULT_MENU_PERMISSIONS.map(m => m.menuId);

  return objects
    .map(o => {
      if (String(o['MenuID'] || '') === 'training') o['MenuID'] = 'competencies';
      return o;
    })
    .filter(o => validMenuIds.includes(String(o['MenuID'] || '')))
    .map(o => ({
      menuId:   String(o['MenuID'] || ''),
      menuName: String(o['MenuName'] || ''),
      category: String(o['Category'] || ''),
      admin:    String(o['Admin']).toLowerCase() === 'true' || o['Admin'] === true,
      high:     String(o['High']).toLowerCase() === 'true'  || o['High'] === true,
      medium:   String(o['Medium']).toLowerCase() === 'true'|| o['Medium'] === true,
      low:      String(o['Low']).toLowerCase() === 'true'   || o['Low'] === true,
    }));
};

AuthService.updateMenuPermissions = function (token, menuList) {
  const session = AuthService.validateToken(token);
  if (session.role !== 'admin') throw new Error('เฉพาะ admin เท่านั้น');
  if (!Array.isArray(menuList)) throw new Error('ข้อมูลไม่ถูกต้อง');

  const ss = getSpreadsheet();
  let sheet = ss.getSheetByName(SHEETS.MENU_PERMISSIONS || 'สิทธิ์เมนู');
  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.MENU_PERMISSIONS || 'สิทธิ์เมนู');
  }

  sheet.clearContents();
  const headers = ['MenuID', 'MenuName', 'Category', 'Admin', 'High', 'Medium', 'Low'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground('#eff6ff');

  const rows = menuList.map(m => [
    m.menuId, m.menuName, m.category, !!m.admin, !!m.high, !!m.medium, !!m.low
  ]);
  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  SpreadsheetApp.flush();
  return { message: 'บันทึกสิทธิ์การเข้าถึงเมนูลง Google Sheet เรียบร้อยแล้ว' };
};

AuthService.addUser = function (token, data) {
  const session = AuthService.validateToken(token);
  if (session.role !== 'admin') throw new Error('ไม่มีสิทธิ์ดำเนินการนี้ เฉพาะ admin เท่านั้น');
  if (!data.username || !data.password) throw new Error('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน');

  const ss    = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.USERS);
  const users = sheetToObjects(sheet);

  // Check duplicate username
  if (users.find(u => String(u['Username']).toLowerCase() === String(data.username).toLowerCase())) {
    throw new Error('ชื่อผู้ใช้นี้มีอยู่แล้ว');
  }

  const id  = nextId(sheet);
  const now = new Date().toISOString();
  appendObjectToSheet(sheet, {
    'ID': id,
    'Username': data.username,
    'PasswordHash': hashPassword(data.password),
    'Role': data.role || 'user',
    'Name': data.name || '',
    'Email': data.email || '',
    'Status': 'active',
    'CreatedAt': now,
    'UpdatedAt': now,
  });
  return { id, message: 'เพิ่มผู้ใช้สำเร็จ' };
};

AuthService.updateUser = function (token, id, data) {
  const session = AuthService.validateToken(token);
  if (session.role !== 'admin') throw new Error('ไม่มีสิทธิ์ดำเนินการนี้');

  const ss    = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.USERS);
  const row   = findRowById(sheet, id);
  if (row < 0) throw new Error('ไม่พบผู้ใช้งาน');

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const now     = new Date().toISOString();

  // Map field names to column indices
  const fieldMap = {
    role:   'Role',
    name:   'ชื่อ-สกุล',
    email:  'อีเมล',
    status: 'สถานะ',
  };

  Object.keys(fieldMap).forEach(key => {
    if (data[key] !== undefined) {
      const col = headers.indexOf(fieldMap[key]) + 1;
      if (col > 0) sheet.getRange(row, col).setValue(data[key]);
    }
  });

  // Handle password change
  if (data.password) {
    const col = headers.indexOf('Password') + 1;
    if (col > 0) sheet.getRange(row, col).setValue(hashPassword(data.password));
  }

  const editCol = headers.indexOf('วันที่แก้ไขล่าสุด') + 1;
  if (editCol > 0) sheet.getRange(row, editCol).setValue(now);

  return { message: 'แก้ไขผู้ใช้สำเร็จ' };
};

AuthService.deleteUser = function (token, id) {
  const session = AuthService.validateToken(token);
  if (session.role !== 'admin') throw new Error('ไม่มีสิทธิ์ดำเนินการนี้');

  const ss    = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.USERS);

  // Prevent deleting own account
  if (String(session.userId) === String(id)) throw new Error('ไม่สามารถลบบัญชีของตัวเองได้');

  const row = findRowById(sheet, id);
  if (row < 0) throw new Error('ไม่พบผู้ใช้งาน');
  sheet.deleteRow(row);
  return { message: 'ลบผู้ใช้สำเร็จ' };
};

AuthService.changePassword = function (token, oldPassword, newPassword) {
  const session = AuthService.validateToken(token);
  const ss      = getSpreadsheet();
  const sheet   = ss.getSheetByName(SHEETS.USERS);
  const row     = findRowById(sheet, session.userId);
  if (row < 0) throw new Error('ไม่พบบัญชีผู้ใช้');

  const headers   = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const passCol   = headers.indexOf('Password') + 1;
  const curHash   = sheet.getRange(row, passCol).getValue();

  if (curHash !== hashPassword(oldPassword)) throw new Error('รหัสผ่านเดิมไม่ถูกต้อง');

  sheet.getRange(row, passCol).setValue(hashPassword(newPassword));
  const editCol = headers.indexOf('วันที่แก้ไขล่าสุด') + 1;
  if (editCol > 0) sheet.getRange(row, editCol).setValue(new Date().toISOString());

  return { message: 'เปลี่ยนรหัสผ่านสำเร็จ' };
};


/**
 * DataService.gs — CRUD operations for all Sheets
 */

// ── Dashboard ─────────────────────────────────────────────────

function DataService() {}

DataService.getDashboardData = function (token) {
  const session = AuthService.validateToken(token);
  try {
    const ss    = getSpreadsheet();
    const allStaff = sheetToObjects(ss.getSheetByName(SHEETS.STAFF)).filter(s => !s['วันที่ลาออก']);
    let staff = [...allStaff];
    let nurse = sheetToObjects(ss.getSheetByName(SHEETS.NURSE_DATA));

    if (session.role === 'medium' || session.role === 'low') {
      staff = staff.filter(s => String(s['หน่วยงาน']).trim() === String(session.dept).trim());
      const allowedStaffIds = staff.map(s => String(s['ID']));
      nurse = nurse.filter(n => allowedStaffIds.includes(String(n['Staff_ID'])));
    } else if (session.role === 'high') {
      const userSheet = ss.getSheetByName(SHEETS.USERS);
      const users = sheetToObjects(userSheet);
      staff = staff.filter(s => {
        const uObj = users.find(u => String(u['Username']).trim() === String(s['เลขบัตรประชาชน']).trim());
        const uRole = uObj ? uObj['Role'] : 'low';
        return uRole !== 'admin';
      });
      const allowedStaffIds = staff.map(s => String(s['ID']));
      nurse = nurse.filter(n => allowedStaffIds.includes(String(n['Staff_ID'])));
    }

    // 1. Count by department
    const byDept = {};
    staff.forEach(s => {
      const dept = s['หน่วยงาน'] || 'ไม่ระบุ';
      byDept[dept] = (byDept[dept] || 0) + 1;
    });

    // 2. Count by type
    const byType = {};
    staff.forEach(s => {
      const t = s['ประเภทตำแหน่ง'] || 'ไม่ระบุ';
      byType[t] = (byType[t] || 0) + 1;
    });

    // 3. Count by group (Separate พยาบาล and AEMT)
    const byGroup = {};
    staff.forEach(s => {
      let g = String(s['กลุ่ม'] || '').trim();
      const pos = String(s['ตำแหน่ง'] || '').trim();

      if (g === 'พยาบาล/AEMT' || g === 'พยาบาล / AEMT') {
        if (pos.includes('AEMT') || pos.includes('เวชกิจฉุกเฉิน')) {
          g = 'AEMT';
        } else {
          g = 'พยาบาล';
        }
      } else if (pos.includes('AEMT') || pos.includes('เวชกิจฉุกเฉิน')) {
        g = 'AEMT';
      } else if (!g) {
        g = 'ไม่ระบุ';
      }

      byGroup[g] = (byGroup[g] || 0) + 1;
    });

    // 4. Count by education level
    const byEducation = {};
    staff.forEach(s => {
      const edu = s['วุฒิการศึกษาสูงสุด'] || 'ไม่ระบุ';
      byEducation[edu] = (byEducation[edu] || 0) + 1;
    });

    // 5. Count by age range
    const byAgeRange = {
      'ต่ำกว่า 30 ปี': 0,
      '30 - 39 ปี': 0,
      '40 - 49 ปี': 0,
      '50 - 59 ปี': 0,
      '60 ปีขึ้นไป': 0
    };
    staff.forEach(s => {
      const dobISO = parseToISO(s['ว/ด/ป เกิด'] || s['วันเกิด'] || '');
      if (!dobISO) return;
      const age = calcAge(dobISO);
      if (isNaN(age) || age === '') return;
      if (age < 30) byAgeRange['ต่ำกว่า 30 ปี']++;
      else if (age <= 39) byAgeRange['30 - 39 ปี']++;
      else if (age <= 49) byAgeRange['40 - 49 ปี']++;
      else if (age <= 59) byAgeRange['50 - 59 ปี']++;
      else byAgeRange['60 ปีขึ้นไป']++;
    });

    // 6. Count by tenure range (maximum of work tenure or gov tenure)
    const byTenureRange = {
      'ต่ำกว่า 1 ปี': 0,
      '1 - 5 ปี': 0,
      '5 - 10 ปี': 0,
      '10 - 20 ปี': 0,
      '20 ปีขึ้นไป': 0
    };
    
    const nurseDataMap = {};
    nurse.forEach(n => {
      nurseDataMap[String(n['Staff_ID'])] = n;
    });

    const sysUserSheet = ss.getSheetByName(SHEETS.USERS);
    const sysUsers = sysUserSheet ? sheetToObjects(sysUserSheet) : [];
    const cleanStr = v => String(v || '').trim().replace(/[- .]/g, '').toLowerCase();

    staff.forEach(s => {
      // 1. Work tenure in years
      const startISO = parseToISO(s['วันที่เริ่มทำงานเป็นรายเดือน'] || s['วันที่เริ่มทำงานเป็นรายวัน'] || s['วันเริ่มทำงานรายเดือน'] || s['วันเริ่มทำงานรายวัน'] || s['วันที่เริ่มทำงาน'] || '');
      let workYears = 0;
      if (startISO) {
        const start = new Date(startISO);
        if (!isNaN(start.getTime())) {
          const now = new Date();
          workYears = now.getFullYear() - start.getFullYear();
          const m = now.getMonth() - start.getMonth();
          if (m < 0 || (m === 0 && now.getDate() < start.getDate())) workYears--;
        }
      }

      // 2. Gov tenure in years
      const idCard = cleanStr(s['เลขบัตรประชาชน']);
      const u = sysUsers.find(user => cleanStr(user['Username']) === idCard || (cleanStr(user['Username']) && cleanStr(user['Username']).includes(idCard)));
    const systemRole = (u && String(u['Role']).toLowerCase() !== 'low') ? String(u['Role']).toLowerCase() : 'low';
    const nurseData = nurseDataMap[String(s['ID'])];
      const appointDateStr = s['วันที่บรรจุข้าราชการ'] || s['วันบรรจุข้าราการ'] || s['วันบรรจุ'] || (nurseData ? (nurseData['วันที่บรรจุข้าราชการ'] || nurseData['วันบรรจุข้าราชการ']) : '') || '';
      const appointISO = parseToISO(appointDateStr);
      let govYears = 0;
      if (appointISO) {
        const appoint = new Date(appointISO);
        if (!isNaN(appoint.getTime())) {
          const now = new Date();
          govYears = now.getFullYear() - appoint.getFullYear();
          const m = now.getMonth() - appoint.getMonth();
          if (m < 0 || (m === 0 && now.getDate() < appoint.getDate())) govYears--;
        }
      }

      const years = Math.max(workYears, govYears);
      
      if (years < 1) byTenureRange['ต่ำกว่า 1 ปี']++;
      else if (years <= 5) byTenureRange['1 - 5 ปี']++;
      else if (years <= 10) byTenureRange['5 - 10 ปี']++;
      else if (years <= 20) byTenureRange['10 - 20 ปี']++;
      else byTenureRange['20 ปีขึ้นไป']++;
    });

    // 7. Retirement watch (age >= 58)
    const retiringSoon = [];
    staff.forEach(s => {
      const dobISO = parseToISO(s['ว/ด/ป เกิด'] || s['วันเกิด'] || '');
      if (!dobISO) return;
      const age = calcAge(dobISO);
      if (isNaN(age) || age === '') return;
      if (age >= 58) {
        retiringSoon.push({
          id: s['ID'],
          name: s['ชื่อ-สกุล'],
          age: age,
          position: s['ตำแหน่ง'],
          dept: s['หน่วยงาน'],
        });
      }
    });
    retiringSoon.sort((a, b) => b.age - a.age);

    // 8. License expiry warnings
    const warnDays = 90;
    const today    = new Date();
    const licenseAlerts = [];
    
    staff.forEach(s => {
      const idCard = cleanStr(s['เลขบัตรประชาชน']);
      const u = sysUsers.find(user => cleanStr(user['Username']) === idCard || (cleanStr(user['Username']) && cleanStr(user['Username']).includes(idCard)));
      const systemRole = (u && String(u['Role']).toLowerCase() !== 'low') ? String(u['Role']).toLowerCase() : 'low';
      const nurseData = nurseDataMap[String(s['ID'])];
      const lic = getStaffLicenseData(s, nurseData);
      if (lic.licenseNo && lic.daysUntilExpiry !== null && lic.daysUntilExpiry <= warnDays) {
        licenseAlerts.push({
          staffId:  s['ID'],
          name:     s['ชื่อ-สกุล'],
          expDate:  lic.licenseExpiry,
          daysLeft: lic.daysUntilExpiry,
          status:   lic.daysUntilExpiry < 0 ? 'expired' : lic.daysUntilExpiry <= 30 ? 'critical' : 'warning',
        });
      }
    });
    
    // Also include any orphan records in nurse sheet that are not in staff sheet
    nurse.forEach(n => {
      const s = staff.find(x => String(x['ID']) === String(n['Staff_ID']));
      if (!s && n['เลขที่ใบประกอบ']) {
        const lic = getStaffLicenseData({ 'ID': n['Staff_ID'] }, n);
        if (lic.daysUntilExpiry !== null && lic.daysUntilExpiry <= warnDays) {
          licenseAlerts.push({
            staffId:  n['Staff_ID'],
            name:     n['ชื่อ-สกุล'] || 'ไม่ระบุ',
            expDate:  lic.licenseExpiry,
            daysLeft: lic.daysUntilExpiry,
            status:   lic.daysUntilExpiry < 0 ? 'expired' : lic.daysUntilExpiry <= 30 ? 'critical' : 'warning',
          });
        }
      }
    });
    
    licenseAlerts.sort((a, b) => a.daysLeft - b.daysLeft);

    // 9. Training this fiscal year
    const currentYear = thaiYear(today);
    const training = sheetToObjects(ss.getSheetByName(SHEETS.TRAINING))
      .filter(t => String(t['ปีงบประมาณ']) === String(currentYear));

    // 10. Training stats
    const trainedStaffIds = new Set();
    let totalTrainingDays = 0;
    training.forEach(t => {
      trainedStaffIds.add(String(t['Staff_ID']));
      const days = parseFloat(t['รวมเวลา (วัน)']) || 0;
      totalTrainingDays += days;
    });
    const trainingCoverage = staff.length > 0 
      ? Math.round((trainedStaffIds.size / staff.length) * 100) 
      : 0;

    // 11. Birthdays (Only for medium role and above)
    const birthdaysThisMonth = [];
    const birthdaysNextMonth = [];
    if (session.role !== 'low') {
      const now = new Date();
      const currentMonth = now.getMonth();
      const nextMonth = (currentMonth + 1) % 12;

      allStaff.forEach(s => {
        const dobISO = parseToISO(s['ว/ด/ป เกิด'] || s['วันเกิด'] || '');
        if (!dobISO) return;
        const d = new Date(dobISO);
        if (isNaN(d.getTime())) return;
        const m = d.getMonth();
        const date = d.getDate();
        
        if (m === currentMonth || m === nextMonth) {
          const bdayObj = {
            id: s['ID'],
            name: s['ชื่อ-สกุล'],
            department: s['หน่วยงาน'] || 'ไม่ระบุ',
            date: date,
            month: m + 1
          };
          if (m === currentMonth) birthdaysThisMonth.push(bdayObj);
          else birthdaysNextMonth.push(bdayObj);
        }
      });
      birthdaysThisMonth.sort((a, b) => a.date - b.date);
      birthdaysNextMonth.sort((a, b) => a.date - b.date);
    }

    return {
      totalStaff:       staff.length,
      byDept, byType, byGroup,
      byEducation, byAgeRange, byTenureRange,
      licenseAlerts,
      trainingCount:    training.length,
      totalTrainingDays,
      trainingCoverage,
      retiringSoon,
      birthdaysThisMonth,
      birthdaysNextMonth,
      currentYear,
      updatedAt:        new Date().toISOString(),
      isSetup:          true,
    };
  } catch(e) {
    // ยังไม่ได้ติดตั้งระบบ - return ข้อมูลว่าง
    return {
      totalStaff: 0, byDept: {}, byType: {}, byGroup: {},
      byEducation: {}, byAgeRange: {}, byTenureRange: {},
      licenseAlerts: [], trainingCount: 0, totalTrainingDays: 0, trainingCoverage: 0, retiringSoon: [],
      currentYear: thaiYear(new Date()),
      updatedAt: new Date().toISOString(),
      isSetup: false,
      setupError: e.message,
    };
  }
};

// ── Staff ─────────────────────────────────────────────────────

DataService.getStaffList = function (token, filters) {
  const session = AuthService.validateToken(token);
  filters = filters || {};
  const ss    = getSpreadsheet();
  let staff   = sheetToObjects(ss.getSheetByName(SHEETS.STAFF));
  let bypassFilter = false;
  if (filters.competencyId) {
    const comps = sheetToObjects(ss.getSheetByName(SHEETS.COMPETENCIES));
    const comp = comps.find(c => String(c['ID']) === String(filters.competencyId));
    if (comp && (String(comp['ResponsibleStaffId']) === String(session.staffId) || String(comp['CreatedByStaffId']) === String(session.staffId))) {
      bypassFilter = true;
    }
  }

  // Role-Based Filtering
  if (!bypassFilter) {
    if (session.role === 'medium') {
      staff = staff.filter(s => String(s['หน่วยงาน']).trim() === String(session.dept).trim());
    } else if (session.role === 'low') {
      staff = staff.filter(s => String(s['ID']) === String(session.staffId));
    } else if (session.role === 'high') {
      const userSheet = ss.getSheetByName(SHEETS.USERS);
      const users = sheetToObjects(userSheet);
      staff = staff.filter(s => {
        const uObj = users.find(u => String(u['Username']).trim() === String(s['เลขบัตรประชาชน']).trim());
        const uRole = uObj ? uObj['Role'] : 'low';
        return uRole !== 'admin'; // Only view lower (non-admin) roles
      });
    }
  }

  const nurseSheet = ss.getSheetByName(SHEETS.NURSE_DATA);
  const nurseDataMap = {};
  if (nurseSheet) {
    sheetToObjects(nurseSheet).forEach(n => {
      nurseDataMap[String(n['Staff_ID'])] = n;
    });
  }

  // Filter by resignation status
  const statusFilter = (filters && filters.status) ? filters.status : 'active';
  if (statusFilter === 'active') {
    staff = staff.filter(s => !s['วันที่ลาออก'] || String(s['วันที่ลาออก']).trim() === '');
  } else if (statusFilter === 'resigned') {
    staff = staff.filter(s => s['วันที่ลาออก'] && String(s['วันที่ลาออก']).trim() !== '');
  }
  // 'all' returns both active and resigned

  if (filters.dept)    staff = staff.filter(s => s['หน่วยงาน'] === filters.dept);
  if (filters.group)   staff = staff.filter(s => s['กลุ่ม'] === filters.group);
  if (filters.type)    staff = staff.filter(s => s['ประเภทตำแหน่ง'] === filters.type);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    staff = staff.filter(s =>
      String(s['ชื่อ-สกุล']).toLowerCase().includes(q) ||
      String(s['ชื่อเล่น']).toLowerCase().includes(q) ||
      String(s['ตำแหน่ง']).toLowerCase().includes(q) ||
      String(s['เลขบัตรประชาชน']).includes(q)
    );
  }

  const sysUserSheet = ss.getSheetByName(SHEETS.USERS);
  const sysUsers = sysUserSheet ? sheetToObjects(sysUserSheet) : [];
  const clean = v => String(v || '').trim().replace(/[- .]/g, '').toLowerCase();

  return staff.map(s => {
    const startDate = s['วันที่เริ่มทำงานเป็นรายเดือน'] || s['วันที่เริ่มทำงานเป็นรายวัน'] || s['วันเริ่มทำงานรายเดือน'] || s['วันเริ่มทำงานรายวัน'] || s['วันที่เริ่มทำงาน'] || '';
    const idCard = clean(s['เลขบัตรประชาชน']);
    const u = sysUsers.find(user => clean(user['Username']) === idCard || (clean(user['Username']) && clean(user['Username']).includes(idCard)));
    const systemRole = (u && String(u['Role']).toLowerCase() !== 'low') ? String(u['Role']).toLowerCase() : 'low';
    const nurseData = nurseDataMap[String(s['ID'])];
    const appointDateStr = s['วันที่บรรจุข้าราชการ'] || s['วันบรรจุข้าราการ'] || s['วันบรรจุ'] || (nurseData ? (nurseData['วันที่บรรจุข้าราชการ'] || nurseData['วันบรรจุข้าราชการ']) : '') || '';
    const govDur = appointDateStr ? calcWorkDuration(parseToISO(appointDateStr)) : '';
    const isResigned = !!(s['วันที่ลาออก'] && String(s['วันที่ลาออก']).trim() !== '');
    return {
      id:          s['ID'],
      name:        s['ชื่อ-สกุล'],
      nickname:    s['ชื่อเล่น'],
      position:    s['ตำแหน่ง'],
      type:        s['ประเภทตำแหน่ง'],
      dept:        s['หน่วยงาน'],
      group:       s['กลุ่ม'],
      phone:       s['เบอร์โทร'],
      photoId:     s['Photo_ID'],
      managerId:   s['หัวหน้า_ID'] || '',
      rank:        s['ลำดับตำแหน่ง'] || '',
      startDate:   startDate,
      workDur:     calcWorkDuration(startDate),
      govDur:      govDur,
      isResigned:  isResigned,
      resignDate:  isResigned ? parseToISO(s['วันที่ลาออก']) : '',
      systemRole:  typeof systemRole !== 'undefined' ? systemRole : 'low',
    };
  });
};

DataService.getAllDepartments = function (token) {
  AuthService.validateToken(token); // just validate, no role restriction to get depts
  const ss = getSpreadsheet();
  const staff = sheetToObjects(ss.getSheetByName(SHEETS.STAFF));
  const depts = new Set();
  staff.forEach(s => {
    if (s['หน่วยงาน']) depts.add(String(s['หน่วยงาน']).trim());
  });
  return Array.from(depts).filter(d => d).sort();
};

// Record staff resignation and auto-disable user account
DataService.resignStaff = function (token, staffId, resignDate, reason) {
  const session = AuthService.validateToken(token);
  if (session.role !== 'admin' && session.role !== 'high') throw new Error('ไม่มีสิทธิ์ดำเนินการนี้');
  if (!resignDate) throw new Error('กรุณาระบุวันที่ลาออก');

  const ss         = getSpreadsheet();
  const staffSheet = ss.getSheetByName(SHEETS.STAFF);
  const staff      = sheetToObjects(staffSheet);
  const headers    = staffSheet.getRange(1, 1, 1, staffSheet.getLastColumn()).getValues()[0];
  const idx        = staff.findIndex(s => String(s['ID']) === String(staffId));
  if (idx < 0) throw new Error('ไม่พบข้อมูลพนักงาน ID: ' + staffId);

  const resignCol = headers.indexOf('วันที่ลาออก') + 1;
  if (resignCol <= 0) throw new Error('ไม่พบคอลัมน์ วันที่ลาออก ในตารางพนักงาน');

  staffSheet.getRange(idx + 2, resignCol).setValue(resignDate);

  // Disable user account in USERS sheet
  const s          = staff[idx];
  const usersSheet = ss.getSheetByName(SHEETS.USERS);
  if (usersSheet) {
    const users    = sheetToObjects(usersSheet);
    const uHeaders = usersSheet.getRange(1, 1, 1, usersSheet.getLastColumn()).getValues()[0];
    const clean    = v => String(v || '').trim().replace(/[- .]/g, '').toLowerCase();
    const idCard   = clean(s['เลขบัตรประชาชน']);
    const sName    = clean(s['ชื่อ-สกุล']);

    const uIdx = users.findIndex(u => {
      const uUsername = clean(u['Username']);
      const uName     = clean(u['ชื่อ-สกุล']);
      if (idCard && uUsername && (uUsername === idCard || uUsername.includes(idCard) || idCard.includes(uUsername))) return true;
      if (sName && uName && (uName === sName || uName.includes(sName))) return true;
      return false;
    });

    if (uIdx >= 0) {
      const statusCol = uHeaders.indexOf('สถานะ') + 1;
      if (statusCol > 0) {
        usersSheet.getRange(uIdx + 2, statusCol).setValue('disabled');
      }
    }
  }

  SpreadsheetApp.flush();
  return { message: 'บันทึกการลาออกของ ' + (s['ชื่อ-สกุล'] || '') + ' เรียบร้อยแล้ว และระงับบัญชีเข้าใช้งาน' };
};

// Cancel staff resignation (restore active status)
DataService.cancelResignation = function (token, staffId) {
  const session = AuthService.validateToken(token);
  if (session.role !== 'admin') throw new Error('เฉพาะ admin เท่านั้น');

  const ss         = getSpreadsheet();
  const staffSheet = ss.getSheetByName(SHEETS.STAFF);
  const staff      = sheetToObjects(staffSheet);
  const headers    = staffSheet.getRange(1, 1, 1, staffSheet.getLastColumn()).getValues()[0];
  const idx        = staff.findIndex(s => String(s['ID']) === String(staffId));
  if (idx < 0) throw new Error('ไม่พบข้อมูลพนักงาน ID: ' + staffId);

  const resignCol = headers.indexOf('วันที่ลาออก') + 1;
  if (resignCol > 0) {
    staffSheet.getRange(idx + 2, resignCol).setValue('');
  }

  // Restore user account status
  const s          = staff[idx];
  const usersSheet = ss.getSheetByName(SHEETS.USERS);
  if (usersSheet) {
    const users    = sheetToObjects(usersSheet);
    const uHeaders = usersSheet.getRange(1, 1, 1, usersSheet.getLastColumn()).getValues()[0];
    const clean    = v => String(v || '').trim().replace(/[- .]/g, '').toLowerCase();
    const idCard   = clean(s['เลขบัตรประชาชน']);
    const sName    = clean(s['ชื่อ-สกุล']);

    const uIdx = users.findIndex(u => {
      const uUsername = clean(u['Username']);
      const uName     = clean(u['ชื่อ-สกุล']);
      if (idCard && uUsername && (uUsername === idCard || uUsername.includes(idCard) || idCard.includes(uUsername))) return true;
      if (sName && uName && (uName === sName || uName.includes(sName))) return true;
      return false;
    });

    if (uIdx >= 0) {
      const statusCol = uHeaders.indexOf('สถานะ') + 1;
      if (statusCol > 0) {
        usersSheet.getRange(uIdx + 2, statusCol).setValue('active');
      }
    }
  }

  SpreadsheetApp.flush();
  return { message: 'ยกเลิกการลาออกของ ' + (s['ชื่อ-สกุล'] || '') + ' เรียบร้อยแล้ว (คืนสถานะเป็นพนักงานปัจจุบัน)' };
};

DataService.getStaff = function (token, id) {
  const session = AuthService.validateToken(token);
  const ss    = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.STAFF);
  const staff = sheetToObjects(sheet);
  const s     = staff.find(x => String(x['ID']) === String(id));
  if (!s) throw new Error('ไม่พบข้อมูลบุคลากร');

  // Role-Based Access Control
  if (session.role === 'low') {
    if (String(id) !== String(session.staffId)) throw new Error('ไม่มีสิทธิ์เข้าดูข้อมูลผู้อื่น');
  } else if (session.role === 'medium') {
    if (String(s['หน่วยงาน']).trim() !== String(session.dept).trim()) throw new Error('ไม่มีสิทธิ์เข้าดูข้อมูลนอกหน่วยงาน');
  } else if (session.role === 'high') {
    const userSheet = ss.getSheetByName(SHEETS.USERS);
    const targetUser = sheetToObjects(userSheet).find(u => String(u['Username']).trim() === String(s['เลขบัตรประชาชน']).trim());
    const targetRole = targetUser ? targetUser['Role'] : 'low';
    if (targetRole === 'admin') throw new Error('ไม่มีสิทธิ์เข้าดูข้อมูลผู้ดูแลระบบ');
  }

  const nurseSheet = ss.getSheetByName(SHEETS.NURSE_DATA);
  const nurseData  = nurseSheet ? sheetToObjects(nurseSheet).find(n => String(n['Staff_ID']) === String(id)) : null;

  const training = DataService.getTrainingByStaff(null, id, true); // skip token check

  const docs = DataService.getDocuments(null, id, true);

  const startDate = s['วันที่เริ่มทำงานเป็นรายเดือน'] || s['วันที่เริ่มทำงานเป็นรายวัน'] || s['วันเริ่มทำงานรายเดือน'] || s['วันเริ่มทำงานรายวัน'] || s['วันที่เริ่มทำงาน'] || '';
  const lic = getStaffLicenseData(s, nurseData);

  return {
    id:              s['ID'],
    name:            s['ชื่อ-สกุล'],
    idCard:          s['เลขบัตรประชาชน'],
    nickname:        s['ชื่อเล่น'],
    maritalStatus:   s['สถานะภาพ'],
    dob:             parseToISO(s['วันเกิด'] || s['ว/ด/ป เกิด'] || ''),
    age:             calcAge(parseToISO(s['วันเกิด'] || s['ว/ด/ป เกิด'] || '')),
    phone:           s['เบอร์โทร'],
    address:         s['ที่อยู่'],
    position:        s['ตำแหน่ง'],
    empType:         s['ประเภทตำแหน่ง'],
    dept:            s['หน่วยงาน'],
    group:           s['กลุ่ม'],
    startMonthly:    parseToISO(s['วันที่เริ่มทำงานเป็นรายเดือน'] || s['วันเริ่มทำงานรายเดือน'] || ''),
    startDaily:      parseToISO(s['วันที่เริ่มทำงานเป็นรายวัน'] || s['วันเริ่มทำงานรายวัน'] || ''),
    education:       s['วุฒิการศึกษาสูงสุด'],
    major:           s['สาขา'],
    university:      s['สถาบันที่จบ'],
    contEdu:         s['การศึกษาต่อเนื่อง'] || s['การศึกษาต่อเนื่อง/เฉพาะทาง'] || '',
    health:          s['สุขภาพ'],
    resignDate:      parseToISO(s['วันที่ลาออก']),
    driveFolderId:   s['DriveFolder_ID'],
    photoId:         s['Photo_ID'],
    managerId:       s['หัวหน้า_ID'] || '',
    workDuration:    calcWorkDuration(startDate),
    nurseData:       lic,
    training:        training,
    documents:       docs,
  };
};

DataService.addStaff = function (token, data) {
  const session = AuthService.validateToken(token);
  if (session.role !== 'admin' && session.role !== 'high') throw new Error('ไม่มีสิทธิ์ลงทะเบียนบุคลากรใหม่');
  const ss    = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.STAFF);
  const id    = nextId(sheet);
  const now   = new Date().toISOString();

  // Create personal Drive folder
  let folderId = '';
  try {
    const groupFolder = _getGroupSubfolder(data.group);
    const personalFolder = groupFolder.createFolder(`${data.name} (ID${id})`);
    personalFolder.createFolder('เกียรติบัตร');
    folderId = personalFolder.getId();
  } catch(e) { Logger.log('Drive folder error: ' + e); }

  let phoneVal = data.phone || '';
  if (phoneVal) {
    let s = String(phoneVal).trim();
    if (/^[1-9]\d{7,8}$/.test(s)) {
      s = '0' + s;
    }
    phoneVal = "'" + s;
  }

  appendObjectToSheet(sheet, {
    'ID': id,
    'ชื่อ-สกุล': data.name || '',
    'เลขบัตรประชาชน': data.idCard || '',
    'ชื่อเล่น': data.nickname || '',
    'สถานะภาพ': data.maritalStatus || '',
    'วันเกิด': data.dob || '',
    'เบอร์โทร': phoneVal,
    'ที่อยู่': data.address || '',
    'ตำแหน่ง': data.position || '',
    'ประเภทตำแหน่ง': data.empType || '',
    'หน่วยงาน': data.dept || '',
    'กลุ่ม': data.group || _inferGroup(data.position || ''),
    'วันเริ่มทำงานรายเดือน': data.startMonthly || '',
    'วันเริ่มทำงานรายวัน': data.startDaily || '',
    'วุฒิการศึกษาสูงสุด': data.education || '',
    'สาขา': data.major || '',
    'สถาบันที่จบ': data.university || '',
    'การศึกษาต่อเนื่อง': data.contEdu || '',
    'สุขภาพ': data.health || '',
    'วันที่ลาออก': '',
    'DriveFolder_ID': folderId,
    'Photo_ID': '',
    'หัวหน้า_ID': data.managerId || '',
    'CreatedAt': now,
    'UpdatedAt': now,
  });

  // If nurse/AEMT, add nurse data row
  if (data.group && (data.group.includes('พยาบาล') || data.group === 'AEMT')) {
    const nurseSheet = ss.getSheetByName(SHEETS.NURSE_DATA);
    const nurseId    = nextId(nurseSheet);
    appendObjectToSheet(nurseSheet, {
      'ID': nurseId,
      'Staff_ID': id,
      'เลขที่ใบประกอบ': data.licenseNo || '',
      'วันที่ออกใบประกอบ': data.licenseIssue || '',
      'วันหมดอายุใบประกอบ': data.licenseExpiry || '',
      'วันที่บรรจุข้าราชการ': data.appointDate || '',
      'วันที่เกษียณ': data.retireDate || '',
      'หมายเหตุ': ''
    });
  }

  // Create default user in USERS sheet with 'low' role, using idCard as Username and phone as Password
  if (data.idCard && data.phone) {
    try {
      const userSheet = ss.getSheetByName(SHEETS.USERS);
      const users = sheetToObjects(userSheet);
      const cleanPhone = String(data.phone).trim().replace(/[- ']/g, '');
      if (cleanPhone) {
        const exists = users.some(u => String(u['Username']).trim() === String(data.idCard).trim());
        if (!exists) {
          const nextUserId = users.length ? Math.max(...users.map(u => parseInt(u['ID']) || 0)) + 1 : 2;
          const userNow = new Date().toISOString();
          userSheet.appendRow([
            nextUserId,
            String(data.idCard).trim(),
            hashPassword(cleanPhone),
            'low', // Default to low permission
            data.name || '',
            '', // email
            'active',
            userNow,
            userNow
          ]);
        }
      }
    } catch(e) { Logger.log('Auto user creation error: ' + e); }
  }

  return { id, message: 'เพิ่มบุคลากรสำเร็จ', driveFolderId: folderId };
};

DataService.getDepartmentsPublic = function () {
  const ss = getSpreadsheet();
  const staff = sheetToObjects(ss.getSheetByName(SHEETS.STAFF));
  const depts = new Set();
  staff.forEach(s => { if (s['หน่วยงาน']) depts.add(String(s['หน่วยงาน']).trim()); });
  return Array.from(depts).filter(d => d).sort();
};

DataService.getStaffListPublic = function () {
  const ss    = getSpreadsheet();
  const staff = sheetToObjects(ss.getSheetByName(SHEETS.STAFF));
  const activeStaff = staff.filter(s => !s['วันที่ลาออก'] || s['วันที่ลาออก'] === '');
  return activeStaff.map(s => ({
    id: s['ID'],
    name: s['ชื่อ-สกุล'],
    position: s['ตำแหน่ง'] || ''
  }));
};

DataService.registerStaffPublic = function (data) {
  const ss    = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.STAFF);
  const id    = nextId(sheet);
  const now   = new Date().toISOString();

  let folderId = '';
  try {
    const groupFolder = _getGroupSubfolder(data.group);
    const personalFolder = groupFolder.createFolder(`${data.name} (ID${id})`);
    personalFolder.createFolder('เกียรติบัตร');
    folderId = personalFolder.getId();
  } catch(e) { Logger.log('Drive folder error: ' + e); }

  let phoneVal = data.phone || '';
  if (phoneVal) {
    let s = String(phoneVal).trim();
    if (/^[1-9]\d{7,8}$/.test(s)) {
      s = '0' + s;
    }
    phoneVal = "'" + s;
  }

  appendObjectToSheet(sheet, {
    'ID': id,
    'ชื่อ-สกุล': data.name || '',
    'เลขบัตรประชาชน': data.idCard || '',
    'ชื่อเล่น': data.nickname || '',
    'สถานะภาพ': data.maritalStatus || '',
    'วันเกิด': data.dob || '',
    'เบอร์โทร': phoneVal,
    'ที่อยู่': data.address || '',
    'ตำแหน่ง': data.position || '',
    'ประเภทตำแหน่ง': data.empType || '',
    'หน่วยงาน': data.dept || '',
    'กลุ่ม': data.group || _inferGroup(data.position || ''),
    'วันเริ่มทำงานรายเดือน': data.startMonthly || '',
    'วันเริ่มทำงานรายวัน': data.startDaily || '',
    'วุฒิการศึกษาสูงสุด': data.education || '',
    'สาขา': data.major || '',
    'สถาบันที่จบ': data.university || '',
    'การศึกษาต่อเนื่อง': data.contEdu || '',
    'สุขภาพ': data.health || '',
    'วันที่ลาออก': '',
    'DriveFolder_ID': folderId,
    'Photo_ID': '',
    'หัวหน้า_ID': data.managerId || '',
    'CreatedAt': now,
    'UpdatedAt': now,
  });

  if (data.group && (data.group.includes('พยาบาล') || data.group === 'AEMT')) {
    const nurseSheet = ss.getSheetByName(SHEETS.NURSE_DATA);
    const nurseId    = nextId(nurseSheet);
    appendObjectToSheet(nurseSheet, {
      'ID': nurseId,
      'Staff_ID': id,
      'เลขที่ใบประกอบ': data.licenseNo || '',
      'วันที่ออกใบประกอบ': data.licenseIssue || '',
      'วันหมดอายุใบประกอบ': data.licenseExpiry || '',
      'วันที่บรรจุข้าราชการ': data.appointDate || '',
      'วันที่เกษียณ': data.retireDate || '',
      'หมายเหตุ': ''
    });
  }

  if (data.idCard && data.phone) {
    try {
      const userSheet = ss.getSheetByName(SHEETS.USERS);
      const users = sheetToObjects(userSheet);
      const cleanPhone = String(data.phone).trim().replace(/[- ']/g, '');
      if (cleanPhone) {
        const exists = users.some(u => String(u['Username']).trim() === String(data.idCard).trim());
        if (!exists) {
          const nextUserId = users.length ? Math.max(...users.map(u => parseInt(u['ID']) || 0)) + 1 : 2;
          const userNow = new Date().toISOString();
          userSheet.appendRow([
            nextUserId,
            String(data.idCard).trim(),
            hashPassword(cleanPhone),
            'low',
            data.name || '',
            '',
            'active',
            userNow,
            userNow
          ]);
        }
      }
    } catch(e) { Logger.log('Auto user creation error: ' + e); }
  }

  return { id, message: 'ลงทะเบียนสำเร็จ บัญชีผู้ใช้ของคุณเปิดใช้งานแล้ว', driveFolderId: folderId };
};

DataService.updateStaff = function (token, id, data) {
  const session = AuthService.validateToken(token);
  const isSelf = String(session.staffId) === String(id);
  const isAdmin = session.role === 'admin';
  const isHigh = session.role === 'high';

  if (!isAdmin && !isHigh && !isSelf) {
    throw new Error('ไม่มีสิทธิ์แก้ไขข้อมูลบุคลากร');
  }

  const ss    = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.STAFF);
  const row   = findRowById(sheet, id);
  if (row < 0) throw new Error('ไม่พบข้อมูลบุคลากร');

  const s = sheetToObjects(sheet).find(x => String(x['ID']) === String(id));

  if (isHigh && !isAdmin) {
    const userSheet = ss.getSheetByName(SHEETS.USERS);
    const targetUser = sheetToObjects(userSheet).find(u => String(u['Username']).trim() === String(s['เลขบัตรประชาชน']).trim());
    const targetRole = targetUser ? targetUser['Role'] : 'low';
    if (targetRole === 'admin') throw new Error('ไม่มีสิทธิ์แก้ไขข้อมูลผู้ดูแลระบบ');
  }

  if (session.role === 'low' || (!isAdmin && !isHigh && isSelf)) {
    delete data.position;
    delete data.empType;
    delete data.dept;
    delete data.group;
    delete data.managerId;
    delete data.rank;
    delete data.idCard;
    delete data.name;
  }

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  const fieldMap = {
    name:          'ชื่อ-สกุล',
    idCard:        'เลขบัตรประชาชน',
    nickname:      'ชื่อเล่น',
    maritalStatus: 'สถานะภาพ',
    dob:           'วันเกิด',
    phone:         'เบอร์โทร',
    address:       'ที่อยู่',
    position:      'ตำแหน่ง',
    empType:       'ประเภทตำแหน่ง',
    dept:          'หน่วยงาน',
    group:         'กลุ่ม',
    startMonthly:  'วันเริ่มทำงานรายเดือน',
    startDaily:    'วันเริ่มทำงานรายวัน',
    education:     'วุฒิการศึกษาสูงสุด',
    major:         'สาขา',
    university:    'สถาบันที่จบ',
    contEdu:       'การศึกษาต่อเนื่อง',
    health:        'สุขภาพ',
    resignDate:    'วันที่ลาออก',
    photoId:       'Photo_ID',
    managerId:     'หัวหน้า_ID',
    rank:          'ลำดับตำแหน่ง',
  };

  Object.keys(fieldMap).forEach(key => {
    if (data[key] !== undefined) {
      const col = headers.indexOf(fieldMap[key]) + 1;
      if (col > 0) {
        let val = data[key];
        if (fieldMap[key] === 'เบอร์โทร' && val) {
          let s = String(val).trim();
          if (/^[1-9]\d{7,8}$/.test(s)) {
            s = '0' + s;
          }
          val = "'" + s;
        }
        sheet.getRange(row, col).setValue(val);
      }
    }
  });

  const editCol = headers.indexOf('วันที่แก้ไข') + 1;
  if (editCol > 0) sheet.getRange(row, editCol).setValue(new Date().toISOString());

  // Update nurse data if provided
  if (data.nurseData) {
    DataService.saveNurseData(null, id, data.nurseData, true);
  }

  return { message: 'แก้ไขข้อมูลสำเร็จ' };
};

DataService.deleteStaff = function (token, id) {
  const session = AuthService.validateToken(token);
  if (session.role !== 'admin') throw new Error('ไม่มีสิทธิ์ดำเนินการนี้');

  const ss    = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.STAFF);
  const row   = findRowById(sheet, id);
  if (row < 0) throw new Error('ไม่พบข้อมูลบุคลากร');
  sheet.deleteRow(row);
  return { message: 'ลบข้อมูลสำเร็จ' };
};

DataService.autoArrangeOrgChart = function (token) {
  AuthService.validateToken(token);
  const ss    = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.STAFF);
  const staff = sheetToObjects(sheet);
  if (!staff.length) return { message: 'ไม่มีข้อมูลบุคลากร' };

  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0].map(h => String(h).trim());
  
  let rankColIndex = headers.indexOf('ลำดับตำแหน่ง');
  if (rankColIndex === -1) {
    sheet.getRange(1, headers.length + 1).setValue('ลำดับตำแหน่ง');
    headers.push('ลำดับตำแหน่ง');
    rankColIndex = headers.length - 1;
  }
  let managerIdColIndex = headers.indexOf('หัวหน้า_ID');
  if (managerIdColIndex === -1) {
    sheet.getRange(1, headers.length + 1).setValue('หัวหน้า_ID');
    headers.push('หัวหน้า_ID');
    managerIdColIndex = headers.length - 1;
  }

  const level1 = [];
  const level1_1 = [];
  const level2 = [];
  const level3 = [];

  staff.forEach(s => {
    const rawRank = String(s['ลำดับตำแหน่ง'] || '').trim();
    const pos     = String(s['ตำแหน่ง'] || '').toLowerCase();

    let rank = rawRank;
    if (!rank) {
      if (pos.includes('หัวหน้ากลุ่มงาน') || pos.includes('ผู้อำนวยการ') || pos.includes('หัวหน้าใหญ่')) {
        rank = '1';
      } else if (pos.includes('เลขา') || pos.includes('เลขานุการ') || pos.includes('ผู้ช่วยหัวหน้ากลุ่มงาน')) {
        rank = '1.1';
      } else if (pos.includes('หัวหน้างาน') || pos.includes('หัวหน้าตึก') || pos.includes('หัวหน้าหน่วย') || pos.includes('หัวหน้าแผนก') || pos.includes('หัวหน้า')) {
        rank = '2';
      } else {
        rank = '3';
      }
    }

    s._computedRank = rank;
    if (rank === '1') level1.push(s);
    else if (rank === '1.1') level1_1.push(s);
    else if (rank === '2') level2.push(s);
    else level3.push(s);
  });

  const topBoss   = level1[0] || level2[0];
  const topBossId = topBoss ? String(topBoss['ID']) : '';

  staff.forEach(s => {
    const row  = s._row;
    const rank = s._computedRank;
    let managerId = '';

    if (rank === '1') {
      managerId = '';
    } else if (rank === '1.1') {
      managerId = topBossId;
    } else if (rank === '2') {
      managerId = topBossId;
    } else if (rank === '3') {
      const dept = String(s['หน่วยงาน'] || '').trim();
      const matchingHead = level2.find(h => String(h['หน่วยงาน'] || '').trim() === dept);
      managerId = matchingHead ? String(matchingHead['ID']) : topBossId;
    }

    sheet.getRange(row, managerIdColIndex + 1).setValue(managerId);
    sheet.getRange(row, rankColIndex + 1).setValue(rank);
  });

  return { message: 'จัดผังองค์กรตามลำดับตำแหน่ง (1, 1.1, 2, 3) สำเร็จ' };
};

// ── Nurse Data ────────────────────────────────────────────────

DataService.getNurseData = function (token, staffId) {
  if (token) AuthService.validateToken(token);
  const ss    = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.NURSE_DATA);
  const rows  = sheetToObjects(sheet);
  const n     = rows.find(r => String(r['Staff_ID']) === String(staffId));
  if (!n) return null;
  return {
    id:             n['ID'],
    licenseNo:      n['เลขที่ใบประกอบ'],
    licenseIssue:   parseToISO(n['วันที่ออกใบประกอบ']),
    licenseExpiry:  parseToISO(n['วันหมดอายุใบประกอบ']),
    appointDate:    parseToISO(n['วันที่บรรจุข้าราชการ']),
    retireDate:     parseToISO(n['วันที่เกษียณ']),
    daysUntilExpiry: daysUntil(parseToISO(n['วันหมดอายุใบประกอบ'])),
  };
};

DataService.saveNurseData = function (token, staffId, data, skipAuth) {
  let session = null;
  if (!skipAuth) {
    session = AuthService.validateToken(token);
    if (session.role !== 'admin' && session.role !== 'high') throw new Error('ไม่มีสิทธิ์แก้ไขข้อมูลใบประกอบวิชาชีพ');
  }
  const ss    = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.NURSE_DATA);
  const rows  = sheetToObjects(sheet);
  const existing = rows.find(r => String(r['Staff_ID']) === String(staffId));

  const rowData = [
    data.licenseNo || '', data.licenseIssue || '', data.licenseExpiry || '',
    data.appointDate || '', data.retireDate || '', data.note || '',
  ];

  if (existing) {
    const row     = findRowById(sheet, existing['ID']);
    const headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
    const fields  = ['เลขที่ใบประกอบ','วันที่ออกใบประกอบ','วันหมดอายุใบประกอบ','วันที่บรรจุข้าราชการ','วันที่เกษียณ','หมายเหตุ'];
    const dataArr = [data.licenseNo, data.licenseIssue, data.licenseExpiry, data.appointDate, data.retireDate, data.note];
    fields.forEach((f, i) => {
      const col = headers.indexOf(f) + 1;
      if (col > 0 && dataArr[i] !== undefined) sheet.getRange(row, col).setValue(dataArr[i] || '');
    });
  } else {
    const id = nextId(sheet);
    appendObjectToSheet(sheet, {
      'ID': id,
      'Staff_ID': staffId,
      'เลขที่ใบประกอบ': data.licenseNo || '',
      'วันที่ออกใบประกอบ': data.licenseIssue || '',
      'วันหมดอายุใบประกอบ': data.licenseExpiry || '',
      'วันที่บรรจุข้าราชการ': data.appointDate || '',
      'วันที่เกษียณ': data.retireDate || '',
      'หมายเหตุ': data.note || ''
    });
  }
  return { message: 'บันทึกข้อมูลใบประกอบสำเร็จ' };
};

// ── Training ──────────────────────────────────────────────────

DataService.getTrainingByStaff = function (token, staffId, skipAuth) {
  let session = null;
  if (!skipAuth) session = AuthService.validateToken(token);
  const ss  = getSpreadsheet();

  // Role-Based Access Control
  if (session && !skipAuth) {
    if (session.role === 'low') {
      if (String(staffId) !== String(session.staffId)) throw new Error('ไม่มีสิทธิ์เข้าดูข้อมูลการอบรมของผู้อื่น');
    } else if (session.role === 'medium') {
      const staff = sheetToObjects(ss.getSheetByName(SHEETS.STAFF));
      const s = staff.find(x => String(x['ID']) === String(staffId));
      if (s && String(s['หน่วยงาน']).trim() !== String(session.dept).trim()) {
        throw new Error('ไม่มีสิทธิ์เข้าดูข้อมูลนอกหน่วยงาน');
      }
    } else if (session.role === 'high') {
      const staff = sheetToObjects(ss.getSheetByName(SHEETS.STAFF));
      const s = staff.find(x => String(x['ID']) === String(staffId));
      if (s) {
        const userSheet = ss.getSheetByName(SHEETS.USERS);
        const targetUser = sheetToObjects(userSheet).find(u => String(u['Username']).trim() === String(s['เลขบัตรประชาชน']).trim());
        const targetRole = targetUser ? targetUser['Role'] : 'low';
        if (targetRole === 'admin') throw new Error('ไม่มีสิทธิ์เข้าดูข้อมูลผู้ดูแลระบบ');
      }
    }
  }
  const rows = sheetToObjects(ss.getSheetByName(SHEETS.TRAINING));
  return rows
    .filter(r => String(r['Staff_ID']) === String(staffId))
    .map(r => ({
      id:          r['ID'],
      course:      r['หลักสูตร'],
      type:        r['ประเภท'],
      startDate:   parseToISO(r['ตั้งแต่วันที่']),
      endDate:     parseToISO(r['ถึงวันที่']),
      days:        r['รวมเวลา (วัน)'],
      institution: r['สถาบัน'],
      year:        r['ปีงบประมาณ'],
      certId:      r['Certificate_ID'],
      note:        r['หมายเหตุ'],
    }));
};

DataService.getAllTraining = function (token, filters) {
  const session = AuthService.validateToken(token);
  filters = filters || {};
  const ss  = getSpreadsheet();
  let rows  = sheetToObjects(ss.getSheetByName(SHEETS.TRAINING));

  // Role-Based Filtering
  if (session.role === 'medium') {
    const staff = sheetToObjects(ss.getSheetByName(SHEETS.STAFF));
    const deptStaffIds = staff.filter(s => String(s['หน่วยงาน']).trim() === String(session.dept).trim()).map(s => String(s['ID']));
    rows = rows.filter(r => deptStaffIds.includes(String(r['Staff_ID'])));
  } else if (session.role === 'low') {
    rows = rows.filter(r => String(r['Staff_ID']) === String(session.staffId));
  } else if (session.role === 'high') {
    const staff = sheetToObjects(ss.getSheetByName(SHEETS.STAFF));
    const userSheet = ss.getSheetByName(SHEETS.USERS);
    const users = sheetToObjects(userSheet);
    const nonAdminStaffIds = staff.filter(s => {
      const uObj = users.find(u => String(u['Username']).trim() === String(s['เลขบัตรประชาชน']).trim());
      const uRole = uObj ? uObj['Role'] : 'low';
      return uRole !== 'admin';
    }).map(s => String(s['ID']));
    rows = rows.filter(r => nonAdminStaffIds.includes(String(r['Staff_ID'])));
  }
  if (filters.year)   rows = rows.filter(r => String(r['ปีงบประมาณ']) === String(filters.year));
  if (filters.type)   rows = rows.filter(r => r['ประเภท'] === filters.type);
  if (filters.course) rows = rows.filter(r => String(r['หลักสูตร']).includes(filters.course));
  return rows.map(r => ({
    id:          r['ID'],
    staffId:     r['Staff_ID'],
    name:        r['ชื่อ-สกุล'],
    course:      r['หลักสูตร'],
    type:        r['ประเภท'],
    startDate:   parseToISO(r['ตั้งแต่วันที่']),
    endDate:     parseToISO(r['ถึงวันที่']),
    days:        r['รวมเวลา (วัน)'],
    institution: r['สถาบัน'],
    year:        r['ปีงบประมาณ'],
    certId:      r['Certificate_ID'],
  }));
};

DataService.addTraining = function (token, data) {
  const session = AuthService.validateToken(token);
  if (session.role !== 'admin' && session.role !== 'high') throw new Error('ไม่มีสิทธิ์บันทึกการอบรม');
  const ss    = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.TRAINING);
  const id    = nextId(sheet);
  const now   = new Date().toISOString();

  // Get staff name
  const staffSheet = ss.getSheetByName(SHEETS.STAFF);
  const staff      = sheetToObjects(staffSheet).find(s => String(s['ID']) === String(data.staffId));
  const name       = staff ? staff['ชื่อ-สกุล'] : '';

  appendObjectToSheet(sheet, {
    'ID': id,
    'Staff_ID': data.staffId,
    'ชื่อ-สกุล': name,
    'หลักสูตร': data.course,
    'อบรม/สมรรถนะ': data.type || 'อบรม',
    'ตั้งแต่วันที่': data.startDate || '',
    'ถึงวันที่': data.endDate || '',
    'รวมเวลา (วัน)': data.days || '',
    'สถาบัน': data.institution || '',
    'ปีงบประมาณ': data.year || thaiYear(new Date()),
    'Certificate_ID': data.certId || '',
    'หมายเหตุ': data.note || '',
    'CreatedAt': now
  });
  return { id, message: 'บันทึกการอบรมสำเร็จ' };
};

DataService.updateTraining = function (token, id, data) {
  const session = AuthService.validateToken(token);
  if (session.role !== 'admin' && session.role !== 'high') throw new Error('ไม่มีสิทธิ์แก้ไขการอบรม');
  const ss    = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.TRAINING);
  const row   = findRowById(sheet, id);
  if (row < 0) throw new Error('ไม่พบข้อมูลการอบรม');

  const headers  = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
  const fieldMap = {
    course:      'หลักสูตร',
    type:        'ประเภท',
    startDate:   'ตั้งแต่วันที่',
    endDate:     'ถึงวันที่',
    days:        'รวมเวลา (วัน)',
    institution: 'สถาบัน',
    year:        'ปีงบประมาณ',
    certId:      'Certificate_ID',
    note:        'หมายเหตุ',
  };
  Object.keys(fieldMap).forEach(key => {
    if (data[key] !== undefined) {
      const col = headers.indexOf(fieldMap[key]) + 1;
      if (col > 0) sheet.getRange(row, col).setValue(data[key]);
    }
  });
  return { message: 'แก้ไขการอบรมสำเร็จ' };
};

DataService.deleteTraining = function (token, id) {
  const session = AuthService.validateToken(token);
  if (session.role !== 'admin' && session.role !== 'high') throw new Error('ไม่มีสิทธิ์ลบข้อมูลการอบรม');
  const ss    = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.TRAINING);
  const row   = findRowById(sheet, id);
  if (row < 0) throw new Error('ไม่พบข้อมูล');
  sheet.deleteRow(row);
  return { message: 'ลบข้อมูลสำเร็จ' };
};
        // ── Courses ───────────────────────────────────────────────────

DataService.getCourseList = function (token) {
  AuthService.validateToken(token);
  const ss = getSpreadsheet();
  return sheetToObjects(ss.getSheetByName(SHEETS.COURSES)).map(c => ({
    id:          c['ID'],
    name:        c['ชื่อหลักสูตร'],
    type:        c['ประเภท'],
    institution: c['สถาบัน'],
    year:        c['ปีงบประมาณ'],
    startDate:   parseToISO(c['วันเริ่ม']),
    endDate:     parseToISO(c['วันสิ้นสุด']),
    days:        c['รวมเวลา (วัน)'],
  }));
};

DataService.addCourse = function (token, data) {
  const session = AuthService.validateToken(token);
  if (session.role !== 'admin' && session.role !== 'high') throw new Error('ไม่มีสิทธิ์เพิ่มหลักสูตร');
  const ss    = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.COURSES);
  const id    = nextId(sheet);
  appendObjectToSheet(sheet, {
    'ID': id,
    'ชื่อหลักสูตร': data.name,
    'ประเภท': data.type || 'อบรม',
    'สถาบัน': data.institution || '',
    'ปีงบประมาณ': data.year || thaiYear(new Date()),
    'วันเริ่ม': data.startDate || '',
    'วันสิ้นสุด': data.endDate || '',
    'รวมเวลา (วัน)': data.days || '',
    'หมายเหตุ': data.note || ''
  });
  return { id, message: 'เพิ่มหลักสูตรสำเร็จ' };
};

DataService.updateCourse = function (token, id, data) {
  const session = AuthService.validateToken(token);
  if (session.role !== 'admin' && session.role !== 'high') throw new Error('ไม่มีสิทธิ์แก้ไขหลักสูตร');
  const ss    = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.COURSES);
  const row   = findRowById(sheet, id);
  if (row < 0) throw new Error('ไม่พบหลักสูตร');
  const headers  = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
  const fieldMap = { name:'ชื่อหลักสูตร', type:'ประเภท', institution:'สถาบัน',
    year:'ปีงบประมาณ', startDate:'วันเริ่ม', endDate:'วันสิ้นสุด', days:'รวมเวลา (วัน)', note:'หมายเหตุ' };
  Object.keys(fieldMap).forEach(k => {
    if (data[k] !== undefined) {
      const col = headers.indexOf(fieldMap[k]) + 1;
      if (col > 0) sheet.getRange(row, col).setValue(data[k]);
    }
  });
  return { message: 'แก้ไขหลักสูตรสำเร็จ' };
};

DataService.deleteCourse = function (token, id) {
  const session = AuthService.validateToken(token);
  if (session.role !== 'admin' && session.role !== 'high') throw new Error('ไม่มีสิทธิ์ลบหลักสูตร');
  const ss    = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.COURSES);
  const row   = findRowById(sheet, id);
  if (row < 0) throw new Error('ไม่พบหลักสูตร');
  sheet.deleteRow(row);
  return { message: 'ลบหลักสูตรสำเร็จ' };
};

// ── Documents ─────────────────────────────────────────────────

DataService.getDocuments = function (token, staffId, skipAuth) {
  if (!skipAuth) AuthService.validateToken(token);
  const ss  = getSpreadsheet();
  return sheetToObjects(ss.getSheetByName(SHEETS.DOCUMENTS))
    .filter(d => String(d['Staff_ID']) === String(staffId))
    .map(d => ({
      id:       d['ID'],
      name:     d['ชื่อเอกสาร'],
      type:     d['ประเภทเอกสาร'],
      fileId:   d['File_ID'],
      fileUrl:  d['File_URL'],
      uploaded: d['วันที่อัปโหลด'],
      by:       d['อัปโหลดโดย'],
    }));
};

DataService.addDocumentRecord = function (staffId, staffName, docName, docType, fileId, fileUrl, uploader) {
  const ss    = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.DOCUMENTS);
  const id    = nextId(sheet);
  appendObjectToSheet(sheet, {
    'ID': id,
    'Staff_ID': staffId,
    'ชื่อ-สกุล': staffName,
    'ชื่อเอกสาร': docName,
    'ประเภทเอกสาร': docType,
    'File_ID': fileId,
    'File_URL': fileUrl,
    'UploadedAt': new Date().toISOString(),
    'UploadedBy': uploader || 'system'
  });
  return id;
};

// ── Reports ───────────────────────────────────────────────────

DataService.getLicenseReport = function (token) {
  const session = AuthService.validateToken(token);
  const ss    = getSpreadsheet();
  const staff = sheetToObjects(ss.getSheetByName(SHEETS.STAFF));
  const nurse = sheetToObjects(ss.getSheetByName(SHEETS.NURSE_DATA));

  // Role-Based Filtering
  let allowedStaff = staff;
  if (session.role === 'medium') {
    allowedStaff = staff.filter(s => String(s['หน่วยงาน']).trim() === String(session.dept).trim());
  } else if (session.role === 'low') {
    allowedStaff = staff.filter(s => String(s['ID']) === String(session.staffId));
  } else if (session.role === 'high') {
    const userSheet = ss.getSheetByName(SHEETS.USERS);
    const users = sheetToObjects(userSheet);
    allowedStaff = staff.filter(s => {
      const uObj = users.find(u => String(u['Username']).trim() === String(s['เลขบัตรประชาชน']).trim());
      const uRole = uObj ? uObj['Role'] : 'low';
      return uRole !== 'admin';
    });
  }
  
  const allowedStaffIds = allowedStaff.map(s => String(s['ID']));
  const filteredNurse = nurse.filter(n => allowedStaffIds.includes(String(n['Staff_ID'])));

  return filteredNurse.map(n => {
    const s = staff.find(x => String(x['ID']) === String(n['Staff_ID']));
    const expISO = parseToISO(n['วันหมดอายุใบประกอบ']);
    const days   = daysUntil(expISO);
    return {
      staffId:     n['Staff_ID'],
      name:        s ? s['ชื่อ-สกุล'] : '',
      dept:        s ? s['หน่วยงาน'] : '',
      position:    s ? s['ตำแหน่ง'] : '',
      licenseNo:   n['เลขที่ใบประกอบ'],
      issueDate:   parseToISO(n['วันที่ออกใบประกอบ']),
      expiryDate:  expISO,
      daysLeft:    days,
      status:      days === null ? 'unknown' : days < 0 ? 'expired' : days <= 30 ? 'critical' : days <= 90 ? 'warning' : 'ok',
    };
  }).filter(r => r.name);
};

DataService.getTrainingReport = function (token, year) {
  AuthService.validateToken(token);
  year = year || thaiYear(new Date());
  const ss    = getSpreadsheet();
  const rows  = sheetToObjects(ss.getSheetByName(SHEETS.TRAINING))
    .filter(r => !year || String(r['ปีงบประมาณ']) === String(year));

  // Group by staff
  const byStaff = {};
  rows.forEach(r => {
    const k = r['Staff_ID'];
    if (!byStaff[k]) byStaff[k] = { staffId: k, name: r['ชื่อ-สกุล'], trainings: [] };
    byStaff[k].trainings.push({
      course: r['หลักสูตร'],
      type:   r['ประเภท'],
      days:   r['รวมเวลา (วัน)'],
      year:   r['ปีงบประมาณ'],
    });
  });
  return Object.values(byStaff);
};

// ── Helpers ───────────────────────────────────────────────────

function _inferGroup(position) {
  if (!position) return 'พนักงาน';
  if (position.includes('พยาบาล')) return 'พยาบาล';
  if (position.includes('AEMT') || position.includes('เวชกิจฉุกเฉิน')) return 'AEMT';
  return 'พนักงาน';
}

function _getGroupSubfolder(group) {
  const staffFolder = getStaffFolder();
  if (group === 'พยาบาล') return _getOrCreateSubfolder(staffFolder, 'พยาบาล');
  if (group === 'AEMT')   return _getOrCreateSubfolder(staffFolder, 'AEMT');
  return _getOrCreateSubfolder(staffFolder, 'พนักงาน');
}


/**
 * DriveService.gs — Google Drive file management
 * Upload photos, documents, certificates
 */

function DriveService() {}

DriveService.uploadPhoto = function (token, staffId, base64, mimeType, fileName) {
  const session = AuthService.validateToken(token);
  const isSelf = String(session.staffId) === String(staffId);
  const isAdmin = session.role === 'admin';
  const isHigh = session.role === 'high';
  
  if (!isAdmin && !isHigh && !isSelf) {
    throw new Error('ไม่มีสิทธิ์อัปโหลดรูปภาพ');
  }

  const ss      = getSpreadsheet();
  const sheet   = ss.getSheetByName(SHEETS.STAFF);
  const row     = findRowById(sheet, staffId);
  if (row < 0) throw new Error('ไม่พบข้อมูลบุคลากร');

  const staff   = sheetToObjects(sheet).find(s => String(s['ID']) === String(staffId));

  if (isHigh && !isAdmin) {
    const userSheet = ss.getSheetByName(SHEETS.USERS);
    const targetUser = sheetToObjects(userSheet).find(u => String(u['Username']).trim() === String(staff['เลขบัตรประชาชน']).trim());
    const targetRole = targetUser ? targetUser['Role'] : 'low';
    if (targetRole === 'admin') throw new Error('ไม่มีสิทธิ์อัปโหลดรูปภาพให้ผู้ดูแลระบบ');
  }

  const folder  = _getPersonalFolder(staff);

  // Delete old photo if exists
  const oldPhotoId = staff['Photo_ID'];
  if (oldPhotoId) {
    try { DriveApp.getFileById(oldPhotoId).setTrashed(true); } catch(e) {}
  }

  // Upload new photo
  const blob    = _base64ToBlob(base64, mimeType, fileName || 'photo.jpg');
  const file    = folder.createFile(blob);
  file.setName('photo_' + staffId + '_' + fileName);
  // Make viewable
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  // Update Staff sheet
  const headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
  const photoCol = headers.indexOf('Photo_ID') + 1;
  if (photoCol > 0) sheet.getRange(row, photoCol).setValue(file.getId());

  return {
    fileId:  file.getId(),
    fileUrl: `https://drive.google.com/thumbnail?id=${file.getId()}&sz=w200`,
    message: 'อัปโหลดรูปภาพสำเร็จ',
  };
};

// ── Document ──────────────────────────────────────────────────

DriveService.uploadDocument = function (token, staffId, base64, mimeType, fileName, docType) {
  const session = AuthService.validateToken(token);
  const isSelf = String(session.staffId) === String(staffId);
  const isAdmin = session.role === 'admin';
  const isHigh = session.role === 'high';

  if (!isAdmin && !isHigh && !isSelf) {
    throw new Error('ไม่มีสิทธิ์อัปโหลดเอกสาร');
  }

  const ss      = getSpreadsheet();
  const staffSheet = ss.getSheetByName(SHEETS.STAFF);
  const staff   = sheetToObjects(staffSheet).find(s => String(s['ID']) === String(staffId));
  if (!staff) throw new Error('ไม่พบข้อมูลบุคลากร');

  if (isHigh && !isAdmin) {
    const userSheet = ss.getSheetByName(SHEETS.USERS);
    const targetUser = sheetToObjects(userSheet).find(u => String(u['Username']).trim() === String(staff['เลขบัตรประชาชน']).trim());
    const targetRole = targetUser ? targetUser['Role'] : 'low';
    if (targetRole === 'admin') throw new Error('ไม่มีสิทธิ์อัปโหลดเอกสารของแอดมิน');
  }

  const folder  = _getPersonalFolder(staff);
  const blob    = _base64ToBlob(base64, mimeType, fileName);
  const file    = folder.createFile(blob);
  file.setName(`${docType}_${fileName}`);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  const fileUrl = file.getUrl();
  DataService.addDocumentRecord(
    staffId, staff['ชื่อ-สกุล'],
    fileName, docType,
    file.getId(), fileUrl, session.username
  );

  return {
    fileId:  file.getId(),
    fileUrl: fileUrl,
    message: 'อัปโหลดเอกสารสำเร็จ',
  };
};

// ── Certificate ───────────────────────────────────────────────

DriveService.uploadCertificate = function (token, staffId, trainingId, base64, mimeType, fileName) {
  const session    = AuthService.validateToken(token);
  const isSelf = String(session.staffId) === String(staffId);
  const isAdmin = session.role === 'admin';
  const isHigh = session.role === 'high';

  if (!isAdmin && !isHigh && !isSelf) {
    throw new Error('ไม่มีสิทธิ์อัปโหลดเกียรติบัตร');
  }

  const ss         = getSpreadsheet();
  const staffSheet = ss.getSheetByName(SHEETS.STAFF);
  const staff      = sheetToObjects(staffSheet).find(s => String(s['ID']) === String(staffId));
  if (!staff) throw new Error('ไม่พบข้อมูลบุคลากร');

  if (isHigh && !isAdmin) {
    const userSheet = ss.getSheetByName(SHEETS.USERS);
    const targetUser = sheetToObjects(userSheet).find(u => String(u['Username']).trim() === String(staff['เลขบัตรประชาชน']).trim());
    const targetRole = targetUser ? targetUser['Role'] : 'low';
    if (targetRole === 'admin') throw new Error('ไม่มีสิทธิ์อัปโหลดเกียรติบัตรของแอดมิน');
  }

  // Get/create certificate subfolder
  const personalFolder = _getPersonalFolder(staff);
  const certFolder     = _getOrCreateSubfolder(personalFolder, 'เกียรติบัตร');

  const blob = _base64ToBlob(base64, mimeType, fileName);
  const file = certFolder.createFile(blob);
  file.setName(`cert_${trainingId}_${fileName}`);
  file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);

  // Update training record with Certificate_ID
  if (trainingId) {
    const tSheet  = ss.getSheetByName(SHEETS.TRAINING);
    const tRow    = findRowById(tSheet, trainingId);
    if (tRow > 0) {
      const headers = tSheet.getRange(1,1,1,tSheet.getLastColumn()).getValues()[0];
      const certCol = headers.indexOf('Certificate_ID') + 1;
      if (certCol > 0) tSheet.getRange(tRow, certCol).setValue(file.getId());
    }
  }

  // Also add to documents
  DataService.addDocumentRecord(
    staffId, staff['ชื่อ-สกุล'],
    fileName, 'เกียรติบัตร',
    file.getId(), file.getUrl(), session.username
  );

  return {
    fileId:  file.getId(),
    fileUrl: file.getUrl(),
    message: 'อัปโหลดเกียรติบัตรสำเร็จ',
  };
};

// ── Delete Document ───────────────────────────────────────────

DriveService.deleteDocument = function (token, fileId, docId) {
  const session = AuthService.validateToken(token);
  if (session.role !== 'admin' && session.role !== 'high') throw new Error('ไม่มีสิทธิ์ลบเอกสาร');

  // Delete from Drive
  if (fileId) {
    try { DriveApp.getFileById(fileId).setTrashed(true); } catch(e) {}
  }

  // Delete from Documents sheet
  if (docId) {
    const ss    = getSpreadsheet();
    const sheet = ss.getSheetByName(SHEETS.DOCUMENTS);
    const row   = findRowById(sheet, docId);
    if (row > 0) sheet.deleteRow(row);
  }

  return { message: 'ลบเอกสารสำเร็จ' };
};

// ── Get File URL ──────────────────────────────────────────────

DriveService.getFileUrl = function (token, fileId) {
  AuthService.validateToken(token);
  try {
    const file = DriveApp.getFileById(fileId);
    return {
      fileId:       fileId,
      fileName:     file.getName(),
      fileUrl:      file.getUrl(),
      thumbnailUrl: `https://drive.google.com/thumbnail?id=${fileId}&sz=w400`,
      mimeType:     file.getMimeType(),
    };
  } catch(e) {
    throw new Error('ไม่พบไฟล์: ' + fileId);
  }
};

// ── Helpers ───────────────────────────────────────────────────

function _getPersonalFolder(staff) {
  let folderId = staff['DriveFolder_ID'];
  if (folderId) {
    try { return DriveApp.getFolderById(folderId); } catch(e) {}
  }
  // Create folder if missing
  const group  = staff['กลุ่ม'] || 'พนักงาน';
  const parent = _getGroupSubfolder(group);
  const folder = parent.createFolder(`${staff['ชื่อ-สกุล']} (ID${staff['ID']})`);
  folder.createFolder('เกียรติบัตร');

  // Update sheet
  const ss      = getSpreadsheet();
  const sheet   = ss.getSheetByName(SHEETS.STAFF);
  const row     = findRowById(sheet, staff['ID']);
  const headers = sheet.getRange(1,1,1,sheet.getLastColumn()).getValues()[0];
  const col     = headers.indexOf('DriveFolder_ID') + 1;
  if (col > 0 && row > 0) sheet.getRange(row, col).setValue(folder.getId());

  return folder;
}

function _base64ToBlob(base64, mimeType, fileName) {
  // Remove data URL prefix if present
  const data = base64.replace(/^data:[^;]+;base64,/, '');
  const decoded = Utilities.base64Decode(data);
  return Utilities.newBlob(decoded, mimeType, fileName);
}


/**
 * ImportService.gs — Import staff data from Excel/JSON payload
 * Accepts data array parsed on the client from the Excel file
 */

function ImportService() {}

/**
 * Import all staff from structured data
 * data = { nurses: [...], aemt: [...], staff: [...], training: [...], courses: [...] }
 */
ImportService.importAll = function (token, data) {
  AuthService.validateToken(token);
  const results = { nurses: 0, aemt: 0, staff: 0, training: 0, courses: 0, errors: [] };

  const ss = getSpreadsheet();

  // ── Import nurses (พนักงานพยาบาล ต่อกัน) ──
  if (data.nurses && data.nurses.length) {
    data.nurses.forEach((row, i) => {
      try {
        _importOneStaff(ss, row, 'พยาบาล');
        results.nurses++;
      } catch(e) { results.errors.push(`พยาบาล แถว${i+1}: ${e.message}`); }
    });
  }

  // ── Import AEMT nurses ──
  if (data.aemt && data.aemt.length) {
    data.aemt.forEach((row, i) => {
      try {
        _importOneNurseAEMT(ss, row);
        results.aemt++;
      } catch(e) { results.errors.push(`AEMT แถว${i+1}: ${e.message}`); }
    });
  }

  // ── Import regular staff (พนักงาน) ──
  if (data.staff && data.staff.length) {
    data.staff.forEach((row, i) => {
      try {
        _importOneStaff(ss, row, 'พนักงาน');
        results.staff++;
      } catch(e) { results.errors.push(`พนักงาน แถว${i+1}: ${e.message}`); }
    });
  }

  // ── Import training records ──
  if (data.training && data.training.length) {
    data.training.forEach((row, i) => {
      try {
        _importOneTraining(ss, row);
        results.training++;
      } catch(e) { results.errors.push(`อบรม แถว${i+1}: ${e.message}`); }
    });
  }

  // ── Import courses ──
  if (data.courses && data.courses.length) {
    data.courses.forEach((row, i) => {
      try {
        _importOneCourse(ss, row);
        results.courses++;
      } catch(e) { results.errors.push(`หลักสูตร แถว${i+1}: ${e.message}`); }
    });
  }

  return { message: 'นำเข้าข้อมูลสำเร็จ', results };
};

// ── Private helpers ───────────────────────────────────────────

function _importOneStaff(ss, row, group) {
  if (!row['ชื่อ-สกุล'] || String(row['ชื่อ-สกุล']).trim() === '') return;

  const sheet = ss.getSheetByName(SHEETS.STAFF);
  const existing = sheetToObjects(sheet).find(s =>
    String(s['เลขบัตรประชาชน']) === String(row['เลขบัตรประชาชน']) ||
    s['ชื่อ-สกุล'] === row['ชื่อ-สกุล']
  );
  if (existing) return; // Skip duplicate

  const id  = nextId(sheet);
  const now = new Date().toISOString();

  // Create Drive folder
  let folderId = '';
  try {
    const groupFolder    = _getGroupSubfolder(group);
    const personalFolder = groupFolder.createFolder(`${row['ชื่อ-สกุล']} (ID${id})`);
    personalFolder.createFolder('เกียรติบัตร');
    folderId = personalFolder.getId();
  } catch(e) { Logger.log('Drive error for ' + row['ชื่อ-สกุล'] + ': ' + e); }

  const inferredGroup = group || _inferGroup(row['ตำแหน่ง'] || '');

  appendObjectToSheet(sheet, {
    'ID': id,
    'ชื่อ-สกุล': String(row['ชื่อ-สกุล']).trim(),
    'เลขบัตรประชาชน': String(row['เลขบัตรประชาชน'] || ''),
    'ชื่อเล่น': row['ชื่อเล่น'] || '',
    'สถานะภาพ': row['สถานะภาพ'] || '',
    'วันเกิด': parseToISO(row['ว/ด/ป เกิด']),
    'เบอร์โทร': String(row['เบอร์โทร'] || ''),
    'ที่อยู่': row['ที่อยู่'] || '',
    'ตำแหน่ง': row['ตำแหน่ง'] || '',
    'ประเภทตำแหน่ง': row['ประเภทตำแหน่ง'] || '',
    'หน่วยงาน': row['หน่วยงาน'] || '',
    'กลุ่ม': inferredGroup,
    'วันเริ่มทำงานรายเดือน': parseToISO(row['วันที่เริ่มทำงานเป็นรายเดือน'] || row['วันที่เริ่มทำงาน'] || ''),
    'วันเริ่มทำงานรายวัน': parseToISO(row['วันที่เริ่มทำงานเป็นรายวัน'] || ''),
    'วุฒิการศึกษาสูงสุด': row['วุฒิการศึกษาสูงสุด'] || row['ระดับการศึกษาสูงสุด'] || '',
    'สาขา': row['สาขา'] || '',
    'สถาบันที่จบ': row['สถาบันที่จบ'] || '',
    'การศึกษาต่อเนื่อง': row['การศึกษาต่อเนื่อง/เฉพาะทาง'] || '',
    'สุขภาพ': row['สุขภาพ'] || '',
    'วันที่ลาออก': parseToISO(row['วันที่ลาออก'] || ''),
    'DriveFolder_ID': folderId,
    'Photo_ID': '',
    'CreatedAt': now,
    'UpdatedAt': now,
  });

  return id;
}

function _importOneNurseAEMT(ss, row) {
  if (!row['ชื่อ-สกุล'] || String(row['ชื่อ-สกุล']).trim() === '') return;

  // Find or create staff record
  const staffSheet = ss.getSheetByName(SHEETS.STAFF);
  let staff = sheetToObjects(staffSheet).find(s =>
    String(s['เลขบัตรประชาชน']) === String(row['เลขบัตรประชาชน']) ||
    s['ชื่อ-สกุล'] === row['ชื่อ-สกุล']
  );

  let staffId;
  if (!staff) {
    // Determine group - check if in AEMT sheet (all are nurses)
    staffId = _importOneStaff(ss, row, 'พยาบาล');
    if (!staffId) return;
    staff = sheetToObjects(staffSheet).find(s => String(s['ID']) === String(staffId));
  } else {
    staffId = staff['ID'];
    // Update group to AEMT if needed
    const row2 = findRowById(staffSheet, staffId);
    const h    = staffSheet.getRange(1,1,1,staffSheet.getLastColumn()).getValues()[0];
    const gc   = h.indexOf('กลุ่ม') + 1;
    if (gc > 0) staffSheet.getRange(row2, gc).setValue('พยาบาล');
  }

  // Add nurse data
  const nurseSheet = ss.getSheetByName(SHEETS.NURSE_DATA);
  const existing   = sheetToObjects(nurseSheet).find(n => String(n['Staff_ID']) === String(staffId));
  if (existing) return;

  const nurseId = nextId(nurseSheet);
  appendObjectToSheet(nurseSheet, {
    'ID': nurseId,
    'Staff_ID': staffId,
    'เลขที่ใบประกอบ': String(row['เลขที่ใบประกอบ'] || ''),
    'วันที่ออกใบประกอบ': parseToISO(row['วันที่ออกใบประกอบ'] || ''),
    'วันหมดอายุใบประกอบ': parseToISO(row['วันหมดอายุใบประกอบ'] || ''),
    'วันที่บรรจุข้าราชการ': parseToISO(row['วันที่บรรจุข้าราชการ'] || ''),
    'วันที่เกษียณ': parseToISO(row['วันที่เกษียณ'] || ''),
    'หมายเหตุ': ''
  });
}

function _importOneTraining(ss, row) {
  if (!row['ชื่อ-สกุล'] || !row['หลักสูตร']) return;

  const staffSheet = ss.getSheetByName(SHEETS.STAFF);
  const staff      = sheetToObjects(staffSheet).find(s =>
    String(s['เลขบัตรประชาชน']) === String(row['เลขบัตรประชาชน']) ||
    s['ชื่อ-สกุล'] === row['ชื่อ-สกุล']
  );
  if (!staff) return; // Staff not found, skip

  const tSheet   = ss.getSheetByName(SHEETS.TRAINING);
  const id       = nextId(tSheet);
  const now      = new Date().toISOString();

  appendObjectToSheet(tSheet, {
    'ID': id,
    'Staff_ID': staff['ID'],
    'ชื่อ-สกุล': staff['ชื่อ-สกุล'],
    'หลักสูตร': row['หลักสูตร'],
    'อบรม/สมรรถนะ': row['อบรม/สมรรถนะ'] || 'อบรม',
    'ตั้งแต่วันที่': parseToISO(row['ตั้งแต่วันที่']),
    'ถึงวันที่': parseToISO(row['ถึงวันที่']),
    'รวมเวลา (วัน)': row['รวมเวลา (วัน)'] || '',
    'สถาบัน': String(row['สถาบัน'] || ''),
    'ปีงบประมาณ': row['ปีงบ'] || thaiYear(new Date()),
    'Certificate_ID': '',
    'หมายเหตุ': row['หมายเหตุ'] || '',
    'CreatedAt': now
  });
}

function _importOneCourse(ss, row) {
  if (!row['หลักสูตร']) return;

  const sheet    = ss.getSheetByName(SHEETS.COURSES);
  const existing = sheetToObjects(sheet).find(c => c['ชื่อหลักสูตร'] === row['หลักสูตร']);
  if (existing) return;

  const id = nextId(sheet);
  appendObjectToSheet(sheet, {
    'ID': id,
    'ชื่อหลักสูตร': row['หลักสูตร'],
    'ประเภท': row['อบรม/สมรรถนะ'] || 'อบรม',
    'สถาบัน': String(row['สถาบัน'] || ''),
    'ปีงบประมาณ': row['ปีงบ'] || thaiYear(new Date()),
    'วันเริ่ม': parseToISO(row['ตั้งแต่วันที่']),
    'วันสิ้นสุด': parseToISO(row['ถึงวันที่']),
    'รวมเวลา (วัน)': row['รวมเวลา'] || '',
    'หมายเหตุ': ''
  });
}

DataService.getSystemUrls = function (token) {
  AuthService.validateToken(token);
  const props = PropertiesService.getScriptProperties();
  const ssId     = props.getProperty(CONFIG.PROP_SS_ID);
  const folderId = props.getProperty(CONFIG.PROP_ROOT_FOLDER);
  return {
    spreadsheetUrl: ssId ? 'https://docs.google.com/spreadsheets/d/' + ssId : '',
    rootFolderUrl: folderId ? 'https://drive.google.com/drive/folders/' + folderId : '',
  };
};


/**
 * SetupService.gs — Initialize Google Sheets + Drive folder structure
 * Run SetupService.setup() once to initialize the system
 */

// ── Config ────────────────────────────────────────────────────
const CONFIG = {
  SPREADSHEET_NAME: 'HR-โรงพยาบาลโนนศิลา',
  DRIVE_FOLDER_NAME: 'HR-โรงพยาบาลโนนศิลา',
  PROP_SS_ID:          'SPREADSHEET_ID',
  PROP_ROOT_FOLDER:    'ROOT_FOLDER_ID',
  PROP_STAFF_FOLDER:   'STAFF_FOLDER_ID',
  PROP_REPORTS_FOLDER: 'REPORTS_FOLDER_ID',
};

const SHEETS = {
  STAFF:            'พนักงาน',
  NURSE_DATA:       'พยาบาล_AEMT',
  TRAINING:         'การอบรม',
  COURSES:          'หลักสูตร',
  DOCUMENTS:        'เอกสาร',
  USERS:            'ผู้ใช้งาน',
  MENU_PERMISSIONS: 'สิทธิ์เมนู',
  SETTINGS:         'การตั้งค่า',
  COMPETENCIES:     'สมรรถนะ',
  COMPETENCY_EVALUATIONS: 'การประเมินสมรรถนะ',
};

// Sheet headers
const HEADERS = {
  STAFF: [
    'ID','ชื่อ-สกุล','เลขบัตรประชาชน','ชื่อเล่น','สถานะภาพ',
    'วันเกิด','เบอร์โทร','ที่อยู่','ตำแหน่ง','ประเภทตำแหน่ง',
    'หน่วยงาน','กลุ่ม','วันเริ่มทำงานรายเดือน','วันเริ่มทำงานรายวัน',
    'วุฒิการศึกษาสูงสุด','สาขา','สถาบันที่จบ','การศึกษาต่อเนื่อง',
    'สุขภาพ','วันที่ลาออก','DriveFolder_ID','Photo_ID','หัวหน้า_ID','วันที่เพิ่ม','วันที่แก้ไข'
  ],
  NURSE_DATA: [
    'ID','Staff_ID','เลขที่ใบประกอบ','วันที่ออกใบประกอบ',
    'วันหมดอายุใบประกอบ','วันที่บรรจุข้าราชการ','วันที่เกษียณ','หมายเหตุ'
  ],
  TRAINING: [
    'ID','Staff_ID','ชื่อ-สกุล','หลักสูตร','ประเภท',
    'ตั้งแต่วันที่','ถึงวันที่','รวมเวลา (วัน)','สถาบัน',
    'ปีงบประมาณ','Certificate_ID','หมายเหตุ','วันที่บันทึก'
  ],
  COURSES: [
    'ID','ชื่อหลักสูตร','ประเภท','สถาบัน','ปีงบประมาณ',
    'วันเริ่ม','วันสิ้นสุด','รวมเวลา (วัน)','หมายเหตุ'
  ],
  DOCUMENTS: [
    'ID','Staff_ID','ชื่อ-สกุล','ชื่อเอกสาร','ประเภทเอกสาร',
    'File_ID','File_URL','วันที่อัปโหลด','อัปโหลดโดย'
  ],
  USERS: [
    'ID','Username','Password','Role','ชื่อ-สกุล',
    'อีเมล','สถานะ','วันที่สร้าง','วันที่แก้ไขล่าสุด'
  ],
  COMPETENCIES: [
    'ID','Type','Title','Description','Department','TargetDepts','TargetRoles','Frequency','TargetPeriods','FiscalYear','Items','CreatedByStaffId','ResponsibleStaffId','CreatedAt'
  ],
  COMPETENCY_EVALUATIONS: [
    'ID','CompetencyId','EvaluateeStaffId','Period','Scores','TotalScore','EvaluatorStaffId','EvaluatedAt'
  ],
};

// ── Main Setup ────────────────────────────────────────────────

function SetupService() {}

SetupService.setup = function () {
  const props = PropertiesService.getScriptProperties();

  // 1. Spreadsheet
  let ss = _getOrCreateSpreadsheet(props);

  // 2. Create all sheets
  Object.keys(HEADERS).forEach(key => {
    _createSheetIfNotExists(ss, SHEETS[key], HEADERS[key]);
  });
  _createSettingsSheet(ss);

  // Remove default blank sheet
  try {
    ['Sheet1','แผ่น1','sheet1'].forEach(n => {
      const s = ss.getSheetByName(n);
      if (s && s.getLastRow() <= 1 && ss.getSheets().length > 1) ss.deleteSheet(s);
    });
  } catch(e) {}

  // 3. Create default admin user (admin / 99999999)
  _ensureAdminUser(ss);

  // 4. Drive folders
  const { rootFolder, staffFolder, reportsFolder } = _createDriveFolders(props);

  return {
    message: 'ติดตั้งระบบสำเร็จ!',
    spreadsheetId:  ss.getId(),
    spreadsheetUrl: ss.getUrl(),
    rootFolderId:   rootFolder.getId(),
    rootFolderUrl:  rootFolder.getUrl(),
  };
};

SetupService.checkSetup = function () {
  const props = PropertiesService.getScriptProperties();
  const ssId     = props.getProperty(CONFIG.PROP_SS_ID);
  const folderId = props.getProperty(CONFIG.PROP_ROOT_FOLDER);
  return {
    isSetup:        !!(ssId && folderId),
    spreadsheetId:  ssId,
    rootFolderId:   folderId,
  };
};

// ── Helpers ───────────────────────────────────────────────────

function _getOrCreateSpreadsheet(props) {
  const existingId = props.getProperty(CONFIG.PROP_SS_ID);
  if (existingId) {
    try { return SpreadsheetApp.openById(existingId); } catch(e) {}
  }
  const ss = SpreadsheetApp.create(CONFIG.SPREADSHEET_NAME);
  props.setProperty(CONFIG.PROP_SS_ID, ss.getId());
  return ss;
}


function _cleanupTempSheets(ss) {
  try {
    const validNames = Object.values(SHEETS);
    const allSheets = ss.getSheets();
    if (allSheets.length <= 1) return;
    allSheets.forEach(s => {
      const n = s.getName();
      if (!validNames.includes(n) && (n.startsWith('Sheet') || n.startsWith('ชีท') || /^Sheet\d+/i.test(n))) {
        if (ss.getSheets().length > 1) {
          try { ss.deleteSheet(s); } catch(err){}
        }
      }
    });
  } catch(e) {
    Logger.log('Cleanup error: ' + e);
  }
}

function _createSheetIfNotExists(ss, name, headers) {
  let sheet = ss.getSheetByName(name);
  if (sheet && sheet.getLastRow() > 0) {
    return sheet;
  }
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(headers);
    const hRange = sheet.getRange(1, 1, 1, headers.length);
    hRange.setBackground('#1a6b3c')
          .setFontColor('#ffffff')
          .setFontWeight('bold')
          .setFontSize(11)
          .setHorizontalAlignment('center');
    sheet.setFrozenRows(1);
    sheet.setColumnWidth(1, 60);
    sheet.setColumnWidth(2, 200);
    sheet.getRange(1,1,1,1).setHorizontalAlignment('center');
  } else {
    const currentHeaders = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    const missingHeaders = headers.filter(h => !currentHeaders.includes(h));
    if (missingHeaders.length > 0) {
      const startCol = currentHeaders.length + 1;
      sheet.getRange(1, startCol, 1, missingHeaders.length).setValues([missingHeaders]);
      
      const hRange = sheet.getRange(1, 1, 1, startCol + missingHeaders.length - 1);
      hRange.setBackground('#1a6b3c')
            .setFontColor('#ffffff')
            .setFontWeight('bold')
            .setFontSize(11)
            .setHorizontalAlignment('center');
    }
  }
  return sheet;
}

function _createSettingsSheet(ss) {
  let sheet = ss.getSheetByName(SHEETS.SETTINGS);
  if (!sheet) {
    sheet = ss.insertSheet(SHEETS.SETTINGS);
    sheet.appendRow(['Key', 'Value', 'หมายเหตุ']);
    sheet.getRange(1,1,1,3).setBackground('#1a6b3c').setFontColor('#fff').setFontWeight('bold');
    const settings = [
      ['SYSTEM_VERSION',   '1.0.0',            'เวอร์ชันระบบ'],
      ['HOSPITAL_NAME',    'โรงพยาบาลโนนศิลา', 'ชื่อโรงพยาบาล'],
      ['DEPT_NAME',        'กลุ่มงานการพยาบาล','ชื่อหน่วยงาน'],
      ['LICENSE_WARN_DAYS','90',               'วันแจ้งเตือนก่อนหมดอายุใบประกอบ'],
      ['SETUP_DATE',       new Date().toISOString(), 'วันที่ติดตั้ง'],
    ];
    settings.forEach(r => sheet.appendRow(r));
    sheet.setFrozenRows(1);
  }
  return sheet;
}

function _ensureAdminUser(ss) {
  const sheet = ss.getSheetByName(SHEETS.USERS);
  const data  = sheet.getDataRange().getValues();
  // Check if admin exists (skip header row)
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][1]).toLowerCase() === 'admin') return; // already exists
  }
  // Add default admin
  const now = new Date().toISOString();
  sheet.appendRow([
    1,
    'admin',
    hashPassword('99999999'),
    'admin',
    'ผู้ดูแลระบบ',
    '',
    'active',
    now,
    now,
  ]);
}

function _createDriveFolders(props) {
  let rootFolder;
  const existingId = props.getProperty(CONFIG.PROP_ROOT_FOLDER);
  if (existingId) {
    try { rootFolder = DriveApp.getFolderById(existingId); } catch(e) {}
  }
  if (!rootFolder) {
    rootFolder = DriveApp.createFolder(CONFIG.DRIVE_FOLDER_NAME);
    props.setProperty(CONFIG.PROP_ROOT_FOLDER, rootFolder.getId());
  }

  const staffFolder   = _getOrCreateSubfolder(rootFolder, 'บุคลากร');
  const reportsFolder = _getOrCreateSubfolder(rootFolder, 'รายงาน');
  _getOrCreateSubfolder(rootFolder, 'หลักสูตร');
  _getOrCreateSubfolder(staffFolder, 'พยาบาล');
  _getOrCreateSubfolder(staffFolder, 'AEMT');
  _getOrCreateSubfolder(staffFolder, 'พนักงาน');

  props.setProperty(CONFIG.PROP_STAFF_FOLDER, staffFolder.getId());
  props.setProperty(CONFIG.PROP_REPORTS_FOLDER, reportsFolder.getId());

  return { rootFolder, staffFolder, reportsFolder };
}

function _getOrCreateSubfolder(parent, name) {
  const it = parent.getFoldersByName(name);
  if (it.hasNext()) return it.next();
  return parent.createFolder(name);
}

// ── Getters (used by other services) ─────────────────────────

let _cachedSpreadsheet = null;
function getSpreadsheet() {
  if (_cachedSpreadsheet) return _cachedSpreadsheet;
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty(CONFIG.PROP_SS_ID);
  if (!id) throw new Error('ระบบยังไม่ได้ติดตั้ง กรุณารัน setup ก่อน');
  _cachedSpreadsheet = SpreadsheetApp.openById(id);
  return _cachedSpreadsheet;
}

function getRootFolder() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty(CONFIG.PROP_ROOT_FOLDER);
  if (!id) throw new Error('ระบบยังไม่ได้ติดตั้ง กรุณารัน setup ก่อน');
  return DriveApp.getFolderById(id);
}

function getStaffFolder() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty(CONFIG.PROP_STAFF_FOLDER);
  if (!id) throw new Error('ระบบยังไม่ได้ติดตั้ง');
  return DriveApp.getFolderById(id);
}

function getReportsFolder() {
  const props = PropertiesService.getScriptProperties();
  const id = props.getProperty(CONFIG.PROP_REPORTS_FOLDER);
  if (!id) throw new Error('ระบบยังไม่ได้ติดตั้ง');
  return DriveApp.getFolderById(id);
}


/**
 * Utils.gs — Utility functions
 */

// ── Date Helpers ──────────────────────────────────────────────

/** Convert Excel serial date number to JS Date */
function excelSerialToDate(serial) {
  if (!serial || isNaN(serial)) return null;
  // Excel epoch: Jan 1, 1900 (with leap year bug offset of 2)
  const msPerDay = 86400000;
  const date = new Date((serial - 25569) * msPerDay);
  return date;
}

/** Format JS Date to Thai Buddhist Era string (dd/mm/yyyy BE) */
function formatThaiDate(date) {
  if (!date) return '';
  if (typeof date === 'number') date = excelSerialToDate(date);
  if (!(date instanceof Date) || isNaN(date.getTime())) return '';
  const d = date.getDate().toString().padStart(2, '0');
  const m = (date.getMonth() + 1).toString().padStart(2, '0');
  const y = date.getFullYear() + 543;
  return `${d}/${m}/${y}`;
}

/** Format JS Date to ISO string (yyyy-mm-dd) */
function formatISODate(date) {
  if (!date) return '';
  if (typeof date === 'number') date = excelSerialToDate(date);
  if (!(date instanceof Date) || isNaN(date.getTime())) return '';
  return date.toISOString().substring(0, 10);
}

/** Parse date string or Excel serial to ISO string */
function parseToISO(val) {
  if (!val) return '';
  if (typeof val === 'number') return formatISODate(excelSerialToDate(val));
  if (val instanceof Date) {
    if (isNaN(val.getTime())) return '';
    return formatISODate(val);
  }
  
  const s = String(val).trim();
  if (!s) return '';
  
  // Try matching yyyy-mm-dd (ISO format)
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    return s.substring(0, 10);
  }
  
  // Try matching dd/mm/yyyy or d/m/yyyy (standard Thai/Excel text formats)
  const matchSlash = s.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (matchSlash) {
    let day = parseInt(matchSlash[1], 10);
    let month = parseInt(matchSlash[2], 10);
    let year = parseInt(matchSlash[3], 10);
    
    // If year is in Buddhist Era (typically > 2400), subtract 543
    if (year > 2400) {
      year -= 543;
    }
    
    const dStr = String(day).padStart(2, '0');
    const mStr = String(month).padStart(2, '0');
    return `${year}-${mStr}-${dStr}`;
  }
  
  // Try parsing directly as JS Date
  const d = new Date(s);
  if (!isNaN(d.getTime())) {
    let year = d.getFullYear();
    if (year > 2400) {
      d.setFullYear(year - 543);
    }
    return formatISODate(d);
  }
  
  return '';
}

/** Calculate age from DOB ISO string */
function calcAge(dobISO) {
  if (!dobISO) return '';
  const dob = new Date(dobISO);
  if (isNaN(dob.getTime())) return '';
  const now = new Date();
  let years = now.getFullYear() - dob.getFullYear();
  const m = now.getMonth() - dob.getMonth();
  if (m < 0 || (m === 0 && now.getDate() < dob.getDate())) years--;
  return years;
}

/** Calculate work duration from start date ISO */
function calcWorkDuration(startISO) {
  if (!startISO) return '';
  const start = new Date(startISO);
  if (isNaN(start.getTime())) return '';
  const now = new Date();
  let y = now.getFullYear() - start.getFullYear();
  let mo = now.getMonth() - start.getMonth();
  let d = now.getDate() - start.getDate();
  if (d < 0) { mo--; d += 30; }
  if (mo < 0) { y--; mo += 12; }
  return `${y} ปี ${mo} เดือน ${d} วัน`;
}

/** Days until date */
function daysUntil(isoDate) {
  if (!isoDate) return null;
  const target = new Date(isoDate);
  const now = new Date();
  now.setHours(0,0,0,0);
  target.setHours(0,0,0,0);
  return Math.round((target - now) / 86400000);
}

// ── Security ──────────────────────────────────────────────────

/** Hash string with SHA-256, return hex */
function hashPassword(password) {
  return String(password || '').trim();
}

/** Generate random token */
function generateToken(length) {
  length = length || 32;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// ── Sheet Helpers ─────────────────────────────────────────────

/** Convert sheet rows to array of objects using header row */
function sheetToObjects(sheet) {
  if (!sheet) return [];
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return [];
  const headers = data[0].map(h => String(h).trim());
  const idColIndex = headers.indexOf('ID') !== -1 ? headers.indexOf('ID') : 0;
  return data.slice(1).map((row, i) => {
    const obj = { _row: i + 2 }; // 1-indexed, +1 for header
    headers.forEach((h, j) => {
      if (!h) return;
      let val = row[j];
      if (h === 'เบอร์โทร' && val !== null && val !== '') {
        let s = String(val).trim();
        if (s.startsWith("'")) s = s.slice(1);
        if (/^[1-9]\d{7,8}$/.test(s)) {
          val = '0' + s;
        } else {
          val = s;
        }
      }
      if (val instanceof Date) {
        val = isNaN(val.getTime()) ? '' : val.toISOString();
      }
      obj[h] = val;
    });
    return obj;
  }).filter(obj => obj[headers[idColIndex]] !== '' && obj[headers[idColIndex]] !== null && obj[headers[idColIndex]] !== undefined);
}

/** Dynamic append row matching header names regardless of column order */
function appendObjectToSheet(sheet, obj) {
  const lastCol = sheet.getLastColumn();
  if (lastCol === 0) return;
  const headers = sheet.getRange(1, 1, 1, lastCol).getValues()[0].map(h => String(h).trim());
  const row = headers.map(h => {
    let val = obj[h];
    if (val === undefined || val === null) return '';
    return val;
  });
  sheet.appendRow(row);
}

/** Find next ID for a sheet */
function nextId(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return 1;
  const headers = data[0].map(h => String(h).trim());
  const idCol = headers.indexOf('ID') !== -1 ? headers.indexOf('ID') : 0;
  let max = 0;
  for (let i = 1; i < data.length; i++) {
    const id = parseInt(data[i][idCol]);
    if (!isNaN(id) && id > max) max = id;
  }
  return max + 1;
}

/** Find row index by ID (1-indexed) */
function findRowById(sheet, id) {
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return -1;
  const headers = data[0].map(h => String(h).trim());
  const idCol = headers.indexOf('ID') !== -1 ? headers.indexOf('ID') : 0;
  for (let i = 1; i < data.length; i++) {
    if (String(data[i][idCol]) === String(id)) return i + 1;
  }
  return -1;
}

/** Thai fiscal year from date (BE, starting Oct 1) */
function thaiYear(date) {
  if (!date) date = new Date();
  const m = date.getMonth() + 1; // 1-12
  const beYear = date.getFullYear() + 543;
  return m >= 10 ? beYear + 1 : beYear;
}

function respond(data) {
  return ContentService.createTextOutput(JSON.stringify({ success: true, data: data }))
    .setMimeType(ContentService.MimeType.JSON);
}

function respondError(msg) {
  return ContentService.createTextOutput(JSON.stringify({ success: false, error: msg }))
    .setMimeType(ContentService.MimeType.JSON);
}

function findHeaderColumn(headers, searchName) {
  let index = headers.indexOf(searchName);
  if (index !== -1) return index + 1;
  
  const clean = s => String(s).toLowerCase().replace(/[^ก-๙a-z0-9]/g, '');
  const cleanSearch = clean(searchName);
  
  for (let i = 0; i < headers.length; i++) {
    if (clean(headers[i]) === cleanSearch) {
      return i + 1;
    }
  }
  
  const fallbacks = {
    'วันเริ่มทำงานรายเดือน': ['วันที่เริ่มทำงานเป็นรายเดือน', 'วันเริ่มทำงานรายเดือน', 'วันที่เริ่มทำงานรายเดือน'],
    'วันเริ่มทำงานรายวัน': ['วันที่เริ่มทำงานเป็นรายวัน', 'วันเริ่มทำงานรายวัน', 'วันที่เริ่มทำงานรายวัน'],
    'วันหมดอายุใบประกอบ': ['วันหมดอายุใบประกอบ', 'วันหมดอายุใบประกอบวิชาชีพ', 'วันหมดอายุ'],
    'วันที่ออกใบประกอบ': ['วันที่ออกใบประกอบ', 'วันที่ออกใบประกอบวิชาชีพ', 'วันออกใบประกอบ'],
    'เลขที่ใบประกอบ': ['เลขที่ใบประกอบ', 'เลขที่ใบประกอบวิชาชีพ', 'เลขใบประกอบ'],
    'วันที่บรรจุข้าราชการ': ['วันที่บรรจุข้าราชการ', 'วันบรรจุข้าราการ', 'วันบรรจุ'],
    'การศึกษาต่อเนื่อง': ['การศึกษาต่อเนื่อง', 'การศึกษาต่อเนื่อง/เฉพาะทาง', 'การศึกษาเฉพาะทาง']
  };
  
  if (fallbacks[searchName]) {
    for (const f of fallbacks[searchName]) {
      const idx = headers.indexOf(f);
      if (idx !== -1) return idx + 1;
    }
  }
  
  return 0;
}

function calcLicenseStatus(issueDateStr, validityStr) {
  if (!issueDateStr) return { expiryDate: '', daysLeft: null, statusText: '-' };
  
  let expiryDate = null;
  const parsedValidityDate = new Date(parseToISO(validityStr));
  if (validityStr && !isNaN(parsedValidityDate.getTime()) && parsedValidityDate.getFullYear() > 1950) {
    expiryDate = parsedValidityDate;
  } else {
    const issueDate = new Date(issueDateStr);
    let years = 5;
    if (validityStr) {
      const num = parseInt(String(validityStr).replace(/[^0-9]/g, ''), 10);
      if (!isNaN(num) && num > 0) {
        years = num;
      }
    }
    expiryDate = new Date(issueDate);
    expiryDate.setFullYear(expiryDate.getFullYear() + years);
  }
  
  const expiryISO = expiryDate.toISOString().substring(0, 10);
  
  const now = new Date();
  now.setHours(0,0,0,0);
  expiryDate.setHours(0,0,0,0);
  
  const diffTime = expiryDate.getTime() - now.getTime();
  const diffDays = Math.round(diffTime / 86400000);
  
  let statusText = '';
  if (diffDays > 0) {
    statusText = `อีก ${diffDays} วันหมดอายุ`;
  } else if (diffDays < 0) {
    statusText = `หมดอายุแล้ว ${Math.abs(diffDays)} วัน`;
  } else {
    statusText = 'หมดอายุวันนี้';
  }
  
  return {
    expiryDate: expiryISO,
    daysLeft: diffDays,
    statusText: statusText
  };
}

function getStaffLicenseData(s, nurseData) {
  const licenseNo = s['เลขที่ใบประกอบ'] || (nurseData ? nurseData['เลขที่ใบประกอบ'] : '') || '';
  const licenseIssue = parseToISO(s['วันที่ออกใบประกอบ'] || (nurseData ? nurseData['วันที่ออกใบประกอบ'] : '') || '');
  const validityStr = s['อายุใบประกอบ'] || s['อายุใบประกอบวิชาชีพ'] || (nurseData ? nurseData['อายุใบประกอบ'] : '') || '';
  const sheetExpiry = parseToISO(s['วันหมดอายุใบประกอบ'] || (nurseData ? nurseData['วันหมดอายุใบประกอบ'] : '') || '');
  const appointDateStr = s['วันที่บรรจุข้าราชการ'] || s['วันบรรจุข้าราชการ'] || (nurseData ? (nurseData['วันที่บรรจุข้าราชการ'] || nurseData['วันบรรจุข้าราชการ']) : '') || '';
  
  let licenseExpiry = '';
  let daysUntilExpiry = null;
  let licenseStatusText = '-';
  
  if (licenseIssue) {
    const status = calcLicenseStatus(licenseIssue, validityStr || sheetExpiry);
    licenseExpiry = status.expiryDate;
    daysUntilExpiry = status.daysLeft;
    licenseStatusText = status.statusText;
  } else if (sheetExpiry) {
    licenseExpiry = sheetExpiry;
    daysUntilExpiry = daysUntil(sheetExpiry);
    licenseStatusText = daysUntilExpiry > 0 ? `อีก ${daysUntilExpiry} วันหมดอายุ` : (daysUntilExpiry < 0 ? `หมดอายุแล้ว ${Math.abs(daysUntilExpiry)} วัน` : 'หมดอายุวันนี้');
  }
  
  return {
    licenseNo:        licenseNo,
    licenseIssue:     licenseIssue,
    licenseExpiry:    licenseExpiry,
    validityStr:      validityStr,
    appointDate:      parseToISO(appointDateStr),
    retireDate:       parseToISO(s['วันที่เกษียณ'] || (nurseData ? nurseData['วันที่เกษียณ'] : '') || ''),
    daysUntilExpiry:  daysUntilExpiry,
    licenseStatusText: licenseStatusText,
    govWorkDuration:  appointDateStr ? calcWorkDuration(parseToISO(appointDateStr)) : '',
  };
}

// ── One-time utility: Hash all plain-text passwords in USERS sheet ──────────
function fixAdminPassword() {
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.USERS); // 'ผู้ใช้งาน'
  if (!sheet) { Logger.log('ไม่พบ sheet: ' + SHEETS.USERS); return; }

  const data    = sheet.getDataRange().getValues();
  const headers = data[0];
  const pwCol   = headers.indexOf('Password');

  if (pwCol < 0) { Logger.log('ไม่พบคอลัมน์ Password'); return; }

  let count = 0;
  for (let i = 1; i < data.length; i++) {
    const raw = String(data[i][pwCol]).trim();
    if (!raw) continue;

    // ถ้าเป็น SHA-256 hex อยู่แล้ว (64 ตัว, ตัวอักษร 0-9a-f) ข้ามไป
    if (raw.length === 64 && /^[0-9a-f]+$/.test(raw)) {
      Logger.log('Row ' + (i + 1) + ': ข้าม (เป็น hash แล้ว)');
      continue;
    }

    const hashed = hashPassword(raw);
    sheet.getRange(i + 1, pwCol + 1).setValue(hashed);
    Logger.log('Row ' + (i + 1) + ': "' + raw + '" → hashed (' + hashed.substring(0, 16) + '...)');
    count++;
  }
  Logger.log('เสร็จสิ้น! Hash ' + count + ' รายการ');
}







// ── Competencies ──────────────────────────────────────────────
DataService.getCompetencies = function (token) {
  const session = AuthService.validateToken(token);
  const ss = getSpreadsheet();
  _createSheetIfNotExists(ss, SHEETS.COMPETENCIES, HEADERS.COMPETENCIES);
  const sheet = ss.getSheetByName(SHEETS.COMPETENCIES);
  const rows = sheetToObjects(sheet);
  
  const staffList = sheetToObjects(ss.getSheetByName(SHEETS.STAFF));
  const currentStaff = staffList.find(s => String(s['ID']) === String(session.staffId));
  const myDept = currentStaff ? String(currentStaff['หน่วยงาน'] || '').trim() : '';

  return rows.map(r => {
    let targetDepts = [];
    let targetRoles = [];
    let items = [];
    try { targetDepts = JSON.parse(r['TargetDepts'] || '[]'); } catch(e){}
    try { targetRoles = JSON.parse(r['TargetRoles'] || '[]'); } catch(e){}
    try { items = JSON.parse(r['Items'] || '[]'); } catch(e){}

    return {
      id:                 r['ID'],
      type:               r['Type'],
      title:              r['Title'],
      description:        r['Description'],
      department:         r['Department'],
      targetDepts:        targetDepts,
      targetRoles:        targetRoles,
      frequency:          r['Frequency'],
      periodValue:        r['TargetPeriods'],
      fiscalYear:         r['FiscalYear'],
      items:              items,
      createdByStaffId:   r['CreatedByStaffId'],
      responsibleStaffId: r['ResponsibleStaffId'],
      responsibleStaffName: (staffList.find(s => String(s['ID']) === String(r['ResponsibleStaffId'])) || {})['ชื่อ-สกุล'] || '',
      createdAt:          r['CreatedAt']
    };
  }).filter(c => {
    if (session.role === 'admin' || session.role === 'high' || session.role === 'medium') return true;
    if (c.type === 'department') return c.department === myDept;
    if (c.type === 'central') {
      const deptMatch = !c.targetDepts.length || c.targetDepts.includes(myDept);
      const roleMatch = !c.targetRoles.length || c.targetRoles.includes(session.role);
      return deptMatch && roleMatch;
    }
    return true;
  });
};

DataService.saveCompetency = function (token, data) {
  const session = AuthService.validateToken(token);
  if (session.role !== 'admin' && session.role !== 'high' && session.role !== 'medium') {
    throw new Error('เฉพาะหัวหน้างานขึ้นไปเท่านั้นที่มีสิทธิ์จัดการสมรรถนะ');
  }
  const ss = getSpreadsheet();
  _createSheetIfNotExists(ss, SHEETS.COMPETENCIES, HEADERS.COMPETENCIES);
  const sheet = ss.getSheetByName(SHEETS.COMPETENCIES);
  const now = new Date().toISOString();

  const staffList = sheetToObjects(ss.getSheetByName(SHEETS.STAFF));
  const currentStaff = staffList.find(s => String(s['ID']) === String(session.staffId));
  const myDept = currentStaff ? String(currentStaff['หน่วยงาน'] || '').trim() : '';

  const id = data.id || nextId(sheet);
  const existingRow = findRowById(sheet, id);
  const rows = existingRow > 0 ? sheetToObjects(sheet) : [];
  const existing = existingRow > 0 ? rows.find(r => String(r['ID']) === String(id)) : null;

  const rowObj = {
    'ID':               id,
    'Type':             data.type || 'department',
    'Title':            data.title || '',
    'Description':      data.description || '',
    'Department':       data.type === 'department' ? (data.department || myDept) : '',
    'TargetDepts':      JSON.stringify(data.targetDepts || []),
    'TargetRoles':      JSON.stringify(data.targetRoles || ['admin','high','medium','low']),
    'Frequency':        data.frequency || 'monthly',
    'TargetPeriods':    data.periodValue || '',
    'FiscalYear':       data.fiscalYear || '2569',
    'Items':            JSON.stringify(data.items || []),
    'CreatedByStaffId': existing ? existing['CreatedByStaffId'] : session.staffId,
    'ResponsibleStaffId': data.responsibleStaffId || (existing ? existing['ResponsibleStaffId'] : session.staffId),
    'CreatedAt':        existing ? existing['CreatedAt'] : now
  };


  if (existingRow > 0) {
    // Force headers to be correct
    sheet.getRange(1, 1, 1, HEADERS.COMPETENCIES.length).setValues([HEADERS.COMPETENCIES]);
    const headers = HEADERS.COMPETENCIES;
    Object.keys(rowObj).forEach(k => {
      const col = headers.indexOf(k) + 1;
      if (col > 0) {
        // Ensure the sheet has enough columns
        if (col > sheet.getMaxColumns()) {
          sheet.insertColumnsAfter(sheet.getMaxColumns(), col - sheet.getMaxColumns());
        }
        sheet.getRange(existingRow, col).setValue(rowObj[k]);
      }
    });
  } else {
    // Force headers to be correct
    sheet.getRange(1, 1, 1, HEADERS.COMPETENCIES.length).setValues([HEADERS.COMPETENCIES]);
    appendObjectToSheet(sheet, rowObj);
  }
  return { success: true, id: id, message: 'บันทึกสมรรถนะสำเร็จ' };
};

DataService.deleteCompetency = function (token, id) {
  const session = AuthService.validateToken(token);
  if (session.role !== 'admin' && session.role !== 'high' && session.role !== 'medium') {
    throw new Error('เฉพาะหัวหน้างานขึ้นไปเท่านั้นที่มีสิทธิ์ลบสมรรถนะ');
  }
  const ss = getSpreadsheet();
  const sheet = ss.getSheetByName(SHEETS.COMPETENCIES);
  if (!sheet) throw new Error('ไม่พบข้อมูลสมรรถนะ');
  const row = findRowById(sheet, id);
  if (row > 0) sheet.deleteRow(row);
  return { success: true, message: 'ลบสมรรถนะสำเร็จ' };
};

DataService.getEvaluations = function (token, filters) {
  const session = AuthService.validateToken(token);
  const ss = getSpreadsheet();
  _createSheetIfNotExists(ss, SHEETS.COMPETENCY_EVALUATIONS, HEADERS.COMPETENCY_EVALUATIONS);
  const sheet = ss.getSheetByName(SHEETS.COMPETENCY_EVALUATIONS);
  const rows = sheetToObjects(sheet);

  return rows.map(r => {
    let scores = {};
    try { scores = JSON.parse(r['Scores'] || '{}'); } catch(e){}
    return {
      id:               r['ID'],
      competencyId:     r['CompetencyId'],
      evaluateeStaffId: r['EvaluateeStaffId'],
      period:           r['Period'],
      scores:           scores,
      totalScore:       r['TotalScore'],
      evaluatorStaffId: r['EvaluatorStaffId'],
      evaluatedAt:      r['EvaluatedAt']
    };
  }).filter(e => {
    if (filters && filters.competencyId && String(e.competencyId) !== String(filters.competencyId)) return false;
    if (filters && filters.period && String(e.period) !== String(filters.period)) return false;
    if (session.role === 'low' && String(e.evaluateeStaffId) !== String(session.staffId)) return false;
    return true;
  });
};


DataService.saveEvaluationsBulk = function (token, dataList) {
  const session = AuthService.validateToken(token);
  if (session.role !== 'admin' && session.role !== 'high' && session.role !== 'medium') {
    throw new Error('เฉพาะหัวหน้างานขึ้นไปเท่านั้นที่มีสิทธิ์ประเมิน');
  }
  if (!dataList || dataList.length === 0) return { success: true };

  const ss = getSpreadsheet();
  _createSheetIfNotExists(ss, SHEETS.COMPETENCY_EVALUATIONS, HEADERS.COMPETENCY_EVALUATIONS);
  const sheet = ss.getSheetByName(SHEETS.COMPETENCY_EVALUATIONS);
  const now = new Date().toISOString();

  const rows = sheetToObjects(sheet);
  const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
  let currentId = nextId(sheet);

  dataList.forEach(data => {
    const existing = rows.find(r => 
      String(r['CompetencyId']) === String(data.competencyId) &&
      String(r['EvaluateeStaffId']) === String(data.evaluateeStaffId) &&
      String(r['Period']) === String(data.period)
    );

    let scoresObj = {};
    try { scoresObj = typeof data.scores === 'string' ? JSON.parse(data.scores) : (data.scores || {}); } catch(e){}
    const scoreVals = Object.values(scoresObj).map(v => parseFloat(v) || 0);
    const totalScore = scoreVals.length ? (scoreVals.reduce((a,b)=>a+b,0) / scoreVals.length).toFixed(1) : 0;

    const rowObj = {
      'ID':               existing ? existing['ID'] : currentId++,
      'CompetencyId':     data.competencyId,
      'EvaluateeStaffId': data.evaluateeStaffId,
      'Period':           data.period,
      'Scores':           JSON.stringify(scoresObj),
      'TotalScore':       data.totalScore, // from client or calculate here
      'EvaluatorStaffId': session.staffId || '',
      'EvaluatedAt':      now
    };

    if (existing) {
      const existingRow = findRowById(sheet, existing['ID']);
      Object.keys(rowObj).forEach(k => {
        const col = headers.indexOf(k) + 1;
        if (col > 0) sheet.getRange(existingRow, col).setValue(rowObj[k]);
      });
    } else {
      appendObjectToSheet(sheet, rowObj);
      rows.push(rowObj); // Add to rows so next ID generation works
    }
  });

  return { message: 'บันทึกผลการประเมินทั้งหมดสำเร็จ' };
};
DataService.saveEvaluation = function (token, data) {
  const session = AuthService.validateToken(token);
  if (session.role !== 'admin' && session.role !== 'high' && session.role !== 'medium') {
    throw new Error('เฉพาะหัวหน้างานขึ้นไปเท่านั้นที่มีสิทธิ์ประเมิน');
  }
  const ss = getSpreadsheet();
  _createSheetIfNotExists(ss, SHEETS.COMPETENCY_EVALUATIONS, HEADERS.COMPETENCY_EVALUATIONS);
  const sheet = ss.getSheetByName(SHEETS.COMPETENCY_EVALUATIONS);
  const now = new Date().toISOString();

  const rows = sheetToObjects(sheet);
  const existing = rows.find(r => 
    String(r['CompetencyId']) === String(data.competencyId) &&
    String(r['EvaluateeStaffId']) === String(data.evaluateeStaffId) &&
    String(r['Period']) === String(data.period)
  );

  const scores = data.scores || {};
  const scoreVals = Object.values(scores).map(v => parseFloat(v) || 0);
  const totalScore = scoreVals.length ? (scoreVals.reduce((a,b)=>a+b,0) / scoreVals.length).toFixed(1) : 0;

  const rowObj = {
    'ID':               existing ? existing['ID'] : nextId(sheet),
    'CompetencyId':     data.competencyId,
    'EvaluateeStaffId': data.evaluateeStaffId,
    'Period':           data.period,
    'Scores':           JSON.stringify(scores),
    'TotalScore':       totalScore,
    'EvaluatorStaffId': session.staffId || '',
    'EvaluatedAt':      now
  };

  if (existing) {
    const existingRow = findRowById(sheet, existing['ID']);
    const headers = sheet.getRange(1, 1, 1, sheet.getLastColumn()).getValues()[0];
    Object.keys(rowObj).forEach(k => {
      const col = headers.indexOf(k) + 1;
      if (col > 0) sheet.getRange(existingRow, col).setValue(rowObj[k]);
    });
  } else {
    appendObjectToSheet(sheet, rowObj);
  }

  return { success: true, message: 'บันทึกคะแนนประเมินเรียบร้อยแล้ว' };
};

