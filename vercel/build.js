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

// Find the _apiOnce function block and replace with fetch version
const oldPatternStart = 'function _apiOnce(action, params) {';
const oldPatternEnd = '  });\r\n}';
const oldPatternEndLF = '  });\n}';

let startIdx = result.indexOf(oldPatternStart);
if (startIdx === -1) {
  console.error('Could not find _apiOnce function block in merged output!');
  process.exit(1);
}

let endIdx = result.indexOf(oldPatternEnd, startIdx);
let endLen = oldPatternEnd.length;
if (endIdx === -1) {
  endIdx = result.indexOf(oldPatternEndLF, startIdx);
  endLen = oldPatternEndLF.length;
}

if (endIdx === -1) {
  // Fallback: search for handleApiCall ending
  const fallbackEnd = '.handleApiCall(action, { token: State.token, ...params });\r\n  });\r\n}';
  const fallbackEndLF = '.handleApiCall(action, { token: State.token, ...params });\n  });\n}';
  endIdx = result.indexOf(fallbackEnd, startIdx);
  endLen = fallbackEnd.length;
  if (endIdx === -1) {
    endIdx = result.indexOf(fallbackEndLF, startIdx);
    endLen = fallbackEndLF.length;
  }
}

if (endIdx === -1) {
  console.error('Could not find _apiOnce function end!');
  process.exit(1);
}

const newApiOnce = `function _apiOnce(action, params) {
  return new Promise((resolve, reject) => {
    const url = '${gasUrl}';
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

result = result.substring(0, startIdx) + newApiOnce + result.substring(endIdx + endLen);

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
