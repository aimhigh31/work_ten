// admin_mastercode 테이블을 admin_mastercode_data로 이름 변경
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

async function renameTable() {
  try {
    console.log('🔗 PostgreSQL 연결 중...');
    await client.connect();

    console.log('📝 테이블명 변경: admin_mastercode → admin_mastercode_data');

    // 테이블 이름 변경
    await client.query('ALTER TABLE admin_mastercode RENAME TO admin_mastercode_data;');
    console.log('✅ 테이블명 변경 완료');

    // 변경 확인
    const checkResult = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'admin_mastercode_data'
      );
    `);

    console.log('📊 admin_mastercode_data 테이블 존재 확인:', checkResult.rows[0].exists);

    // 기존 테이블이 삭제되었는지 확인
    const oldTableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'admin_mastercode'
      );
    `);

    console.log('🗑️ admin_mastercode 테이블 삭제 확인:', !oldTableCheck.rows[0].exists);

    // 데이터 개수 확인
    const countResult = await client.query('SELECT COUNT(*) FROM admin_mastercode_data;');
    console.log('📈 admin_mastercode_data 테이블 데이터 개수:', countResult.rows[0].count);

  } catch (error) {
    console.error('❌ 테이블명 변경 중 오류:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// 스크립트 실행
renameTable();