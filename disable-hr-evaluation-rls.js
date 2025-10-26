require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function disableRLS() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL
  });

  try {
    await client.connect();
    console.log('✅ Supabase 데이터베이스 연결 성공');

    // SQL 파일 읽기
    const sqlFilePath = path.join(__dirname, 'disable-hr-evaluation-rls.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    // SQL 실행
    await client.query(sql);
    console.log('✅ hr_evaluation_data RLS 정책 제거 완료');

    // 확인
    const result = await client.query(`
      SELECT tablename, rowsecurity
      FROM pg_tables
      WHERE tablename = 'hr_evaluation_data';
    `);

    console.log('\n📋 hr_evaluation_data RLS 상태:');
    console.table(result.rows);

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error(error);
  } finally {
    await client.end();
    console.log('\n✅ 데이터베이스 연결 종료');
  }
}

disableRLS();
