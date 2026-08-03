const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();
const ok = (r, d) => r.json({ success: true, data: d, _ts: Date.now() });
const fail = (r, m) => r.json({ success: false, error: m, _ts: Date.now() });

const DEFAULT_MENU = [
  { menuId: 'dashboard', menuName: 'หน้าแรก (Dashboard)', category: 'เมนูหลัก', admin: true, high: true, medium: true, low: true },
  { menuId: 'staffList', menuName: 'รายชื่อบุคลากร', category: 'เมนูหลัก', admin: true, high: true, medium: true, low: true },
  { menuId: 'onboarding', menuName: 'รับพนักงานใหม่', category: 'การจัดการ', admin: true, high: true, medium: false, low: false },
  { menuId: 'competencies', menuName: 'สมรรถนะบุคลากร', category: 'การจัดการ', admin: true, high: true, medium: true, low: true },
  { menuId: 'users', menuName: 'จัดการผู้ใช้งาน', category: 'ผู้ดูแลระบบ', admin: true, high: false, medium: false, low: false },
  { menuId: 'import', menuName: 'นำเข้าข้อมูล', category: 'ผู้ดูแลระบบ', admin: true, high: false, medium: false, low: false },
  { menuId: 'sheetLink', menuName: 'Google Sheet', category: 'ลิงก์ภายนอก', admin: true, high: false, medium: false, low: false },
  { menuId: 'driveLink', menuName: 'ที่เก็บไฟล์ Drive', category: 'ลิงก์ภายนอก', admin: true, high: false, medium: false, low: false }
];

router.post('/getMenuPermissions', async (req, res) => {
  try {
    const snap = await db.collection('menuPermissions').limit(50).get();
    if (snap.empty) {
      for (const m of DEFAULT_MENU) await db.collection('menuPermissions').add(m);
      return ok(res, DEFAULT_MENU);
    }
    return ok(res, snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (e) { return fail(res, e.message); }
});

router.post('/updateMenuPermissions', async (req, res) => {
  try {
    if (req.user.role !== 'admin') return fail(res, 'เฉพาะ admin');
    const { menuList } = req.body;
    const batch = db.batch();
    const snap = await db.collection('menuPermissions').get();
    snap.docs.forEach(d => batch.delete(d.ref));
    menuList.forEach(m => {
      const ref = db.collection('menuPermissions').doc();
      batch.set(ref, m);
    });
    await batch.commit();
    return ok(res, { message: 'บันทึกสิทธิ์เมนูเรียบร้อยแล้ว' });
  } catch (e) { return fail(res, e.message); }
});

module.exports = router;