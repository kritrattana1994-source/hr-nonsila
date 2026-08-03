const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

async function ok(res, data) { return res.json({ success: true, data, _ts: Date.now() }); }
async function fail(res, msg) { return res.json({ success: false, error: msg, _ts: Date.now() }); }

// ── Get Staff List ──
router.post('/getStaffList', async (req, res) => {
  try {
    const { filters = {} } = req.body;
    const user = req.user;
    let query = db.collection('staff');

    if (user.role === 'medium') query = query.where('dept', '==', user.dept || '');
    else if (user.role === 'low') query = query.where(admin.firestore.FieldPath.documentId(), '==', user.staffId || '');
    else if (user.role === 'high') {
      const adminUsers = await db.collection('users').where('role', '==', 'admin').select('staffId').get();
      const excludeIds = adminUsers.docs.map(d => d.data().staffId).filter(Boolean);
      if (excludeIds.length > 0) query = query.where(admin.firestore.FieldPath.documentId(), 'not-in', excludeIds.slice(0, 10));
    }
    if (filters.status === 'resigned') query = query.where('resignDate', '!=', '');
    else if (!filters.status || filters.status === 'active') query = query.where('resignDate', '==', '');
    if (filters.dept) query = query.where('dept', '==', filters.dept);
    if (filters.group) query = query.where('group', '==', filters.group);
    if (filters.type) query = query.where('empType', '==', filters.type);

    const snapshot = await query.limit(500).get();
    let staff = snapshot.docs.map(doc => {
      const s = doc.data();
      const isResigned = !!(s.resignDate && String(s.resignDate).trim() !== '');
      return {
        id: doc.id, name: s.name || '', nickname: s.nickname || '',
        position: s.position || '', type: s.empType || '', dept: s.dept || '',
        group: s.group || '', phone: s.phone || '', photoId: s.photoId || '',
        managerId: s.managerId || '', rank: s.rank || '',
        startDate: s.startMonthly || s.startDaily || '',
        isResigned, resignDate: isResigned ? String(s.resignDate) : '', systemRole: 'low'
      };
    });
    if (filters.search) {
      const q = filters.search.toLowerCase();
      staff = staff.filter(s => s.name.toLowerCase().includes(q) || (s.nickname || '').toLowerCase().includes(q) || s.position.toLowerCase().includes(q) || s.id.includes(q));
    }
    return ok(res, staff);
  } catch (e) { return fail(res, e.message); }
});

// ── Get Single Staff ──
router.post('/getStaff', async (req, res) => {
  try {
    const { id } = req.body;
    const doc = await db.collection('staff').doc(id).get();
    if (!doc.exists) return fail(res, 'ไม่พบข้อมูลบุคลากร');
    const s = doc.data();
    const user = req.user;
    if (user.role === 'low' && String(id) !== String(user.staffId)) return fail(res, 'ไม่มีสิทธิ์');
    if (user.role === 'medium' && (s.dept || '') !== user.dept) return fail(res, 'ไม่มีสิทธิ์');
    const nurseSnap = await db.collection('nurseData').where('staffId', '==', id).limit(1).get();
    const nurseData = nurseSnap.empty ? null : nurseSnap.docs[0].data();
    const trSnap = await db.collection('training').where('staffId', '==', id).limit(100).get();
    const training = trSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const docSnap = await db.collection('documents').where('staffId', '==', id).limit(50).get();
    const documents = docSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    return ok(res, {
      id: doc.id, name: s.name, idCard: s.idCard, nickname: s.nickname,
      maritalStatus: s.maritalStatus, dob: s.dob,
      phone: s.phone, address: s.address, position: s.position,
      empType: s.empType, dept: s.dept, group: s.group,
      startMonthly: s.startMonthly, startDaily: s.startDaily,
      education: s.education, major: s.major, university: s.university,
      contEdu: s.contEdu, health: s.health,
      resignDate: s.resignDate, photoId: s.photoId, managerId: s.managerId,
      nurseData, training, documents
    });
  } catch (e) { return fail(res, e.message); }
});

