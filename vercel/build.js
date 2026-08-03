const fs = require('fs');
const path = require('path');

const baseDir = path.resolve(__dirname, '..');
console.log('Base dir:', baseDir);

const indexContent = fs.readFileSync(path.join(baseDir, 'Index.html'), 'utf8');
const chartjs = fs.readFileSync(path.join(baseDir, 'ChartJS.html'), 'utf8');
const styles = fs.readFileSync(path.join(baseDir, 'Styles.html'), 'utf8');
const javascript = fs.readFileSync(path.join(baseDir, 'JavaScript.html'), 'utf8');
const competencies = fs.readFileSync(path.join(baseDir, 'CompetenciesJS.html'), 'utf8');

let result = indexContent;
result = result.replace("<?!= include('ChartJS'); ?>", chartjs.trim());
result = result.replace("<?!= include('Styles'); ?>", styles.trim());
result = result.replace("<?!= include('JavaScript'); ?>", javascript.trim());
result = result.replace("<?!= include('CompetenciesJS'); ?>", competencies.trim());

const gasUrl = 'https://script.google.com/macros/s/AKfycbzVb68jA2o8DpzvuQ8cFbSkPr3PCzXWt0KxplKP2D--R8LG6g2QmtDWW2xLX2xngUSc/exec';
const now = new Date();
const versionStr = `${now.getFullYear()+543}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}.${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;

// Find the api function block - support both old single-function and new _apiOnce+api pattern
let oldBlock = '';
let startIdx = -1;
let endIdx = -1;

// Try new pattern first (_apiOnce + api)
const newPatternStart = 'function _apiOnce(action, params) {';
const newPatternStartAlt = 'function api(action, params={}) {';
const blockEnd = 'window.api = api;';

startIdx = result.indexOf(newPatternStart);
if (startIdx === -1) startIdx = result.indexOf(newPatternStartAlt);
endIdx = result.indexOf(blockEnd, startIdx);

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find api function block!');
  process.exit(1);
}

oldBlock = result.substring(startIdx, endIdx + blockEnd.length);

const newApi = `function api(action, params={}) {
  return new Promise((resolve, reject) => {
    const url = '${gasUrl}';
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, token: State.token, ...params })
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Server error: ' + response.status);
      }
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        return response.text().then(html => {
          console.error('Server returned HTML:', html.substring(0, 200));
          throw new Error('เซิร์ฟเวอร์คืนค่า HTML แทน JSON — อาจเกิดจาก CORS หรือ URL ไม่ถูกต้อง');
        });
      }
      return response.text();
    })
    .then(text => {
      if (!text || !text.trim()) {
        throw new Error('เซิร์ฟเวอร์คืนค่าว่างเปล่า');
      }
      let res;
      try {
        res = JSON.parse(text);
      } catch(e) {
        console.error('JSON parse error:', text.substring(0, 200));
        throw new Error('เซิร์ฟเวอร์คืนค่าที่ไม่ใช่ JSON (Unexpected token)');
      }
      if (res && res.success) {
        resolve(res.data);
      } else {
        reject(new Error((res && res.error) || 'เกิดข้อผิดพลาด'));
      }
    })
    .catch(err => {
      reject(new Error((err && err.message) || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์'));
    });
  });
}
window.api = api;`;

result = result.substring(0, startIdx) + newApi + result.substring(endIdx + blockEnd.length);

// Replace version string
result = result.replace(/Nursing Service Organization v[\d.]+/g, 'Nursing Service Organization v' + versionStr);

fs.writeFileSync(path.join(__dirname, 'index.html'), result, 'utf8');
console.log('Done! File saved to vercel/index.html (v' + versionStr + ')');
console.log('Total size:', result.length, 'chars');

// Check for remaining google.script.run references
const remaining = (result.match(/google\.script\.run/g) || []).length;
if (remaining > 0) {
  console.warn('WARNING: ' + remaining + ' google.script.run reference(s) still remain in output!');
} else {
  console.log('✓ All API calls are routed through fetch for Vercel. No google.script.run found.');
}
