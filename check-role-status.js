const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres'
});

async function checkRoleStatus() {
  try {
    console.log('🔍 역할 상태 확인...\n');

    // admin_users_rules 테이블의 is_active 상태 확인
    const query = `
      SELECT role_code, role_name, is_active
      FROM admin_users_rules
      ORDER BY display_order;
    `;

    const result = await pool.query(query);

    console.log('📋 역할별 활성화 상태:');
    result.rows.forEach(row => {
      console.log(`- ${row.role_code} (${row.role_name}): is_active = ${row.is_active}`);
    });

    // 모든 역할을 활성화로 업데이트
    const updateQuery = `
      UPDATE admin_users_rules
      SET is_active = true
      WHERE is_active = false OR is_active IS NULL;
    `;

    const updateResult = await pool.query(updateQuery);
    console.log(`\n✅ ${updateResult.rowCount}개 역할을 활성화 상태로 업데이트했습니다.`);

    // 업데이트 후 재확인
    const checkQuery = `
      SELECT role_code, role_name, is_active
      FROM admin_users_rules
      ORDER BY display_order;
    `;

    const checkResult = await pool.query(checkQuery);

    console.log('\n📋 업데이트 후 역할 상태:');
    checkResult.rows.forEach(row => {
      console.log(`- ${row.role_code} (${row.role_name}): is_active = ${row.is_active}`);
    });

  } catch (error) {
    console.error('❌ 역할 상태 확인 실패:', error);
  } finally {
    await pool.end();
  }
}

checkRoleStatus();