const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function removeTeamConstraint() {
  // DATABASE_URL 사용
  const connectionString = process.env.DATABASE_URL;

  if (!connectionString) {
    console.error('❌ DATABASE_URL이 .env.local에 없습니다.');
    return;
  }

  console.log('🔧 PostgreSQL 연결 시작...');
  console.log('📍 연결 문자열:', connectionString.replace(/:[^:@]+@/, ':****@'));

  const client = new Client({
    connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공!');

    // 제약조건 제거
    console.log('🔧 chk_team 제약조건 제거 중...');
    const result = await client.query(`
      ALTER TABLE admin_checklist_data
      DROP CONSTRAINT IF EXISTS chk_team;
    `);

    console.log('✅ chk_team 제약조건이 성공적으로 제거되었습니다!');
    console.log('📋 결과:', result);

  } catch (err) {
    console.error('💥 오류 발생:', err);
    console.error('상세 오류:', err.message);

    console.log('\n⚠️ 자동 실행 실패. Supabase SQL Editor에서 수동으로 실행하세요:');
    console.log(`
    ALTER TABLE admin_checklist_data
    DROP CONSTRAINT IF EXISTS chk_team;
    `);
  } finally {
    await client.end();
    console.log('🔌 연결 종료');
  }
}

removeTeamConstraint();
