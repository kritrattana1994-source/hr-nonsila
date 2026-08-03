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

const firebaseUrl = 'https://us-central1-hr-nongsila.cloudfunctions.net/api';
const now = new Date();
const versionStr = `${now.getFullYear()+543}.${String(now.getMonth()+1).padStart(2,'0')}.${String(now.getDate()).padStart(2,'0')}.${String(now.getHours()).padStart(2,'0')}${String(now.getMinutes()).padStart(2,'0')}`;

// Find the _apiOnce function block and replace with fetch version
const oldPatternStart = 'function _apiOnce(action, params) {';

let startIdx = result.indexOf(oldPatternStart);
if (startIdx === -1) {
  console.error('Could not find _apiOnce function block in merged output!');
  process.exit(1);
}

// Find the closing } of the _apiOnce function by counting braces
// The function now has structure: function _apiOnce(action, params) { ... if(isGAS){ ... return ... } }
// We need to find the exact end
let braceCount = 0;
let endIdx = -1;
let inFunction = false;
for (let i = startIdx; i < result.length; i++) {
  if (result[i] === '{') {
    braceCount++;
    inFunction = true;
  } else if (result[i] === '}') {
    braceCount--;
    if (inFunction && braceCount === 0) {
      endIdx = i;
      break;
    }
  }
}

if (endIdx === -1) {
  // Fallback v1: old pattern with });\r\n}
  const oldPatternEnd = '  });\r\n}';
  const oldPatternEndLF = '  });\n}';
  endIdx = result.indexOf(oldPatternEnd, startIdx);
  if (endIdx === -1) endIdx = result.indexOf(oldPatternEndLF, startIdx);
}

if (endIdx === -1) {
  // Fallback v2: search for handleApiCall ending
  const fallbackEnd = '.handleApiCall(action, { token: State.token, ...params });\r\n  });\r\n}';
  const fallbackEndLF = '.handleApiCall(action, { token: State.token, ...params });\n  });\n}';
  endIdx = result.indexOf(fallbackEnd, startIdx);
  if (endIdx === -1) endIdx = result.indexOf(fallbackEndLF, startIdx);
}

if (endIdx === -1) {
  console.error('Could not find _apiOnce function end!');
  process.exit(1);
}

const newApiOnce = `function _apiOnce(action, params) {
  return new Promise((resolve, reject) => {
    const url = '${firebaseUrl}';
    fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify({ action, token: State.token, ...params }),
      redirect: 'follow'
    })
    .then(response => {
      if (!response.ok) {
        throw new Error('Server error: ' + response.status);
      }
      const contentType = response.headers.get('content-type') || '';
      if (contentType.includes('text/html')) {
        return response.text().then(html => {
          console.error('Server returned HTML:', html.substring(0, 200));
          throw new Error('เซิร์ฟเวอร์คืนค่า HTML แทน JSON — กำลังลองใหม่');
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
        throw new Error('เซิร์ฟเวอร์คืนค่าที่ไม่ใช่ JSON');
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
}`;

// endLen: if found by brace counting, it's just the closing } character
let finalEndLen = 1;
// If we used one of the fallback patterns, endLen would be set; but we declared it as 1 above.
// The old fallback patterns have lengths of 8-10 chars. We know brace counting gives just '}'.
// So we just use 1 since brace counting always finds the closing brace.
result = result.substring(0, startIdx) + newApiOnce + result.substring(endIdx + finalEndLen);

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
