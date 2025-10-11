const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function removeUniqueConstraint() {
  console.log('🔧 it_hardware_user 테이블 유니크 제약조건 제거...');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || `postgresql://postgres:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:5432/postgres`,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // 제약조건 제거
    const dropConstraintSQL = `
      ALTER TABLE public.it_hardware_user
      DROP CONSTRAINT IF EXISTS it_hardware_user_hardware_id_user_name_start_date_key;
    `;

    console.log('📝 실행할 SQL:', dropConstraintSQL);

    await pool.query(dropConstraintSQL);
    console.log('✅ 유니크 제약조건 제거 완료');

    // 제거 확인
    const checkQuery = `
      SELECT constraint_name, constraint_type
      FROM information_schema.table_constraints
      WHERE table_name = 'it_hardware_user'
        AND table_schema = 'public'
        AND constraint_type = 'UNIQUE';
    `;

    const result = await pool.query(checkQuery);
    console.log('📊 남은 유니크 제약조건:', result.rows.length, '개');
    if (result.rows.length > 0) {
      console.table(result.rows);
    } else {
      console.log('✅ 모든 유니크 제약조건이 제거되었습니다.');
    }

  } catch (error) {
    console.error('❌ 제약조건 제거 실패:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

removeUniqueConstraint()
  .then(() => {
    console.log('\n🎉 제약조건 제거 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 실행 실패:', error);
    process.exit(1);
  });