// ── Add / Update / Delete ──
router.post('/addStaff', async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'high') return fail(res, 'ไม่มีสิทธิ์');
    const d = req.body.data || {};
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
    if (d.idCard && d.phone) {
      const uSnap = await db.collection('users').where('username', '==', d.idCard).limit(1).get();
      if (uSnap.empty) {
        await db.collection('users').add({
          username: d.idCard, password: String(d.phone).trim().replace(/[- ']/g, ''),
          role: 'low', name: d.name, email: '', status: 'active',
          dept: d.dept || '', staffId: ref.id, createdAt: new Date().toISOString()
        });
      }
    }
    return ok(res, { id: ref.id, message: 'เพิ่มบุคลากรสำเร็จ' });
  } catch (e) { return fail(res, e.message); }
});

router.post('/updateStaff', async (req, res) => {
  try {
    const { id, data } = req.body;
    const user = req.user;
    const isSelf = String(user.staffId) === String(id);
    if (!isSelf && user.role !== 'admin' && user.role !== 'high') return fail(res, 'ไม่มีสิทธิ์');
    if (user.role === 'low') { delete data.position; delete data.empType; delete data.dept; delete data.group; delete data.managerId; }
    await db.collection('staff').doc(id).update({ ...data, updatedAt: new Date().toISOString() });
    return ok(res, { message: 'แก้ไขข้อมูลสำเร็จ' });
  } catch (e) { return fail(res, e.message); }
});

router.post('/deleteStaff', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return fail(res, 'ไม่มีสิทธิ์');
    await db.collection('staff').doc(req.body.id).delete();
    return ok(res, { message: 'ลบข้อมูลสำเร็จ' });
  } catch (e) { return fail(res, e.message); }
});

// ── Resign / Cancel ──
router.post('/resignStaff', async (req, res) => {
  try {
    const u = req.user;
    if (u.role !== 'admin' && u.role !== 'high') return fail(res, 'ไม่มีสิทธิ์');
    const { staffId, resignDate } = req.body;
    await db.collection('staff').doc(staffId).update({ resignDate: resignDate || new Date().toISOString().substring(0, 10) });
    const usersSnap = await db.collection('users').where('staffId', '==', staffId).limit(1).get();
    usersSnap.docs.forEach(async d => { await db.collection('users').doc(d.id).update({ status: 'disabled' }); });
    return ok(res, { message: 'บันทึกการลาออกเรียบร้อยแล้ว' });
  } catch (e) { return fail(res, e.message); }
});

router.post('/cancelResignation', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return fail(res, 'เฉพาะ admin เท่านั้น');
    const { staffId } = req.body;
    await db.collection('staff').doc(staffId).update({ resignDate: '' });
    const usersSnap = await db.collection('users').where('staffId', '==', staffId).limit(1).get();
    usersSnap.docs.forEach(async d => { await db.collection('users').doc(d.id).update({ status: 'active' }); });
    return ok(res, { message: 'ยกเลิกการลาออกและคืนสถานะเรียบร้อยแล้ว' });
  } catch (e) { return fail(res, e.message); }
});

// ── Departments ──
router.post('/getAllDepartments', async (req, res) => {
  try {
    const snapshot = await db.collection('staff').select('dept').get();
    const depts = new Set();
    snapshot.docs.forEach(d => { const v = d.data().dept; if (v) depts.add(String(v).trim()); });
    return ok(res, [...depts].filter(d => d).sort());
  } catch (e) { return fail(res, e.message); }
});

// ── Public ──
router.getDepartmentsPublic = async (req, res) => {
  try {
    const snapshot = await db.collection('staff').select('dept').get();
    const depts = new Set();
    snapshot.docs.forEach(d => { const v = d.data().dept; if (v) depts.add(String(v).trim()); });
    return ok(res, [...depts].filter(d => d).sort());
  } catch (e) { return fail(res, e.message); }
};

router.getStaffListPublic = async (req, res) => {
  try {
    const snapshot = await db.collection('staff').where('resignDate', '==', '').select('name', 'position').limit(500).get();
    return ok(res, snapshot.docs.map(d => ({ id: d.id, name: d.data().name, position: d.data().position || '' })));
  } catch (e) { return fail(res, e.message); }
};

router.post('/getSystemUrls', async (req, res) => {
  return ok(res, { spreadsheetUrl: '', rootFolderUrl: '' });
});

module.exports = router;