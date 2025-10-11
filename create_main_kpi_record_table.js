require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function createMainKpiRecordTable() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL이 설정되지 않았습니다.');
    return;
  }

  console.log('📡 연결 정보:', databaseUrl.replace(/:[^:@]*@/, ':****@'));

  const client = new Client({
    connectionString: databaseUrl,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    console.log('🔌 PostgreSQL 연결 시도 중...');
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공');

    // SQL 파일 읽기
    const sqlPath = path.join(__dirname, 'create_main_kpi_record_table.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📝 main_kpi_record 테이블 생성 중...');
    await client.query(sql);
    console.log('✅ main_kpi_record 테이블 생성 완료');

    // 테이블 구조 확인
    const result = await client.query(`
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'main_kpi_record'
      ORDER BY ordinal_position;
    `);

    console.log('\n📋 main_kpi_record 테이블 구조:');
    console.table(result.rows);

  } catch (error) {
    console.error('❌ 오류 발생:');
    console.error('메시지:', error.message);
    if (error.code) console.error('코드:', error.code);
    if (error.detail) console.error('상세:', error.detail);
  } finally {
    await client.end();
    console.log('✅ PostgreSQL 연결 종료');
  }
}

createMainKpiRecordTable();
