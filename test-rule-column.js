const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres'
});

async function testRuleColumn() {
  try {
    console.log('🔍 rule 컬럼 테스트 시작...');

    // 현재 사용자들의 rule 값 확인
    const checkQuery = `
      SELECT id, user_name, role, rule, assigned_roles
      FROM admin_users_userprofiles
      ORDER BY id;
    `;

    const result = await pool.query(checkQuery);
    console.log('📋 현재 사용자 데이터:');
    result.rows.forEach(user => {
      console.log(`- ID: ${user.id}, 이름: ${user.user_name}, role: ${user.role}, rule: ${user.rule}, assigned_roles: ${user.assigned_roles}`);
    });

    // 테스트용으로 첫 번째 사용자의 rule 값을 RULE-25-001로 업데이트
    if (result.rows.length > 0) {
      const firstUserId = result.rows[0].id;
      const updateQuery = `
        UPDATE admin_users_userprofiles
        SET rule = 'RULE-25-001', assigned_roles = '["RULE-25-001"]'
        WHERE id = $1
        RETURNING id, user_name, rule, assigned_roles;
      `;

      const updateResult = await pool.query(updateQuery, [firstUserId]);
      console.log('✅ 테스트 업데이트 완료:');
      console.log(`- ${updateResult.rows[0].user_name}: rule=${updateResult.rows[0].rule}, assigned_roles=${updateResult.rows[0].assigned_roles}`);
    }

  } catch (error) {
    console.error('❌ rule 컬럼 테스트 실패:', error);
  } finally {
    await pool.end();
  }
}

testRuleColumn();