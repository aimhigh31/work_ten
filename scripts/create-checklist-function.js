const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function createChecklistFunction() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공');

    // SQL 파일 읽기
    const sqlPath = path.join(__dirname, '../supabase/migrations/create_checklist_insert_function.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📄 SQL 파일 읽기 완료');
    console.log('🔄 RPC 함수 생성 중...');

    // SQL 실행
    await client.query(sql);

    console.log('✅ RPC 함수 생성 완료: insert_checklist_with_code');
    console.log('');
    console.log('이제 체크리스트 생성 시 코드 중복 문제가 해결됩니다.');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  } finally {
    await client.end();
    console.log('📊 PostgreSQL 연결 종료');
  }
}

createChecklistFunction();
