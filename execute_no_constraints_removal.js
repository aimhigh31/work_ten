const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

// DATABASE_URL에서 비밀번호 추출
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error('❌ DATABASE_URL이 설정되지 않았습니다.');
  process.exit(1);
}

// URL에서 정보 추출
const urlMatch = databaseUrl.match(/postgresql:\/\/([^:]+):([^@]+)@([^:]+):(\d+)\/(.+)/);
if (!urlMatch) {
  console.error('❌ DATABASE_URL 파싱 실패');
  process.exit(1);
}

const [, user, encodedPassword, host, port, database] = urlMatch;
const password = decodeURIComponent(encodedPassword);

console.log('📍 연결 정보:');
console.log('  호스트:', host);
console.log('  포트:', port);
console.log('  데이터베이스:', database);
console.log('  사용자:', user);

// PostgreSQL 클라이언트 설정
const client = new Client({
  host,
  port: parseInt(port),
  database,
  user,
  password,
  ssl: {
    rejectUnauthorized: false
  }
});

async function removeConstraints() {
  try {
    console.log('\n🔌 데이터베이스 연결 중...');
    await client.connect();
    console.log('✅ 데이터베이스 연결 성공\n');

    // 1. UNIQUE 제약조건 제거
    console.log('🔄 1단계: UNIQUE 제약조건 제거 중...');
    await client.query(`
      ALTER TABLE plan_investment_data
      DROP CONSTRAINT IF EXISTS plan_investment_data_no_key;
    `);
    console.log('✅ UNIQUE 제약조건 제거 완료');

    // 2. NOT NULL 제약조건 제거
    console.log('\n🔄 2단계: NOT NULL 제약조건 제거 중...');
    await client.query(`
      ALTER TABLE plan_investment_data
      ALTER COLUMN no DROP NOT NULL;
    `);
    console.log('✅ NOT NULL 제약조건 제거 완료');

    // 3. 기존 데이터의 no를 0으로 설정
    console.log('\n🔄 3단계: 기존 데이터의 no를 0으로 설정 중...');
    const result = await client.query(`
      UPDATE plan_investment_data
      SET no = 0
      WHERE is_active = true
      RETURNING id;
    `);
    console.log(`✅ ${result.rowCount}개 레코드의 no가 0으로 설정됨`);

    console.log('\n✅ 모든 작업이 완료되었습니다!');
    console.log('📝 이제 no는 프론트엔드에서만 역순정렬로 관리됩니다.');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error('상세:', error);
  } finally {
    await client.end();
    console.log('\n🔌 데이터베이스 연결 종료');
  }
}

removeConstraints();
