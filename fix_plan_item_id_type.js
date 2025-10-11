const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres'
});

async function fixItemIdType() {
  const client = await pool.connect();

  try {
    console.log('🔧 plan_task_management.item_id 타입 수정 시작...');

    // item_id를 INTEGER에서 BIGINT로 변경
    await client.query(`
      ALTER TABLE plan_task_management
      ALTER COLUMN item_id TYPE BIGINT;
    `);

    console.log('✅ item_id 타입을 BIGINT로 변경 완료');

    // parent_id도 BIGINT로 변경 (일관성 유지)
    await client.query(`
      ALTER TABLE plan_task_management
      ALTER COLUMN parent_id TYPE BIGINT;
    `);

    console.log('✅ parent_id 타입을 BIGINT로 변경 완료');

    // 변경 확인
    const result = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'plan_task_management'
      AND column_name IN ('item_id', 'parent_id')
    `);

    console.log('\n📊 변경된 컬럼 타입:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type}`);
    });

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixItemIdType()
  .then(() => {
    console.log('\n✅ 모든 작업이 완료되었습니다.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 작업 실패:', error);
    process.exit(1);
  });
