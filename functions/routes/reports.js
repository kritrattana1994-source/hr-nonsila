const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();
const ok = (r, d) => r.json({ success: true, data: d, _ts: Date.now() });
const fail = (r, m) => r.json({ success: false, error: m, _ts: Date.now() });

router.post('/getLicenseReport', async (req, res) => {
  try {
    const user = req.user;
    let staffQuery = db.collection('staff');
    if (user.role === 'medium') staffQuery = staffQuery.where('dept', '==', user.dept);
    else if (user.role === 'low') staffQuery = staffQuery.where(admin.firestore.FieldPath.documentId(), '==', user.staffId);
    const staffSnap = await staffQuery.limit(500).get();
    const staffMap = {};
    staffSnap.docs.forEach(d => { staffMap[d.id] = { id: d.id, ...d.data() }; });

    const nurseSnap = await db.collection('nurseData').limit(500).get();
    const result = nurseSnap.docs.map(d => {
      const n = d.data();
      const s = staffMap[n.staffId];
      if (!s) return null;
      const exp = n.licenseExpiry ? new Date(n.licenseExpiry) : null;
      const daysLeft = exp ? Math.round((exp - new Date()) / 86400000) : null;
      return {
        staffId: n.staffId, name: s.name, dept: s.dept, position: s.position,
        licenseNo: n.licenseNo, issueDate: n.licenseIssue, expiryDate: n.licenseExpiry,
        daysLeft, status: daysLeft === null ? 'unknown' : daysLeft < 0 ? 'expired' : daysLeft <= 30 ? 'critical' : daysLeft <= 90 ? 'warning' : 'ok'
      };
    }).filter(Boolean);
    return ok(res, result);
  } catch (e) { return fail(res, e.message); }
});

router.post('/getTrainingReport', async (req, res) => {
  try {
    const { year } = req.body;
    let query = db.collection('training');
    if (year) query = query.where('year', '==', String(year));
    const snap = await query.limit(500).get();
    const byStaff = {};
    snap.docs.forEach(d => {
      const t = d.data();
      if (!byStaff[t.staffId]) byStaff[t.staffId] = { staffId: t.staffId, name: t.staffName || '', trainings: [] };
      byStaff[t.staffId].trainings.push({ course: t.course, type: t.type, days: t.days, year: t.year });
    });
    return ok(res, Object.values(byStaff));
  } catch (e) { return fail(res, e.message); }
});

module.exports = router;