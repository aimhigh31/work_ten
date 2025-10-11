const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const pool = new Pool({
  host: 'aws-0-ap-northeast-2.pooler.supabase.com',
  port: 6543,
  database: 'postgres',
  user: 'postgres.hxvtpwpidecmtftowjnv',
  password: process.env.NEXT_PUBLIC_SUPABASE_PASSWORD,
  ssl: { rejectUnauthorized: false }
});

async function addDescriptionColumn() {
  console.log('📝 투자관리 테이블에 description 컬럼 추가...');

  try {
    const client = await pool.connect();

    // description 컬럼 추가
    const addColumnSQL = `
      ALTER TABLE plan_investment_data
      ADD COLUMN IF NOT EXISTS description TEXT;
    `;

    console.log('🔧 컬럼 추가 중...');
    await client.query(addColumnSQL);
    console.log('✅ description 컬럼이 성공적으로 추가되었습니다!');

    // 컬럼이 제대로 추가되었는지 확인
    const checkSQL = `
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'plan_investment_data'
      AND column_name = 'description';
    `;

    const result = await client.query(checkSQL);
    if (result.rows.length > 0) {
      console.log('✅ description 컬럼 확인:', result.rows[0]);
    } else {
      console.log('❌ description 컬럼을 찾을 수 없습니다.');
    }

    client.release();

  } catch (error) {
    console.error('❌ 컬럼 추가 실패:', error);
  } finally {
    await pool.end();
  }
}

addDescriptionColumn();