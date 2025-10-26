require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function addChecklistColumns() {
  const client = new Client({
    connectionString: process.env.SUPABASE_DB_URL
  });

  try {
    await client.connect();
    console.log('✅ Supabase 데이터베이스 연결 성공');

    // SQL 파일 읽기
    const sqlFilePath = path.join(__dirname, 'add-checklist-columns.sql');
    const sql = fs.readFileSync(sqlFilePath, 'utf8');

    // SQL 실행
    const result = await client.query(sql);
    console.log('✅ hr_evaluation_data 테이블에 체크리스트 컬럼 추가 완료');

    // 결과 출력
    if (result.rows && result.rows.length > 0) {
      console.log('\n📋 hr_evaluation_data 테이블 구조:');
      console.table(result.rows);
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error(error);
  } finally {
    await client.end();
    console.log('\n✅ 데이터베이스 연결 종료');
  }
}

addChecklistColumns();
