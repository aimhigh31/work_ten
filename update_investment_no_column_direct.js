const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Supabase URL에서 호스트 추출
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다.');
  process.exit(1);
}

// URL에서 프로젝트 ID 추출
const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)[1];
const host = `db.${projectId}.supabase.co`;
const password = process.env.SUPABASE_DB_PASSWORD;

if (!password) {
  console.error('❌ SUPABASE_DB_PASSWORD가 설정되지 않았습니다.');
  console.log('💡 .env.local 파일에 SUPABASE_DB_PASSWORD를 설정해주세요.');
  process.exit(1);
}

// PostgreSQL 클라이언트 설정
const client = new Client({
  host: host,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: password,
  ssl: {
    rejectUnauthorized: false
  }
});

async function updateNoColumn() {
  try {
    console.log('🔌 데이터베이스 연결 중...');
    console.log('📍 호스트:', host);

    await client.connect();
    console.log('✅ 데이터베이스 연결 성공');

    console.log('\n🔄 no 컬럼을 NULL 허용으로 변경 중...');

    // no 컬럼을 NULL 허용으로 변경
    await client.query(`
      ALTER TABLE plan_investment_data
      ALTER COLUMN no DROP NOT NULL;
    `);
    console.log('✅ no 컬럼이 NULL 허용으로 변경되었습니다.');

    // 기존 데이터의 no를 NULL로 설정
    const result = await client.query(`
      UPDATE plan_investment_data
      SET no = NULL
      WHERE is_active = true
      RETURNING id;
    `);
    console.log(`✅ ${result.rowCount}개 레코드의 no가 NULL로 설정되었습니다.`);

    console.log('\n✅ 모든 작업이 완료되었습니다.');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error('상세:', error);
  } finally {
    await client.end();
    console.log('🔌 데이터베이스 연결 종료');
  }
}

updateNoColumn();
