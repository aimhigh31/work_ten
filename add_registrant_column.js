require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

// PostgreSQL 연결 설정 (Supabase)
const client = new Client({
  host: process.env.NEXT_PUBLIC_SUPABASE_URL.replace('https://', '').replace('.supabase.co', '').split('.')[0] + '.supabase.co',
  port: 6543,
  database: 'postgres',
  user: 'postgres',
  password: process.env.SUPABASE_DB_PASSWORD,
});

async function addRegistrantColumn() {
  try {
    console.log('🔌 PostgreSQL 연결 시도...');
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공');

    // registrant 컬럼이 이미 존재하는지 확인
    const checkQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'it_hardware_data'
      AND column_name = 'registrant';
    `;

    const checkResult = await client.query(checkQuery);

    if (checkResult.rows.length > 0) {
      console.log('ℹ️ registrant 컬럼이 이미 존재합니다.');
      return;
    }

    // registrant 컬럼 추가
    const addColumnQuery = `
      ALTER TABLE it_hardware_data
      ADD COLUMN registrant VARCHAR(100);
    `;

    console.log('📝 실행할 쿼리:', addColumnQuery);

    const result = await client.query(addColumnQuery);
    console.log('✅ registrant 컬럼 추가 성공');

    // 추가된 컬럼 확인
    const verifyQuery = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'it_hardware_data'
      AND column_name = 'registrant';
    `;

    const verifyResult = await client.query(verifyQuery);
    console.log('🔍 추가된 컬럼 정보:', verifyResult.rows);

  } catch (error) {
    console.error('❌ 에러 발생:', error.message);
    console.error('❌ 에러 상세:', error);
  } finally {
    await client.end();
    console.log('🔚 PostgreSQL 연결 종료');
  }
}

addRegistrantColumn();