const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function removeTeamConstraint() {
  const client = new Client({
    connectionString: process.env.NEXT_PUBLIC_SUPABASE_URL?.replace('https://', 'postgresql://postgres:') + '/postgres',
    ssl: { rejectUnauthorized: false }
  });

  try {
    console.log('🔧 PostgreSQL 직접 연결 시도...');

    // Supabase URL에서 프로젝트 참조 추출
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

    if (!projectRef) {
      throw new Error('Supabase URL에서 프로젝트 참조를 찾을 수 없습니다.');
    }

    console.log('📍 프로젝트 참조:', projectRef);

    // 실제 연결 문자열 구성
    const connectionString = `postgresql://postgres.${projectRef}:${process.env.SUPABASE_DB_PASSWORD}@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres`;

    const pgClient = new Client({
      connectionString,
      ssl: { rejectUnauthorized: false }
    });

    await pgClient.connect();
    console.log('✅ PostgreSQL 연결 성공!');

    // 제약조건 제거
    const result = await pgClient.query(`
      ALTER TABLE admin_checklist_data
      DROP CONSTRAINT IF EXISTS chk_team;
    `);

    console.log('✅ chk_team 제약조건이 성공적으로 제거되었습니다!');
    console.log('📋 결과:', result);

    await pgClient.end();
    console.log('🔌 연결 종료');

  } catch (err) {
    console.error('💥 오류 발생:', err);
    console.error('상세 오류:', err.message);

    console.log('\n⚠️ 자동 실행 실패. 수동으로 Supabase SQL Editor에서 실행하세요:');
    console.log(`
    ALTER TABLE admin_checklist_data
    DROP CONSTRAINT IF EXISTS chk_team;
    `);
  }
}

removeTeamConstraint();
