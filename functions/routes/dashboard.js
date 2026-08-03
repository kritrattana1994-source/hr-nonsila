const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();

const ok = (res, data) => res.json({ success: true, data, _ts: Date.now() });
const fail = (res, msg) => res.json({ success: false, error: msg, _ts: Date.now() });

// ── Dashboard Stats ──
router.post('/getDashboardData', async (req, res) => {
  try {
    const user = req.user;
    let staffQuery = db.collection('staff').where('resignDate', '==', '');

    if (user.role === 'medium' || user.role === 'low') {
      staffQuery = staffQuery.where('dept', '==', user.dept || '');
    } else if (user.role === 'high') {
      const adminUsers = await db.collection('users').where('role', '==', 'admin').select('staffId').get();
      const excludeIds = adminUsers.docs.map(d => d.data().staffId).filter(Boolean);
      if (excludeIds.length > 0) staffQuery = staffQuery.where(admin.firestore.FieldPath.documentId(), 'not-in', excludeIds.slice(0, 10));
    }

    const staffSnap = await staffQuery.limit(1000).get();
    const staff = staffSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const byDept = {}, byType = {}, byGroup = {}, byEducation = {};
    const byAgeRange = { 'ต่ำกว่า 30 ปี': 0, '30 - 39 ปี': 0, '40 - 49 ปี': 0, '50 - 59 ปี': 0, '60 ปีขึ้นไป': 0 };
    const byTenureRange = { 'ต่ำกว่า 1 ปี': 0, '1 - 5 ปี': 0, '5 - 10 ปี': 0, '10 - 20 ปี': 0, '20 ปีขึ้นไป': 0 };
    const retiringSoon = [];

    const now = new Date();
    const currentYear = now.getFullYear() + 543;

    staff.forEach(s => {
      byDept[s.dept || 'ไม่ระบุ'] = (byDept[s.dept || 'ไม่ระบุ'] || 0) + 1;
      byType[s.empType || 'ไม่ระบุ'] = (byType[s.empType || 'ไม่ระบุ'] || 0) + 1;
      let g = s.group || s.empType || 'ไม่ระบุ';
      byGroup[g] = (byGroup[g] || 0) + 1;
      byEducation[s.education || 'ไม่ระบุ'] = (byEducation[s.education || 'ไม่ระบุ'] || 0) + 1;
      if (s.dob) {
        const age = now.getFullYear() - new Date(s.dob).getFullYear();
        if (age < 30) byAgeRange['ต่ำกว่า 30 ปี']++;
        else if (age <= 39) byAgeRange['30 - 39 ปี']++;
        else if (age <= 49) byAgeRange['40 - 49 ปี']++;
        else if (age <= 59) byAgeRange['50 - 59 ปี']++;
        else byAgeRange['60 ปีขึ้นไป']++;
        if (age >= 58) retiringSoon.push({ id: s.id, name: s.name, age, position: s.position, dept: s.dept });
      }
      if (s.startMonthly || s.startDaily) {
        const startDate = new Date(s.startMonthly || s.startDaily);
        const years = now.getFullYear() - startDate.getFullYear();
        if (years < 1) byTenureRange['ต่ำกว่า 1 ปี']++;
        else if (years <= 5) byTenureRange['1 - 5 ปี']++;
        else if (years <= 10) byTenureRange['5 - 10 ปี']++;
        else if (years <= 20) byTenureRange['10 - 20 ปี']++;
        else byTenureRange['20 ปีขึ้นไป']++;
      }
    });

    // Nurse Data
    const nurseSnap = await db.collection('nurseData').limit(500).get();
    const nurseMap = {};
    nurseSnap.docs.forEach(d => { nurseMap[d.data().staffId] = d.data(); });

    const licenseAlerts = [];
    staff.forEach(s => {
      const nd = nurseMap[s.id];
      if (nd && nd.licenseExpiry) {
        const exp = new Date(nd.licenseExpiry);
        const daysLeft = Math.round((exp - now) / 86400000);
        if (daysLeft <= 90) {
          licenseAlerts.push({
            staffId: s.id, name: s.name, expDate: nd.licenseExpiry,
            daysLeft, status: daysLeft < 0 ? 'expired' : daysLeft <= 30 ? 'critical' : 'warning'
          });
        }
      }
    });

    // Training this year
    const trainingSnap = await db.collection('training')
      .where('year', '==', String(currentYear)).limit(500).get();
    const training = trainingSnap.docs.map(d => d.data());
    const trainedIds = new Set();
    let totalDays = 0;
    training.forEach(t => { trainedIds.add(t.staffId); totalDays += parseFloat(t.days) || 0; });
    const coverage = staff.length ? Math.round((trainedIds.size / staff.length) * 100) : 0;

    return ok(res, {
      totalStaff: staff.length, byDept, byType, byGroup, byEducation,
      byAgeRange, byTenureRange, licenseAlerts,
      trainingCount: training.length, totalTrainingDays: totalDays, trainingCoverage: coverage,
      retiringSoon: retiringSoon.sort((a, b) => b.age - a.age),
      birthdaysThisMonth: [], birthdaysNextMonth: [],
      currentYear, updatedAt: now.toISOString(), isSetup: true
    });
  } catch (e) { return fail(res, e.message); }
});

module.exports = router;