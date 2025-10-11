const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('ERROR: DATABASE_URL이 설정되지 않았습니다.');
  process.exit(1);
}

async function checkUser() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('PostgreSQL 연결 성공\n');

    // jaesikan 사용자 확인
    const { rows } = await client.query(`
      SELECT
        id,
        auth_user_id,
        user_code,
        user_account_id,
        user_name,
        email,
        department,
        position,
        role,
        status,
        is_active
      FROM admin_users_userprofiles
      WHERE user_account_id = 'jaesikan' OR user_code LIKE '%jaesikan%' OR email LIKE '%jaesikan%'
      LIMIT 5;
    `);

    console.log('=== jaesikan 사용자 검색 결과 ===');
    if (rows.length === 0) {
      console.log('❌ jaesikan 사용자를 찾을 수 없습니다.');

      // 모든 사용자 목록 확인
      const { rows: allUsers } = await client.query(`
        SELECT user_code, user_account_id, email, user_name
        FROM admin_users_userprofiles
        ORDER BY created_at DESC
        LIMIT 10;
      `);

      console.log('\n=== 최근 사용자 목록 (최대 10명) ===');
      allUsers.forEach((user, index) => {
        console.log(`${index + 1}. user_code: ${user.user_code}, user_account_id: ${user.user_account_id}, email: ${user.email}, name: ${user.user_name}`);
      });
    } else {
      rows.forEach((user, index) => {
        console.log(`\n사용자 ${index + 1}:`);
        console.log(`  ID: ${user.id}`);
        console.log(`  auth_user_id: ${user.auth_user_id || '❌ NULL'}`);
        console.log(`  user_code: ${user.user_code}`);
        console.log(`  user_account_id: ${user.user_account_id}`);
        console.log(`  user_name: ${user.user_name}`);
        console.log(`  email: ${user.email}`);
        console.log(`  department: ${user.department}`);
        console.log(`  position: ${user.position}`);
        console.log(`  role: ${user.role}`);
        console.log(`  status: ${user.status}`);
        console.log(`  is_active: ${user.is_active}`);
      });
    }

  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    await client.end();
  }
}

checkUser();
