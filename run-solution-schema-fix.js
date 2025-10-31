// PostgreSQL 직접 연결로 스키마 수정 실행
require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

// DATABASE_URL 파싱
const dbUrl = process.env.DATABASE_URL;
console.log('🔗 데이터베이스 URL:', dbUrl);

// URL에서 연결 정보 추출
const url = new URL(dbUrl);
const config = {
  host: url.hostname,
  port: parseInt(url.port || '5432'),
  database: url.pathname.slice(1),
  user: url.username,
  password: decodeURIComponent(url.password),
  ssl: { rejectUnauthorized: false }
};

console.log('📋 연결 정보:');
console.log('  - Host:', config.host);
console.log('  - Port:', config.port);
console.log('  - Database:', config.database);
console.log('  - User:', config.user);

const client = new Client(config);

async function runSchemaFix() {
  try {
    console.log('\n🔌 데이터베이스 연결 중...');
    await client.connect();
    console.log('✅ 연결 성공\n');

    // ALTER TABLE 쿼리 실행
    const alterQueries = [
      {
        name: 'status 컬럼',
        sql: 'ALTER TABLE it_solution_data ALTER COLUMN status TYPE varchar(50);'
      },
      {
        name: 'solution_type 컬럼',
        sql: 'ALTER TABLE it_solution_data ALTER COLUMN solution_type TYPE varchar(50);'
      },
      {
        name: 'development_type 컬럼',
        sql: 'ALTER TABLE it_solution_data ALTER COLUMN development_type TYPE varchar(50);'
      },
      {
        name: 'code 컬럼',
        sql: 'ALTER TABLE it_solution_data ALTER COLUMN code TYPE varchar(50);'
      },
      {
        name: 'team 컬럼',
        sql: 'ALTER TABLE it_solution_data ALTER COLUMN team TYPE varchar(50);'
      }
    ];

    for (const query of alterQueries) {
      try {
        console.log(`🔧 ${query.name} 확장 중... (varchar(10) → varchar(50))`);
        await client.query(query.sql);
        console.log(`✅ ${query.name} 확장 완료`);
      } catch (error) {
        console.error(`❌ ${query.name} 확장 실패:`, error.message);
      }
    }

    // 결과 확인
    console.log('\n📊 변경 결과 확인:');
    const checkResult = await client.query(`
      SELECT
        column_name,
        data_type,
        character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'it_solution_data'
        AND column_name IN ('status', 'solution_type', 'development_type', 'code', 'team')
      ORDER BY column_name;
    `);

    console.table(checkResult.rows);

    console.log('\n✅ 스키마 수정 완료!');
    console.log('이제 솔루션 관리 페이지에서 상태 변경이 정상적으로 작동합니다.');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  } finally {
    await client.end();
    console.log('\n🔌 연결 종료');
  }
}

runSchemaFix();
