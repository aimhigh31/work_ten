// PostgreSQL 직접 연결을 통한 common_feedback_data 테이블 생성
const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function executeSQLFile() {
  // .env.local에서 DB 비밀번호 가져오기
  const dbPassword = process.env.SUPABASE_DB_PASSWORD || 'ghkdwls12#$';
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

  if (!supabaseUrl) {
    console.error('❌ NEXT_PUBLIC_SUPABASE_URL이 설정되지 않았습니다.');
    console.error('환경 변수:', process.env);
    process.exit(1);
  }

  // Supabase URL에서 프로젝트 정보 추출
  const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];
  if (!projectRef) {
    console.error('❌ Supabase URL에서 프로젝트 참조를 추출할 수 없습니다.');
    console.error('URL:', supabaseUrl);
    process.exit(1);
  }

  // PostgreSQL 클라이언트 설정
  const connectionString = `postgresql://postgres:${dbPassword}@db.${projectRef}.supabase.co:5432/postgres`;

  const client = new Client({
    connectionString: connectionString,
    ssl: { rejectUnauthorized: false }
  });
  console.log('🔌 PostgreSQL 직접 연결 중...');

  try {
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공');

    // SQL 파일 읽기
    const sqlFile = 'create_common_feedback_table.sql';
    console.log(`📖 ${sqlFile} 읽는 중...`);

    const sql = fs.readFileSync(sqlFile, 'utf8');
    console.log('✅ SQL 파일 로드 완료');

    // SQL 실행
    console.log('⚡ SQL 실행 중...');
    const result = await client.query(sql);

    console.log('✅ SQL 실행 성공');
    console.log('실행 결과:', result.command || 'Multiple commands executed');

    // 테이블 생성 확인
    console.log('🔍 테이블 생성 확인 중...');
    const checkResult = await client.query(`
      SELECT table_name, column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'common_feedback_data'
      ORDER BY ordinal_position;
    `);

    if (checkResult.rows.length > 0) {
      console.log('✅ common_feedback_data 테이블 생성 확인됨');
      console.log('테이블 구조:');
      checkResult.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type}`);
      });

      // RLS 정책 확인
      const policyCheck = await client.query(`
        SELECT policyname, cmd
        FROM pg_policies
        WHERE tablename = 'common_feedback_data';
      `);

      console.log('\n🔒 RLS 정책 확인:');
      if (policyCheck.rows.length > 0) {
        policyCheck.rows.forEach(row => {
          console.log(`  - ${row.policyname} (${row.cmd})`);
        });
      } else {
        console.log('  정책이 설정되지 않았습니다.');
      }

      // 인덱스 확인
      const indexCheck = await client.query(`
        SELECT indexname
        FROM pg_indexes
        WHERE tablename = 'common_feedback_data';
      `);

      console.log('\n📊 인덱스 확인:');
      if (indexCheck.rows.length > 0) {
        indexCheck.rows.forEach(row => {
          console.log(`  - ${row.indexname}`);
        });
      }

    } else {
      console.log('❌ 테이블 생성 확인 실패');
    }

  } catch (error) {
    console.error('❌ SQL 실행 오류:', error);
    console.error('오류 상세:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint,
      position: error.position
    });
  } finally {
    await client.end();
    console.log('\n🔌 PostgreSQL 연결 종료');
  }
}

// 실행
executeSQLFile().then(() => {
  console.log('🎉 SQL 실행 작업 완료');
  process.exit(0);
}).catch(error => {
  console.error('💥 작업 실패:', error);
  process.exit(1);
});
