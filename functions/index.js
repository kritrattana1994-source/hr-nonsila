const { onRequest } = require('firebase-functions/v2/https');
const express = require('express');
const cors = require('cors');
const admin = require('firebase-admin');

admin.initializeApp();
const auth = admin.auth();
const db = admin.firestore();

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '50mb' }));

// ── Lazy route loader ──
const _routes = {};
function _r(name) {
  if (!_routes[name]) _routes[name] = require('./routes/' + name);
  return _routes[name];
}

// ── Token validation ──
async function _auth(token) {
  if (!token) return null;
  try {
    const d = await auth.verifyIdToken(token);
    return { uid: d.uid, email: d.email || '', role: d.role || 'low', name: d.name || '', dept: d.dept || '', staffId: d.staffId || null };
  } catch (e) { return null; }
}

// Helper: forward request to a router with path rewrite
function _forward(router, req, res, action) {
  req.url = '/' + action;
  req.method = 'POST';
  router(req, res);
}

// ── Ping ──
app.post('/ping', (req, res) => {
  res.json({ success: true, data: { ok: true, time: new Date().toISOString(), serverTime: Date.now() }, _ts: Date.now() });
});

// ── GAS-compatible dispatch ──
app.post('/', async (req, res) => {
  try {
    const { action, token, ...params } = req.body;
    if (!action) return res.status(400).json({ success: false, error: 'Missing action' });

    const user = await _auth(token);
    const ok = (data) => res.json({ success: true, data, _ts: Date.now() });
    const fail = (msg) => res.json({ success: false, error: msg, _ts: Date.now() });

    if (user) {
      req.user = user;
      req.body = { ...params, token };
    } else {
      req.body = { ...params, token };
    }

    const chkAuth = () => { if (!user) throw new Error('ไม่ได้เข้าสู่ระบบ'); return user; };

    switch (action) {
      case 'ping': return ok({ ok: true, time: new Date().toISOString(), serverTime: Date.now() });
      case 'checkSetup': return ok({ isSetup: true });
      case 'logout': return ok({ ok: true });

      // ── Auth ──
      case 'login': return _r('auth')(req, res);  // router handles POST /login

      // ── Public staff ──
      case 'getStaffListPublic': {
        const snap = await db.collection('staff').where('resignDate', '==', '').select('name', 'position').limit(500).get();
        return ok(snap.docs.map(d => ({ id: d.id, name: d.data().name, position: d.data().position || '' })));
      }
      case 'getDepartmentsPublic': {
        const snap = await db.collection('staff').select('dept').get();
        const depts = new Set();
        snap.docs.forEach(d => { const v = d.data().dept; if (v) depts.add(String(v).trim()); });
        return ok([...depts].filter(d => d).sort());
      }
      case 'registerStaffPublic': {
        // addStaff without auth
        const d = params.data || {};
        const ref = await db.collection('staff').add({
          name: d.name || '', idCard: d.idCard || '', nickname: d.nickname || '',
          maritalStatus: d.maritalStatus || '', dob: d.dob || '', phone: d.phone || '',
          address: d.address || '', position: d.position || '', empType: d.empType || '',
          dept: d.dept || '', group: d.group || '', startMonthly: d.startMonthly || '',
          startDaily: d.startDaily || '', education: d.education || '', major: d.major || '',
          university: d.university || '', contEdu: d.contEdu || '', health: d.health || '',
          resignDate: '', photoId: '', managerId: d.managerId || '',
          createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
        });
        return ok({ id: ref.id, message: 'ลงทะเบียนสำเร็จ' });
      }

      // ── Dashboard ──
      case 'getDashboardData': { chkAuth(); req.url = '/' + action; return _r('dashboard')(req, res); }

      // ── Staff ──
      case 'getStaffList': case 'getStaff': case 'addStaff': case 'updateStaff':
      case 'deleteStaff': case 'resignStaff': case 'cancelResignation':
      case 'getAllDepartments': case 'getSystemUrls': case 'getNurseData': case 'saveNurseData': {
        chkAuth(); req.url = '/' + action; return _r('staff')(req, res);
      }

      // ── Training ──
      case 'getTrainingByStaff': case 'getAllTraining': case 'addTraining':
      case 'updateTraining': case 'deleteTraining': {
        chkAuth(); req.url = '/' + action; return _r('training')(req, res);
      }

      // ── Courses ──
      case 'getCourseList': case 'addCourse': case 'updateCourse': case 'deleteCourse': {
        chkAuth(); req.url = '/' + action; return _r('courses')(req, res);
      }

      // ── Competencies ──
      case 'cleanupExtraSheets': case 'getCompetencies': case 'saveCompetency':
      case 'deleteCompetency': case 'getEvaluations': case 'saveEvaluation':
      case 'saveEvaluationsBulk': {
        chkAuth(); req.url = '/' + action; return _r('competencies')(req, res);
      }

      // ── Users ──
      case 'getUserList': case 'getStaffWithRoles': case 'setUserRole':
      case 'createAccountsForAllStaff': case 'addUser': case 'updateUser':
      case 'deleteUser': case 'changePassword': {
        chkAuth(); req.url = '/' + action; return _r('users')(req, res);
      }

      // ── Menu ──
      case 'getMenuPermissions': case 'updateMenuPermissions': {
        chkAuth(); req.url = '/' + action; return _r('menu')(req, res);
      }

      // ── Files ──
      case 'uploadPhoto': case 'uploadDocument': case 'uploadCertificate':
      case 'getFileUrl': case 'deleteDocument': case 'getDocuments': {
        chkAuth(); req.url = '/' + action; return _r('files')(req, res);
      }

      // ── Reports ──
      case 'getLicenseReport': case 'getTrainingReport': {
        chkAuth(); req.url = '/' + action; return _r('reports')(req, res);
      }

      // ── Import ──
      case 'importAll': {
        chkAuth(); req.url = '/importAll'; return _r('import')(req, res);
      }

      default: return fail('Unknown action: ' + action);
    }
  } catch (e) {
    console.error('Dispatch error:', e);
    return res.json({ success: false, error: e.message || String(e), _ts: Date.now() });
  }
});

exports.api = onRequest({ timeoutSeconds: 540, memory: '512MiB', maxInstances: 10, concurrency: 80 }, app);