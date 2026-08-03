const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();
const ok = (res, data) => res.json({ success: true, data, _ts: Date.now() });
const fail = (res, msg) => res.json({ success: false, error: msg, _ts: Date.now() });

router.post('/getCourseList', async (req, res) => {
  try {
    const snap = await db.collection('courses').limit(500).get();
    return ok(res, snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (e) { return fail(res, e.message); }
});

router.post('/addCourse', async (req, res) => {
  try {
    const { data } = req.body;
    const ref = await db.collection('courses').add({ ...data, createdAt: new Date().toISOString() });
    return ok(res, { id: ref.id, message: 'เพิ่มหลักสูตรสำเร็จ' });
  } catch (e) { return fail(res, e.message); }
});

router.post('/updateCourse', async (req, res) => {
  try { await db.collection('courses').doc(req.body.id).update(req.body.data); return ok(res, { message: 'แก้ไขสำเร็จ' }); }
  catch (e) { return fail(res, e.message); }
});

router.post('/deleteCourse', async (req, res) => {
  try { await db.collection('courses').doc(req.body.id).delete(); return ok(res, { message: 'ลบสำเร็จ' }); }
  catch (e) { return fail(res, e.message); }
});

module.exports = router;