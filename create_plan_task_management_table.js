const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres'
});

async function createPlanTaskManagementTable() {
  const client = await pool.connect();

  try {
    console.log('🚀 plan_task_management 테이블 생성 시작...');

    // 테이블 생성
    await client.query(`
      CREATE TABLE IF NOT EXISTS plan_task_management (
        id SERIAL PRIMARY KEY,
        task_id VARCHAR(50) NOT NULL,
        item_id INTEGER NOT NULL,
        text TEXT NOT NULL,
        checked BOOLEAN DEFAULT false,
        parent_id INTEGER,
        level INTEGER DEFAULT 0,
        expanded BOOLEAN DEFAULT true,
        status VARCHAR(20) DEFAULT '대기',
        due_date DATE,
        progress_rate INTEGER DEFAULT 0,
        assignee VARCHAR(100),
        priority VARCHAR(20) DEFAULT 'Medium',
        start_date DATE,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW(),
        created_by VARCHAR(100) DEFAULT 'system',
        updated_by VARCHAR(100) DEFAULT 'system'
      );
    `);

    console.log('✅ plan_task_management 테이블 생성 완료');

    // 인덱스 생성
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_plan_task_task_id ON plan_task_management(task_id);
      CREATE INDEX IF NOT EXISTS idx_plan_task_parent_id ON plan_task_management(parent_id);
      CREATE INDEX IF NOT EXISTS idx_plan_task_status ON plan_task_management(status);
      CREATE INDEX IF NOT EXISTS idx_plan_task_is_active ON plan_task_management(is_active);
    `);

    console.log('✅ 인덱스 생성 완료');

    // RLS 비활성화
    await client.query(`
      ALTER TABLE plan_task_management DISABLE ROW LEVEL SECURITY;
    `);

    console.log('✅ RLS 비활성화 완료');

    // 테이블 구조 확인
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'plan_task_management'
      ORDER BY ordinal_position;
    `);

    console.log('\n📊 테이블 구조:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? 'NOT NULL' : ''} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

createPlanTaskManagementTable()
  .then(() => {
    console.log('\n✅ 모든 작업이 완료되었습니다.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ 작업 실패:', error);
    process.exit(1);
  });
