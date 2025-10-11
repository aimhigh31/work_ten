const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function addTeamColumn() {
  console.log('🔨 security_regulation_data 테이블에 team 컬럼 추가 중...\n');

  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공\n');

    // team 컬럼 추가
    console.log('➕ team 컬럼 추가 중...');
    await client.query(`
      ALTER TABLE security_regulation_data
      ADD COLUMN IF NOT EXISTS team VARCHAR(100);
    `);
    console.log('✅ team 컬럼 추가 완료\n');

    // 컬럼 확인
    const { rows } = await client.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'security_regulation_data'
      AND column_name = 'team';
    `);

    if (rows.length > 0) {
      console.log('✅ team 컬럼 확인:');
      console.log('  - 컬럼명:', rows[0].column_name);
      console.log('  - 데이터 타입:', rows[0].data_type);
      console.log('  - 최대 길이:', rows[0].character_maximum_length);
    }

    console.log('\n✅ 작업 완료!');
  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error('상세:', error);
  } finally {
    await client.end();
  }
}

addTeamColumn();
