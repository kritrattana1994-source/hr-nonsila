const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();
const ok = (r, d) => r.json({ success: true, data: d, _ts: Date.now() });
const fail = (r, m) => r.json({ success: false, error: m, _ts: Date.now() });

router.post('/importAll', async (req, res) => {
  try {
    const { data } = req.body;
    const results = { nurses: 0, aemt: 0, staff: 0, training: 0, courses: 0, errors: [] };
    const now = new Date().toISOString();

    // Import staff
    const importStaff = async (rows, group) => {
      for (const row of (rows || [])) {
        if (!row['ชื่อ-สกุล'] || !String(row['ชื่อ-สกุล']).trim()) continue;
        const snap = await db.collection('staff')
          .where('idCard', '==', String(row['เลขบัตรประชาชน'] || ''))
          .where('name', '==', String(row['ชื่อ-สกุล']).trim()).limit(1).get();
        if (!snap.empty) continue;
        await db.collection('staff').add({
          name: String(row['ชื่อ-สกุล']).trim(), idCard: String(row['เลขบัตรประชาชน'] || ''),
          nickname: row['ชื่อเล่น'] || '', maritalStatus: row['สถานะภาพ'] || '',
          dob: (row['ว/ด/ป เกิด'] || '').includes('/') ? row['ว/ด/ป เกิด'].split('/').reverse().join('-') : row['ว/ด/ป เกิด'] || '',
          phone: String(row['เบอร์โทร'] || ''), address: row['ที่อยู่'] || '',
          position: row['ตำแหน่ง'] || '', empType: row['ประเภทตำแหน่ง'] || '',
          dept: row['หน่วยงาน'] || '', group: group || 'พนักงาน',
          startMonthly: row['วันที่เริ่มทำงานเป็นรายเดือน'] || '', startDaily: row['วันที่เริ่มทำงานเป็นรายวัน'] || '',
          education: row['วุฒิการศึกษาสูงสุด'] || '', major: row['สาขา'] || '',
          university: row['สถาบันที่จบ'] || '', contEdu: row['การศึกษาต่อเนื่อง/เฉพาะทาง'] || '',
          health: row['สุขภาพ'] || '', resignDate: '', photoId: '', managerId: '',
          createdAt: now, updatedAt: now
        });
        if (group === 'พยาบาล') results.nurses++;
        else if (group === 'AEMT') results.aemt++;
        else results.staff++;
      }
    };

    await importStaff(data.nurses, 'พยาบาล');
    await importStaff(data.aemt, 'AEMT');
    await importStaff(data.staff, 'พนักงาน');

    // Import training
    for (const row of (data.training || [])) {
      await db.collection('training').add({
        course: row['หลักสูตร'] || '', type: row['อบรม/สมรรถนะ'] || 'อบรม',
        startDate: row['ตั้งแต่วันที่'] || '', endDate: row['ถึงวันที่'] || '',
        days: row['รวมเวลา (วัน)'] || '', institution: String(row['สถาบัน'] || ''),
        year: row['ปีงบ'] || String(new Date().getFullYear() + 543),
        staffName: row['ชื่อ-สกุล'] || '', staffId: '', createdAt: now
      });
      results.training++;
    }

    // Import courses
    for (const row of (data.courses || [])) {
      await db.collection('courses').add({
        name: row['หลักสูตร'] || '', type: row['อบรม/สมรรถนะ'] || 'อบรม',
        institution: String(row['สถาบัน'] || ''), year: row['ปีงบ'] || '',
        startDate: row['ตั้งแต่วันที่'] || '', endDate: row['ถึงวันที่'] || '',
        days: row['รวมเวลา'] || '', createdAt: now
      });
      results.courses++;
    }

    return ok(res, { message: 'นำเข้าข้อมูลสำเร็จ', results });
  } catch (e) { return fail(res, e.message); }
});

module.exports = router;