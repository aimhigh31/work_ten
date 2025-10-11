const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('ERROR: DATABASE_URL이 설정되지 않았습니다.');
  process.exit(1);
}

async function addAuthUserIdColumn() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('PostgreSQL 연결 성공');

    // 1. auth_user_id 컬럼 추가 (auth.users의 id와 매핑)
    console.log('auth_user_id 컬럼 추가 중...');
    await client.query(`
      ALTER TABLE admin_users_userprofiles
      ADD COLUMN IF NOT EXISTS auth_user_id UUID UNIQUE;
    `);
    console.log('✅ auth_user_id 컬럼이 추가되었습니다.');

    // 2. 인덱스 생성
    console.log('인덱스 생성 중...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_auth_user_id
      ON admin_users_userprofiles(auth_user_id);
    `);
    console.log('✅ 인덱스가 생성되었습니다.');

    // 3. 코멘트 추가
    await client.query(`
      COMMENT ON COLUMN admin_users_userprofiles.auth_user_id
      IS 'Supabase Auth users 테이블의 id (UUID)';
    `);
    console.log('✅ 컬럼 코멘트가 추가되었습니다.');

    console.log('\n=== auth_user_id 컬럼 추가 완료 ===');
  } catch (error) {
    console.error('오류 발생:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

addAuthUserIdColumn();
