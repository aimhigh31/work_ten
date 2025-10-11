const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres'
});

async function addRuleColumn() {
  try {
    console.log('🚀 admin_users_userprofiles 테이블에 rule 컬럼 추가 시작...');

    // rule 컬럼 추가 (VARCHAR(50) 타입으로)
    const addColumnQuery = `
      ALTER TABLE admin_users_userprofiles
      ADD COLUMN IF NOT EXISTS rule VARCHAR(50);
    `;

    await pool.query(addColumnQuery);
    console.log('✅ rule 컬럼이 성공적으로 추가되었습니다.');

    // 기존 데이터에 기본값 설정 (사용자 역할로)
    const updateDefaultQuery = `
      UPDATE admin_users_userprofiles
      SET rule = 'RULE-25-003'
      WHERE rule IS NULL;
    `;

    await pool.query(updateDefaultQuery);
    console.log('✅ 기존 데이터에 기본 역할(RULE-25-003)이 설정되었습니다.');

    // 결과 확인
    const checkQuery = `
      SELECT id, user_name, role, rule
      FROM admin_users_userprofiles
      LIMIT 5;
    `;

    const result = await pool.query(checkQuery);
    console.log('📋 업데이트된 사용자 데이터:');
    result.rows.forEach(user => {
      console.log(`- ${user.user_name}: role=${user.role}, rule=${user.rule}`);
    });

  } catch (error) {
    console.error('❌ rule 컬럼 추가 실패:', error);
  } finally {
    await pool.end();
  }
}

addRuleColumn();