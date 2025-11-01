const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function addChangelogColumns() {
  // .env.local에서 DATABASE_URL 읽기
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error('❌ DATABASE_URL이 .env.local 파일에 설정되지 않았습니다.');
    process.exit(1);
  }

  const client = new Client({
    connectionString: databaseUrl,
  });

  try {
    console.log('🔌 PostgreSQL 연결 중...');
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공\n');

    // SQL 파일 읽기
    const sqlFile = path.join(__dirname, 'add_change_location_title_columns.sql');
    const sql = fs.readFileSync(sqlFile, 'utf8');

    console.log('📝 실행할 SQL:');
    console.log('─'.repeat(50));
    console.log(sql);
    console.log('─'.repeat(50));
    console.log('');

    // SQL 실행
    console.log('⚙️  SQL 실행 중...\n');
    const result = await client.query(sql);

    console.log('✅ SQL 실행 완료\n');

    // 확인 쿼리 실행
    console.log('🔍 컬럼 추가 확인 중...');
    const checkResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'common_log_data'
        AND column_name IN ('change_location', 'title')
      ORDER BY column_name;
    `);

    if (checkResult.rows.length === 2) {
      console.log('✅ 컬럼 추가 성공!\n');
      console.table(checkResult.rows);
    } else {
      console.log('⚠️  컬럼 추가 확인 실패');
      console.log('결과:', checkResult.rows);
    }

    // 테스트 데이터 삽입
    console.log('\n🧪 테스트 데이터 삽입 중...');
    const testInsert = await client.query(`
      INSERT INTO common_log_data (
        page,
        record_id,
        action_type,
        description,
        title,
        change_location,
        user_name,
        team,
        created_at
      ) VALUES (
        'test_page',
        'TEST-001',
        '테스트',
        '칸반탭 위치 추적 테스트',
        '테스트 제목',
        '칸반탭',
        '시스템',
        '테스트팀',
        NOW()
      ) RETURNING *;
    `);

    console.log('✅ 테스트 데이터 삽입 성공!');
    console.table(testInsert.rows);

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error('상세 정보:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n🔌 PostgreSQL 연결 종료');
  }
}

addChangelogColumns();
