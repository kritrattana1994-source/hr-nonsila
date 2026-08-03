const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();
const ok = (res, data) => res.json({ success: true, data, _ts: Date.now() });
const fail = (res, msg) => res.json({ success: false, error: msg, _ts: Date.now() });

router.post('/getTrainingByStaff', async (req, res) => {
  try {
    const { staffId } = req.body;
    const snap = await db.collection('training').where('staffId', '==', staffId).limit(200).get();
    return ok(res, snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (e) { return fail(res, e.message); }
});

router.post('/getAllTraining', async (req, res) => {
  try {
    const { filters = {} } = req.body;
    const user = req.user;
    let query = db.collection('training');
    if (user.role === 'low') query = query.where('staffId', '==', user.staffId);
    else if (user.role === 'medium') {
      const staffSnap = await db.collection('staff').where('dept', '==', user.dept).select(admin.firestore.FieldPath.documentId()).get();
      const ids = staffSnap.docs.map(d => d.id);
      if (ids.length) query = query.where('staffId', 'in', ids.slice(0, 10));
    }
    if (filters.year) query = query.where('year', '==', String(filters.year));
    const snap = await query.limit(500).get();
    let data = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    if (filters.type) data = data.filter(t => t.type === filters.type);
    if (filters.course) data = data.filter(t => (t.course || '').includes(filters.course));
    return ok(res, data);
  } catch (e) { return fail(res, e.message); }
});

router.post('/addTraining', async (req, res) => {
  try {
    const { data } = req.body;
    const ref = await db.collection('training').add({ ...data, createdAt: new Date().toISOString() });
    return ok(res, { id: ref.id, message: 'บันทึกการอบรมสำเร็จ' });
  } catch (e) { return fail(res, e.message); }
});

router.post('/updateTraining', async (req, res) => {
  try {
    await db.collection('training').doc(req.body.id).update(req.body.data);
    return ok(res, { message: 'แก้ไขสำเร็จ' });
  } catch (e) { return fail(res, e.message); }
});

router.post('/deleteTraining', async (req, res) => {
  try {
    await db.collection('training').doc(req.body.id).delete();
    return ok(res, { message: 'ลบสำเร็จ' });
  } catch (e) { return fail(res, e.message); }
});

module.exports = router;