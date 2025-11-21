const fs = require('fs');
const path = require('path');

// CSV 파일 설정
const csvFiles = [
  {
    path: 'c:\\Users\\11\\Downloads\\Supabase Snippet Untitled query.csv',
    tableName: 'admin_mastercode_data'
  },
  {
    path: 'c:\\Users\\11\\Downloads\\Supabase Snippet Admin Mastercode Data Listing.csv',
    tableName: 'admin_systemsetting_menu'
  }
];

// CSV 한 줄 파싱 함수 (간단한 버전)
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current);
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current);

  return result.map(v => v.trim());
}

// SQL 값 이스케이프 함수
function escapeSQL(value, header) {
  // NULL 처리
  if (value === '' || value === 'null' || value === 'NULL') {
    return 'NULL';
  }

  // boolean 처리
  if (value === 'true' || value === 'false') {
    return value;
  }

  // 숫자 처리
  if ((header.includes('id') || header.includes('level') || header.includes('order')) &&
      !isNaN(value) && value.trim() !== '') {
    return value;
  }

  // 날짜/시간 처리
  if (header.includes('_at') || header.includes('date')) {
    if (value.includes('+') || value.includes('T')) {
      return `'${value}'::timestamptz`;
    }
  }

  // 문자열 처리 (작은따옴표 이스케이프)
  return `'${value.replace(/'/g, "''")}'`;
}

let masterSQL = `-- ========================================
-- 마스터 데이터 INSERT 구문
-- ========================================
-- 생성일: ${new Date().toISOString()}
-- ========================================

`;

// 각 CSV 파일 처리
for (const csvFile of csvFiles) {
  console.log(`\n📖 처리 중: ${csvFile.tableName}`);
  console.log(`📂 파일: ${csvFile.path}`);

  try {
    const csvContent = fs.readFileSync(csvFile.path, 'utf8');
    const lines = csvContent.trim().split('\n');

    const headers = parseCSVLine(lines[0]);
    console.log(`📋 컬럼 수: ${headers.length}`);
    console.log(`📊 레코드 수: ${lines.length - 1}`);

    masterSQL += `\n-- ========================================\n`;
    masterSQL += `-- ${csvFile.tableName} (${lines.length - 1} rows)\n`;
    masterSQL += `-- ========================================\n`;

    // 각 데이터 행을 INSERT 구문으로 변환
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;

      const values = parseCSVLine(line);

      // SQL VALUES 생성
      const sqlValues = values.map((val, idx) => {
        return escapeSQL(val, headers[idx]);
      }).join(', ');

      masterSQL += `INSERT INTO ${csvFile.tableName} (${headers.join(', ')}) VALUES (${sqlValues});\n`;
    }

    console.log(`✅ ${lines.length - 1}개 INSERT 구문 생성 완료`);

  } catch (error) {
    console.error(`❌ 에러 (${csvFile.tableName}):`, error.message);
  }
}

masterSQL += `\n-- ========================================\n`;
masterSQL += `-- 마스터 데이터 INSERT 구문 생성 완료\n`;
masterSQL += `-- ========================================\n`;

// 파일 저장
const outputPath = path.join(__dirname, '..', 'master-data.sql');
fs.writeFileSync(outputPath, masterSQL, 'utf8');

console.log('\n✅ master-data.sql 파일 생성 완료!');
console.log('📍 위치:', path.resolve(outputPath));
console.log('💾 파일 크기:', (masterSQL.length / 1024).toFixed(2), 'KB');
