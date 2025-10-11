const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres'
});

async function testInsert() {
  const client = await pool.connect();

  try {
    console.log('🧪 plan_task_management 테이블 삽입 테스트 시작...');

    // 테스트 데이터 삽입
    const result = await client.query(`
      INSERT INTO plan_task_management (
        task_id, item_id, text, checked, level, expanded,
        status, progress_rate, priority
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `, ['TEST-001', 1, '테스트 항목', false, 0, true, '대기', 0, 'Medium']);

    console.log('✅ 테스트 삽입 성공:');
    console.log(result.rows[0]);

    // 테스트 데이터 삭제
    await client.query('DELETE FROM plan_task_management WHERE task_id = $1', ['TEST-001']);
    console.log('✅ 테스트 데이터 삭제 완료');

  } catch (error) {
    console.error('❌ 테스트 실패:', error.message);
    console.error('❌ 상세:', error);
  } finally {
    client.release();
    await pool.end();
  }
}

testInsert()
  .then(() => {
    console.log('\n✅ 테스트 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 테스트 실패:', error);
    process.exit(1);
  });
