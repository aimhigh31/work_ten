const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

async function checkProfile() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('PostgreSQL 연결 성공\n');

    const { rows } = await client.query(`
      SELECT
        user_name,
        position,
        department,
        role,
        email
      FROM admin_users_userprofiles
      WHERE user_account_id = 'jaesikan';
    `);

    if (rows.length > 0) {
      console.log('=== jaesikan 사용자 정보 ===\n');
      const user = rows[0];
      console.log(`이름: ${user.user_name}`);
      console.log(`직책: ${user.position}`);
      console.log(`부서: ${user.department}`);
      console.log(`역할: ${user.role}`);
      console.log(`이메일: ${user.email}`);

      console.log('\n=== 원하는 표시 형식 ===');
      console.log(`첫 줄: ${user.user_name} ${user.position}`);
      console.log(`두번째 줄: ${user.department}`);
    } else {
      console.log('❌ 사용자를 찾을 수 없습니다.');
    }

  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    await client.end();
  }
}

checkProfile();
