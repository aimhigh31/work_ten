const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

// 마스터 데이터 테이블 목록
const masterTables = [
  'admin_mastercode_data',
  'admin_systemsetting_menu',
  'admin_users_department',
  'admin_users_rules',
  'admin_users_rules_permissions',
  'code_sequences'
];

async function exportMasterData() {
  const dbUrl = 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres';

  const client = new Client({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ 개발 DB 연결 성공\n');

    let insertSQL = `-- ========================================
-- 마스터 데이터 덤프
-- ========================================
-- 생성일: ${new Date().toISOString()}
-- 프로젝트: exxumujwufzqnovhzvif
-- ========================================

`;

    for (const tableName of masterTables) {
      console.log(`📋 처리 중: ${tableName}`);

      // 데이터 조회
      const result = await client.query(`SELECT * FROM ${tableName}`);

      if (result.rows.length === 0) {
        console.log(`   ⚠️  데이터 없음\n`);
        continue;
      }

      console.log(`   ✅ ${result.rows.length}개 레코드 발견`);

      insertSQL += `\n-- Table: ${tableName} (${result.rows.length} rows)\n`;

      for (const row of result.rows) {
        const columns = Object.keys(row);
        const values = Object.values(row).map(val => {
          if (val === null) return 'NULL';
          if (typeof val === 'boolean') return val ? 'true' : 'false';
          if (typeof val === 'number') return val;
          if (typeof val === 'object') return `'${JSON.stringify(val).replace(/'/g, "''")}'`;
          if (val instanceof Date) return `'${val.toISOString()}'`;
          // 문자열: 작은따옴표 이스케이프
          return `'${String(val).replace(/'/g, "''")}'`;
        });

        insertSQL += `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${values.join(', ')});\n`;
      }

      console.log(`   💾 INSERT 구문 생성 완료\n`);
    }

    insertSQL += `\n-- ========================================\n`;
    insertSQL += `-- 마스터 데이터 덤프 완료\n`;
    insertSQL += `-- ========================================\n`;

    // 파일로 저장
    const outputPath = 'master-data.sql';
    fs.writeFileSync(outputPath, insertSQL, 'utf8');

    console.log('✅ master-data.sql 파일 생성 완료!');
    console.log('📍 위치:', require('path').resolve(outputPath));
    console.log('📊 총 테이블 수:', masterTables.length);

  } catch (error) {
    console.error('❌ 에러:', error.message);
    console.error('상세:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

exportMasterData();
