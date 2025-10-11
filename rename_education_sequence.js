const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function renameSequence() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔌 PostgreSQL 연결 중...');
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공\n');

    // 시퀀스 이름 변경
    console.log('🔧 시퀀스 이름 변경 중: main_education_data_id_new_seq → main_education_data_id_seq');
    await client.query(`
      ALTER SEQUENCE main_education_data_id_new_seq
      RENAME TO main_education_data_id_seq;
    `);
    console.log('✅ 시퀀스 이름 변경 완료\n');

    // 변경 후 확인
    console.log('📋 변경 후 id 컬럼 정보:');
    const check = await client.query(`
      SELECT
        column_name,
        data_type,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'main_education_data'
        AND column_name = 'id';
    `);
    console.table(check.rows);

    console.log('\n✅ 작업 완료!');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 PostgreSQL 연결 종료');
  }
}

renameSequence();
