const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();
const ok = (r, d) => r.json({ success: true, data: d, _ts: Date.now() });
const fail = (r, m) => r.json({ success: false, error: m, _ts: Date.now() });

router.post('/getCompetencies', async (req, res) => {
  try {
    const snap = await db.collection('competencies').limit(500).get();
    return ok(res, snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (e) { return fail(res, e.message); }
});

router.post('/saveCompetency', async (req, res) => {
  try {
    const { data } = req.body;
    if (data.id) {
      await db.collection('competencies').doc(data.id).set(data, { merge: true });
      return ok(res, { id: data.id, message: 'บันทึกสมรรถนะสำเร็จ' });
    }
    const ref = await db.collection('competencies').add({ ...data, createdAt: new Date().toISOString() });
    return ok(res, { id: ref.id, message: 'บันทึกสมรรถนะสำเร็จ' });
  } catch (e) { return fail(res, e.message); }
});

router.post('/deleteCompetency', async (req, res) => {
  try {
    await db.collection('competencies').doc(req.body.id).delete();
    return ok(res, { message: 'ลบสมรรถนะสำเร็จ' });
  } catch (e) { return fail(res, e.message); }
});

router.post('/getEvaluations', async (req, res) => {
  try {
    let query = db.collection('evaluations');
    const { filters = {} } = req.body;
    if (filters.competencyId) query = query.where('competencyId', '==', filters.competencyId);
    if (filters.period) query = query.where('period', '==', filters.period);
    if (req.user.role === 'low') query = query.where('evaluateeStaffId', '==', req.user.staffId);
    const snap = await query.limit(500).get();
    return ok(res, snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (e) { return fail(res, e.message); }
});

router.post('/saveEvaluation', async (req, res) => {
  try {
    const { data } = req.body;
    const snap = await db.collection('evaluations')
      .where('competencyId', '==', data.competencyId)
      .where('evaluateeStaffId', '==', data.evaluateeStaffId)
      .where('period', '==', data.period).limit(1).get();
    if (!snap.empty) {
      await db.collection('evaluations').doc(snap.docs[0].id).update(data);
    } else {
      await db.collection('evaluations').add({ ...data, evaluatedAt: new Date().toISOString() });
    }
    return ok(res, { message: 'บันทึกคะแนนประเมินเรียบร้อยแล้ว' });
  } catch (e) { return fail(res, e.message); }
});

router.post('/saveEvaluationsBulk', async (req, res) => {
  try {
    const { dataList } = req.body;
    for (const data of dataList) {
      const snap = await db.collection('evaluations')
        .where('competencyId', '==', data.competencyId)
        .where('evaluateeStaffId', '==', data.evaluateeStaffId)
        .where('period', '==', data.period).limit(1).get();
      if (!snap.empty) await db.collection('evaluations').doc(snap.docs[0].id).update(data);
      else await db.collection('evaluations').add({ ...data, evaluatedAt: new Date().toISOString() });
    }
    return ok(res, { message: 'บันทึกผลการประเมินทั้งหมดสำเร็จ' });
  } catch (e) { return fail(res, e.message); }
});

router.post('/cleanupExtraSheets', async (req, res) => ok(res, { message: 'OK' }));

module.exports = router;