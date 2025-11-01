// PostgreSQL 직접 연결을 통한 team 컬럼 크기 수정
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

// PostgreSQL 클라이언트 설정
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

async function fixSolutionTeamColumn() {
  console.log('🔌 PostgreSQL 직접 연결 중...');

  try {
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공\n');

    // 1. 현재 컬럼 정보 확인
    console.log('📊 현재 team 컬럼 정보 확인:');
    const columnInfo = await client.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'it_solution_data' AND column_name = 'team';
    `);

    if (columnInfo.rows.length > 0) {
      console.log('현재 설정:', columnInfo.rows[0]);
    }

    // 2. 현재 데이터 확인
    console.log('\n📊 현재 team 데이터 샘플:');
    const beforeData = await client.query(`
      SELECT id, code, team
      FROM it_solution_data
      WHERE team IS NOT NULL
      LIMIT 5;
    `);
    console.table(beforeData.rows);

    // 3. ALTER TABLE 실행
    console.log('\n🔧 team 컬럼 타입 변경 중: varchar(10) → varchar(50)');
    await client.query(`
      ALTER TABLE it_solution_data
      ALTER COLUMN team TYPE varchar(50);
    `);
    console.log('✅ team 컬럼 타입 변경 완료!');

    // 4. 변경 후 컬럼 정보 확인
    console.log('\n📊 변경 후 team 컬럼 정보:');
    const updatedColumnInfo = await client.query(`
      SELECT column_name, data_type, character_maximum_length
      FROM information_schema.columns
      WHERE table_name = 'it_solution_data' AND column_name = 'team';
    `);

    if (updatedColumnInfo.rows.length > 0) {
      console.log('변경된 설정:', updatedColumnInfo.rows[0]);
    }

    console.log('\n✅ 작업 완료! 이제 한글 부서명을 저장할 수 있습니다.');
    console.log('예: "경영기획SF팀" (7글자 = 21바이트) → varchar(50)에 저장 가능 ✅');

  } catch (error) {
    console.error('❌ SQL 실행 오류:', error);
    console.error('오류 상세:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
  } finally {
    await client.end();
    console.log('\n🔌 PostgreSQL 연결 종료');
  }
}

// 실행
fixSolutionTeamColumn().then(() => {
  console.log('🎉 작업 완료');
  process.exit(0);
}).catch(error => {
  console.error('💥 작업 실패:', error);
  process.exit(1);
});
