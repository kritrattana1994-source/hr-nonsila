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

// Find the google.script.run block and replace with fetch
const oldStart = 'function api(action, params={}) {';
const oldEnd = 'window.api = api;';

const startIdx = result.indexOf(oldStart);
const endIdx = result.indexOf(oldEnd, startIdx);

if (startIdx === -1 || endIdx === -1) {
  console.error('Could not find api function block!');
  process.exit(1);
}

const oldBlock = result.substring(startIdx, endIdx + oldEnd.length);

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

result = result.substring(0, startIdx) + newApi + result.substring(endIdx + oldEnd.length);

// ── Replace remaining google.script.run.handleApiCall() calls with fetch ──
// These are used by showRegisterForm (getDepartmentsPublic) and submitPublicRegister
// Pattern: replace the whole Promise block that calls google.script.run.handleApiCall(action, params)

const gasRunHelper = `
/* Vercel: helper replacing google.script.run.handleApiCall */
function _gasApiFetch(action, params) {
  return fetch('${gasUrl}', {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(Object.assign({ action: action }, params || {}))
  }).then(function(r) { return r.text(); }).then(function(t) {
    var res = JSON.parse(t);
    if (res && res.success) return res;
    throw new Error((res && res.error) || 'Server error');
  });
}
`;

// Insert helper just before </script> of the first script block that has window.api
const insertBefore = result.lastIndexOf('</script>');
result = result.substring(0, insertBefore) + gasRunHelper + result.substring(insertBefore);

// Replace the getDepartmentsPublic block in showRegisterForm
// (the Promise that calls google.script.run.handleApiCall('getDepartmentsPublic', {}))
result = result.replace(
  /await new Promise\(function\(resolve, reject\) \{\s*google\.script\.run\s*\.withSuccessHandler\(function\(res\) \{ resolve\(\(res && res\.success\) \? \(res\.data \|\| \[\]\) : \[\]\); \}\)\s*\.withFailureHandler\(function\(\) \{ resolve\(\[\]\); \}\)\s*\.handleApiCall\('getDepartmentsPublic', \{\}\);\s*\}\)/g,
  `await _gasApiFetch('getDepartmentsPublic', {}).then(function(r){ return r.data || []; }).catch(function(){ return []; })`
);

// Replace submitPublicRegister's google.script.run block
result = result.replace(
  /await new Promise\(function\(resolve, reject\) \{\s*google\.script\.run\s*\.withSuccessHandler\(function\(res\) \{\s*if \(res && res\.success\) resolve\(res\.data\);\s*else reject\(new Error\(\(res && res\.error\) \|\| '[^']*'\)\);\s*\}\)\s*\.withFailureHandler\(function\(err\) \{ reject\(new Error\(err\.message \|\| '[^']*'\)\); \}\)\s*\.handleApiCall\('registerStaffPublic', \{ data: data \}\);\s*\}\)/g,
  `await _gasApiFetch('registerStaffPublic', { data: data })`
);

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
  console.log('✓ No google.script.run references remain.');
}
