const express = require('express');
const router = express.Router();
const admin = require('firebase-admin');
const db = admin.firestore();
const storage = admin.storage().bucket();
const ok = (r, d) => r.json({ success: true, data: d, _ts: Date.now() });
const fail = (r, m) => r.json({ success: false, error: m, _ts: Date.now() });

function base64ToBuffer(b64) {
  const data = b64.replace(/^data:[^;]+;base64,/, '');
  return Buffer.from(data, 'base64');
}

// Upload photo
router.post('/uploadPhoto', async (req, res) => {
  try {
    const { staffId, base64, mimeType, fileName } = req.body;
    const file = storage.file(`photos/${staffId}/${fileName || 'photo.jpg'}`);
    await file.save(base64ToBuffer(base64), { contentType: mimeType || 'image/jpeg' });
    const [url] = await file.getSignedUrl({ action: 'read', expires: '03-09-2030' });
    await db.collection('staff').doc(staffId).update({ photoId: url.split('?')[0], photoUrl: url });
    return ok(res, { fileUrl: url, message: 'อัปโหลดรูปภาพสำเร็จ' });
  } catch (e) { return fail(res, e.message); }
});

// Upload document
router.post('/uploadDocument', async (req, res) => {
  try {
    const { staffId, base64, mimeType, fileName, docType } = req.body;
    const path = `documents/${staffId}/${docType}/${fileName}`;
    const file = storage.file(path);
    await file.save(base64ToBuffer(base64), { contentType: mimeType });
    const [url] = await file.getSignedUrl({ action: 'read', expires: '03-09-2030' });
    await db.collection('documents').add({
      staffId, name: fileName, type: docType, fileUrl: url,
      uploadedAt: new Date().toISOString(), uploadedBy: req.user.name || 'system'
    });
    return ok(res, { fileUrl: url, message: 'อัปโหลดเอกสารสำเร็จ' });
  } catch (e) { return fail(res, e.message); }
});

// Upload certificate
router.post('/uploadCertificate', async (req, res) => {
  try {
    const { staffId, trainingId, base64, mimeType, fileName } = req.body;
    const path = `certificates/${staffId}/${fileName}`;
    const file = storage.file(path);
    await file.save(base64ToBuffer(base64), { contentType: mimeType });
    const [url] = await file.getSignedUrl({ action: 'read', expires: '03-09-2030' });
    if (trainingId) await db.collection('training').doc(trainingId).update({ certUrl: url });
    await db.collection('documents').add({
      staffId, name: fileName, type: 'เกียรติบัตร', fileUrl: url,
      uploadedAt: new Date().toISOString(), uploadedBy: req.user.name || 'system'
    });
    return ok(res, { fileUrl: url, message: 'อัปโหลดเกียรติบัตรสำเร็จ' });
  } catch (e) { return fail(res, e.message); }
});

// Get/Del file URL
router.post('/getFileUrl', async (req, res) => {
  try {
    const [url] = await storage.file(req.body.fileId).getSignedUrl({ action: 'read', expires: '03-09-2030' });
    return ok(res, { fileUrl: url });
  } catch (e) { return fail(res, e.message); }
});

router.post('/deleteDocument', async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'high') return fail(res, 'ไม่มีสิทธิ์');
    const { fileId, docId } = req.body;
    if (fileId) {
      try { await storage.file(decodeURIComponent(fileId)).delete(); } catch (e) { /* already deleted */ }
    }
    if (docId) await db.collection('documents').doc(docId).delete();
    return ok(res, { message: 'ลบเอกสารสำเร็จ' });
  } catch (e) { return fail(res, e.message); }
});

// Get documents for staff
router.post('/getDocuments', async (req, res) => {
  try {
    const { staffId } = req.body;
    const snap = await db.collection('documents').where('staffId', '==', staffId).limit(100).get();
    return ok(res, snap.docs.map(d => ({ id: d.id, ...d.data() })));
  } catch (e) { return fail(res, e.message); }
});

module.exports = router;