const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.SUPABASE_DB_URL
});

(async () => {
  try {
    console.log('🔧 main_task_data 테이블에 kpi_record_id 컬럼 추가 중...');

    const result = await pool.query(`
      ALTER TABLE main_task_data
      ADD COLUMN IF NOT EXISTS kpi_record_id int4;
    `);

    console.log('✅ kpi_record_id 컬럼 추가 완료');

    // 확인
    const check = await pool.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'main_task_data'
      AND column_name LIKE '%kpi%'
      ORDER BY ordinal_position;
    `);

    console.log('\nKPI 관련 컬럼 목록:');
    console.table(check.rows);

  } catch (err) {
    console.error('❌ 에러:', err);
    console.error('에러 상세:', err.message);
    console.error('에러 스택:', err.stack);
  } finally {
    await pool.end();
  }
})();
