const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();
const auth = admin.auth();

// ── Login ────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.json({ success: false, error: 'กรุณากรอกชื่อผู้ใช้และรหัสผ่าน' });
    }

    // Look up user in Firestore users collection
    const usersSnapshot = await db.collection('users')
      .where('username', '==', username.toLowerCase().trim())
      .where('status', '==', 'active')
      .limit(1)
      .get();

    let userDoc = null;
    if (!usersSnapshot.empty) {
      userDoc = usersSnapshot.docs[0];
      // Verify password (plain text for migration - use Firebase Auth later)
      const userData = userDoc.data();
      if (userData.password !== password && userData.password !== String(password).trim()) {
        return res.json({ success: false, error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
      }
    } else if (username.toLowerCase() === 'admin' && password === 'admin') {
      // Fallback default admin
      const adminSnapshot = await db.collection('users').where('username', '==', 'admin').limit(1).get();
      if (!adminSnapshot.empty) {
        userDoc = adminSnapshot.docs[0];
      } else {
        // Create default admin
        const adminRef = await db.collection('users').add({
          username: 'admin',
          password: '99999999',
          role: 'admin',
          name: 'ผู้ดูแลระบบ (Admin)',
          email: '',
          status: 'active',
          createdAt: new Date().toISOString()
        });
        userDoc = await adminRef.get();
      }
    }

    if (!userDoc) {
      // Try staff collection
      const staffSnapshot = await db.collection('staff')
        .where('idCard', '==', username)
        .limit(1)
        .get();

      if (!staffSnapshot.empty) {
        const staffDoc = staffSnapshot.docs[0];
        const staffData = staffDoc.data();
        if (staffData.resignDate) {
          return res.json({ success: false, error: 'บัญชีนี้ถูกระงับเนื่องจากพ้นสภาพการเป็นพนักงานแล้ว' });
        }

        // Check/create user record
        const userSnap = await db.collection('users')
          .where('username', '==', staffData.idCard)
          .limit(1)
          .get();

        if (!userSnap.empty) {
          userDoc = userSnap.docs[0];
        } else {
          // Create user from staff
          const newUser = await db.collection('users').add({
            username: staffData.idCard,
            password: staffData.phone || '',
            role: 'low',
            name: staffData.name,
            email: '',
            status: 'active',
            dept: staffData.dept || '',
            staffId: staffDoc.id,
            createdAt: new Date().toISOString()
          });
          userDoc = await newUser.get();
        }
      }
    }

    if (!userDoc) {
      return res.json({ success: false, error: 'ชื่อผู้ใช้หรือรหัสผ่านไม่ถูกต้อง' });
    }

    const userData = userDoc.data();

    // Create Firebase custom token
    const customToken = await auth.createCustomToken(userDoc.id, {
      role: userData.role || 'low',
      name: userData.name || '',
      dept: userData.dept || '',
      staffId: userData.staffId || null
    });

    return res.json({
      success: true,
      data: {
        token: customToken,
        user: {
          id: userDoc.id,
          username: userData.username,
          role: userData.role || 'low',
          name: userData.name || 'ผู้ใช้งาน',
          dept: userData.dept || '',
          staffId: userData.staffId || null
        }
      },
      _ts: Date.now()
    });
  } catch (e) {
    console.error('Login error:', e);
    return res.json({ success: false, error: e.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ' });
  }
});

// ── Logout ────────────────────────────────────────────────
router.post('/logout', async (req, res) => {
  return res.json({ success: true, data: { ok: true }, _ts: Date.now() });
});

module.exports = router;