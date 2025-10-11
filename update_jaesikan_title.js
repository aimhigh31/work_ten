const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const connectionString = process.env.DATABASE_URL;

async function updateTitle() {
  const client = new Client({ connectionString });

  try {
    await client.connect();
    console.log('PostgreSQL 연결 성공\n');

    // position을 "파트장"으로, department를 "경영기획SF"로 업데이트
    const { rows } = await client.query(`
      UPDATE admin_users_userprofiles
      SET
        position = '파트장',
        department = '경영기획SF',
        updated_at = NOW()
      WHERE user_account_id = 'jaesikan'
      RETURNING user_name, position, department;
    `);

    if (rows.length > 0) {
      const user = rows[0];
      console.log('✅ 업데이트 완료!');
      console.log(`\n이름: ${user.user_name}`);
      console.log(`직책: ${user.position}`);
      console.log(`부서: ${user.department}`);

      console.log('\n=== 표시될 형식 ===');
      console.log(`첫 줄: ${user.user_name} ${user.position}`);
      console.log(`두 번째 줄: ${user.department}`);
    }

  } catch (error) {
    console.error('오류 발생:', error);
  } finally {
    await client.end();
  }
}

updateTitle();
