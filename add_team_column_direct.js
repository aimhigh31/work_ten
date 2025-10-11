const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function addTeamColumn() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔌 PostgreSQL 연결 중...');
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공');

    // 1. team 컬럼 추가
    console.log('🔧 team 컬럼 추가 중...');
    await client.query('ALTER TABLE it_education_data ADD COLUMN IF NOT EXISTS team TEXT;');
    console.log('✅ team 컬럼 추가 완료');

    // 2. 변경 후 테이블 구조 확인
    const afterCheck = await client.query();

    console.log('📋 테이블 컬럼 목록:');
    afterCheck.rows.forEach(row => {
      console.log();
    });

  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await client.end();
  }
}

addTeamColumn();