const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

// PostgreSQL 직접 연결 (Supabase URL에서 추출)
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Supabase URL에서 프로젝트 ID 추출
const projectId = supabaseUrl.match(/https:\/\/(.+)\.supabase\.co/)[1];

// PostgreSQL 연결 정보 (환경변수에서 가져오기)
const connectionString = process.env.DATABASE_URL || `postgresql://postgres.[프로젝트ID]:[비밀번호]@aws-0-ap-northeast-2.pooler.supabase.com:5432/postgres`;

console.log('⚠️  주의: DB CHECK 제약조건을 제거합니다.');
console.log('📌 프로젝트 ID:', projectId);

async function removeConstraints() {
  const client = new Client({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공');

    // 1. investment_type CHECK 제약조건 제거
    console.log('\n🔧 investment_type CHECK 제약조건 제거 중...');
    await client.query(`
      ALTER TABLE plan_investment_data
      DROP CONSTRAINT IF EXISTS plan_investment_data_investment_type_check;
    `);
    console.log('✅ investment_type CHECK 제약조건 제거 완료');

    // 2. team CHECK 제약조건 제거
    console.log('\n🔧 team CHECK 제약조건 제거 중...');
    await client.query(`
      ALTER TABLE plan_investment_data
      DROP CONSTRAINT IF EXISTS plan_investment_data_team_check;
    `);
    console.log('✅ team CHECK 제약조건 제거 완료');

    // 3. status CHECK 제약조건 제거
    console.log('\n🔧 status CHECK 제약조건 제거 중...');
    await client.query(`
      ALTER TABLE plan_investment_data
      DROP CONSTRAINT IF EXISTS plan_investment_data_status_check;
    `);
    console.log('✅ status CHECK 제약조건 제거 완료');

    // 4. risk_level CHECK 제약조건 제거
    console.log('\n🔧 risk_level CHECK 제약조건 제거 중...');
    await client.query(`
      ALTER TABLE plan_investment_data
      DROP CONSTRAINT IF EXISTS plan_investment_data_risk_level_check;
    `);
    console.log('✅ risk_level CHECK 제약조건 제거 완료');

    // 5. no UNIQUE 제약조건 제거 (이미 NULL 허용이지만 UNIQUE는 남아있을 수 있음)
    console.log('\n🔧 no UNIQUE 제약조건 제거 중...');
    await client.query(`
      ALTER TABLE plan_investment_data
      DROP CONSTRAINT IF EXISTS plan_investment_data_no_key;
    `);
    console.log('✅ no UNIQUE 제약조건 제거 완료');

    console.log('\n🎉 모든 제약조건 제거 완료!');
    console.log('이제 투자 데이터를 자유롭게 등록할 수 있습니다.');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error('상세:', error);
  } finally {
    await client.end();
    console.log('\n✅ PostgreSQL 연결 종료');
  }
}

removeConstraints();
