const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function addUserColumns() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔌 PostgreSQL 연결 중...');
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공');

    // SQL 파일 읽기
    const sql = fs.readFileSync('add_feedback_user_columns.sql', 'utf8');
    console.log('📖 SQL 파일 로드 완료');

    // SQL 실행
    console.log('⚡ SQL 실행 중...');
    await client.query(sql);
    console.log('✅ SQL 실행 완료');

    // 테이블 확인
    console.log('🔍 테이블 확인 중...');
    const checkResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'common_feedback_data'
      ORDER BY ordinal_position;
    `);

    console.log('📋 업데이트된 테이블 컬럼:');
    checkResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

    console.log('\n🎉 컬럼 추가 완료!');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    if (error.detail) console.error('상세:', error.detail);
  } finally {
    await client.end();
    console.log('🔌 PostgreSQL 연결 종료');
  }
}

addUserColumns();
