const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();
const ok = (r, d) => r.json({ success: true, data: d, _ts: Date.now() });
const fail = (r, m) => r.json({ success: false, error: m, _ts: Date.now() });

router.post('/getUserList', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return fail(res, 'เฉพาะ admin เท่านั้น');
    const snap = await db.collection('users').limit(500).get();
    return ok(res, snap.docs.map(d => {
      const u = d.data();
      return { id: d.id, username: u.username, role: u.role || 'low', name: u.name, email: u.email || '', status: u.status || 'active', created: u.createdAt || '' };
    }));
  } catch (e) { return fail(res, e.message); }
});

router.post('/getStaffWithRoles', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return fail(res, 'เฉพาะ admin เท่านั้น');
    const [staffSnap, usersSnap] = await Promise.all([
      db.collection('staff').where('resignDate', '==', '').limit(500).get(),
      db.collection('users').limit(500).get()
    ]);
    const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const userMap = new Map(users.map(u => [u.staffId, u]));
    return ok(res, staffSnap.docs.map(d => {
      const s = d.data();
      const u = userMap.get(d.id);
      return {
        staffId: d.id, name: s.name, position: s.position, dept: s.dept,
        idCard: s.idCard || '', hasAccount: !!u, userId: u ? u.id : null,
        username: u ? u.username : (s.idCard || ''), role: u ? u.role : 'none',
        status: u ? u.status : ''
      };
    }));
  } catch (e) { return fail(res, e.message); }
});

router.post('/setUserRole', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return fail(res, 'เฉพาะ admin เท่านั้น');
    const { staffId, role } = req.body;
    const snap = await db.collection('users').where('staffId', '==', staffId).limit(1).get();
    if (!snap.empty) {
      await db.collection('users').doc(snap.docs[0].id).update({ role });
    } else {
      const sDoc = await db.collection('staff').doc(staffId).get();
      if (!sDoc.exists) return fail(res, 'ไม่พบพนักงาน');
      const s = sDoc.data();
      await db.collection('users').add({
        username: s.idCard || '', password: s.phone || '', role, name: s.name,
        email: '', status: 'active', dept: s.dept || '', staffId,
        createdAt: new Date().toISOString()
      });
    }
    return ok(res, { message: 'อัปเดตสิทธิ์สำเร็จ' });
  } catch (e) { return fail(res, e.message); }
});

router.post('/createAccountsForAllStaff', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return fail(res, 'เฉพาะ admin เท่านั้น');
    const [staffSnap, usersSnap] = await Promise.all([
      db.collection('staff').where('resignDate', '==', '').limit(500).get(),
      db.collection('users').limit(500).get()
    ]);
    const existingStaffIds = new Set(usersSnap.docs.map(d => d.data().staffId).filter(Boolean));
    let count = 0;
    for (const doc of staffSnap.docs) {
      if (existingStaffIds.has(doc.id)) continue;
      const s = doc.data();
      await db.collection('users').add({
        username: s.idCard || '', password: String(s.phone || '').replace(/[- ']/g, ''),
        role: 'low', name: s.name, email: '', status: 'active',
        dept: s.dept || '', staffId: doc.id, createdAt: new Date().toISOString()
      });
      count++;
    }
    return ok(res, { message: 'สร้างบัญชีใหม่ ' + count + ' บัญชี' });
  } catch (e) { return fail(res, e.message); }
});

router.post('/addUser', async (req, res) => {
  try { if (req.user.role !== 'admin') return fail(res, 'เฉพาะ admin'); const r = await db.collection('users').add({ ...req.body.data, createdAt: new Date().toISOString() }); return ok(res, { id: r.id }); }
  catch (e) { return fail(res, e.message); }
});
router.post('/updateUser', async (req, res) => {
  try { if (req.user.role !== 'admin') return fail(res, 'เฉพาะ admin'); await db.collection('users').doc(req.body.id).update(req.body.data); return ok(res, { message: 'แก้ไขสำเร็จ' }); }
  catch (e) { return fail(res, e.message); }
});
router.post('/deleteUser', async (req, res) => {
  try { if (req.user.role !== 'admin') return fail(res, 'เฉพาะ admin'); await db.collection('users').doc(req.body.id).delete(); return ok(res, { message: 'ลบสำเร็จ' }); }
  catch (e) { return fail(res, e.message); }
});
router.post('/changePassword', async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body;
    const doc = await db.collection('users').doc(req.user.uid).get();
    if (!doc.exists) return fail(res, 'ไม่พบบัญชี');
    if (doc.data().password !== oldPassword) return fail(res, 'รหัสผ่านเดิมไม่ถูกต้อง');
    await db.collection('users').doc(req.user.uid).update({ password: newPassword });
    return ok(res, { message: 'เปลี่ยนรหัสผ่านสำเร็จ' });
  } catch (e) { return fail(res, e.message); }
});

module.exports = router;