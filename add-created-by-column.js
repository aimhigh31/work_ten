const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// PostgreSQL 연결 문자열 (환경변수에서 읽기)
const connectionString = process.env.DATABASE_URL;

async function runMigration() {
  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('✅ Supabase 연결 성공');

    // SQL 파일 읽기
    const sqlPath = path.join(__dirname, 'supabase', 'migrations', 'add_created_by_column.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📝 실행할 SQL:');
    console.log(sql);
    console.log('');

    // SQL 실행
    await client.query(sql);
    console.log('✅ created_by 컬럼 추가 완료!');

    // 테이블 구조 확인
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'plan_sales_data'
      ORDER BY ordinal_position;
    `);

    console.log('\n📊 plan_sales_data 테이블 구조:');
    console.table(result.rows);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  } finally {
    await client.end();
    console.log('✅ 연결 종료');
  }
}

runMigration();
