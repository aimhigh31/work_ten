const fs = require('fs');
const path = require('path');

// CSV 파일 경로
const csvPath = 'c:\\Users\\11\\Downloads\\Supabase Snippet Untitled query.csv';
const outputPath = path.join(__dirname, '..', 'master-data-inserts.sql');

console.log('📖 CSV 파일 읽는 중...');
const csvContent = fs.readFileSync(csvPath, 'utf8');

// CSV 파싱
const lines = csvContent.trim().split('\n');
const headers = lines[0].split(',');

console.log('📋 컬럼:', headers.join(', '));
console.log('📊 레코드 수:', lines.length - 1);

let insertSQL = `-- ========================================
-- admin_mastercode_data INSERT 구문
-- ========================================
-- 생성일: ${new Date().toISOString()}
-- 레코드 수: ${lines.length - 1}
-- ========================================

`;

// 각 데이터 행을 INSERT 구문으로 변환
for (let i = 1; i < lines.length; i++) {
  const line = lines[i];
  if (!line.trim()) continue;

  // CSV 파싱 (간단한 버전 - 쉼표로 분리)
  const values = line.split(',');

  // SQL VALUES 생성
  const sqlValues = values.map((val, idx) => {
    const header = headers[idx];

    // 빈 값 처리
    if (val === '' || val === null || val === undefined) {
      return 'NULL';
    }

    // boolean 처리
    if (val === 'true' || val === 'false') {
      return val;
    }

    // 숫자 처리 (id, order 등)
    if (header.includes('id') || header.includes('order') || header === 'is_active') {
      if (val === 'true') return 'true';
      if (val === 'false') return 'false';
      if (!isNaN(val) && val.trim() !== '') {
        return val;
      }
    }

    // 날짜/시간 처리
    if (header.includes('at')) {
      return `'${val}'::timestamptz`;
    }

    // 문자열 처리 (작은따옴표 이스케이프)
    return `'${val.replace(/'/g, "''")}'`;
  }).join(', ');

  insertSQL += `INSERT INTO admin_mastercode_data (${headers.join(', ')}) VALUES (${sqlValues});\n`;
}

insertSQL += `\n-- ========================================\n`;
insertSQL += `-- INSERT 구문 생성 완료\n`;
insertSQL += `-- ========================================\n`;

// 파일 저장
fs.writeFileSync(outputPath, insertSQL, 'utf8');

console.log('\n✅ master-data-inserts.sql 파일 생성 완료!');
console.log('📍 위치:', path.resolve(outputPath));
console.log('📊 INSERT 구문 수:', lines.length - 1);
