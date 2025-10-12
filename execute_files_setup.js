const { Client } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function executeSQL() {
  // Supabase URL에서 PostgreSQL 연결 정보 추출
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('🔍 환경변수 확인:');
  console.log('SUPABASE_URL:', supabaseUrl);
  console.log('SUPABASE_KEY:', supabaseKey ? '✓ 존재함' : '✗ 없음');

  // Supabase Direct Database URL 패턴
  // supabase URL 형식: https://[project-ref].supabase.co
  // DB URL 형식: postgresql://postgres:[password]@db.[project-ref].supabase.co:5432/postgres

  const projectRef = supabaseUrl.match(/https:\/\/(.+?)\.supabase\.co/)?.[1];

  if (!projectRef) {
    console.error('❌ Supabase URL에서 프로젝트 참조를 추출할 수 없습니다.');
    process.exit(1);
  }

  console.log('📦 프로젝트 참조:', projectRef);
  console.log('');
  console.log('⚠️  PostgreSQL 직접 연결 정보가 필요합니다.');
  console.log('   Supabase Dashboard → Settings → Database → Connection string (Direct connection)');
  console.log('   형식: postgresql://postgres:[YOUR-PASSWORD]@db.[project-ref].supabase.co:5432/postgres');
  console.log('');
  console.log('환경변수에 SUPABASE_DB_URL을 추가하거나 아래 코드의 connectionString을 직접 설정해주세요.');
  console.log('');

  // .env.local에서 DATABASE_URL 또는 SUPABASE_DB_URL 읽기 시도
  const dbUrl = process.env.DATABASE_URL || process.env.SUPABASE_DB_URL;

  if (!dbUrl) {
    console.error('❌ DATABASE_URL 또는 SUPABASE_DB_URL 환경변수가 설정되지 않았습니다.');
    console.log('');
    console.log('📝 .env.local 파일에 다음을 추가하세요:');
    console.log('DATABASE_URL=postgresql://postgres:[YOUR-PASSWORD]@db.' + projectRef + '.supabase.co:5432/postgres');
    process.exit(1);
  }

  console.log('✅ DATABASE_URL 발견:', dbUrl.replace(/:[^:@]+@/, ':****@'));
  console.log('');

  // URL 디코딩 처리 (패스워드에 %로 인코딩된 특수문자가 있을 수 있음)
  let decodedUrl = dbUrl;
  try {
    // URL의 패스워드 부분만 디코딩
    const urlMatch = dbUrl.match(/(postgresql:\/\/[^:]+:)([^@]+)(@.+)/);
    if (urlMatch) {
      const [, prefix, password, suffix] = urlMatch;
      const decodedPassword = decodeURIComponent(password);
      decodedUrl = prefix + decodedPassword + suffix;
      console.log('🔓 패스워드 URL 디코딩 완료');
      console.log('');
    }
  } catch (e) {
    console.warn('⚠️  URL 디코딩 실패, 원본 URL 사용:', e.message);
  }

  const client = new Client({
    connectionString: decodedUrl,
  });

  try {
    console.log('🔌 PostgreSQL 연결 중...');
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공!');
    console.log('');

    // 1. common_files_data 테이블 생성
    console.log('📄 Step 1: common_files_data 테이블 생성 중...');
    const tableSQL = fs.readFileSync(path.join(__dirname, 'create_common_files_table.sql'), 'utf8');
    await client.query(tableSQL);
    console.log('✅ common_files_data 테이블 생성 완료!');
    console.log('');

    // 2. Storage 버킷 생성
    console.log('📄 Step 2: common-files Storage 버킷 생성 중...');
    const storageSQL = fs.readFileSync(path.join(__dirname, 'create_common_files_storage.sql'), 'utf8');
    await client.query(storageSQL);
    console.log('✅ common-files Storage 버킷 생성 완료!');
    console.log('');

    console.log('🎉 모든 설정이 완료되었습니다!');
    console.log('');
    console.log('✓ common_files_data 테이블 생성됨');
    console.log('✓ common-files Storage 버킷 생성됨');
    console.log('✓ RLS 정책 적용됨 (개발 환경: 모든 권한 허용)');
    console.log('');
    console.log('이제 보안교육관리 페이지에서 자료탭 파일 업로드를 테스트할 수 있습니다!');

  } catch (error) {
    console.error('❌ SQL 실행 중 오류 발생:');
    console.error('오류 메시지:', error.message);
    console.error('상세 정보:', error);
    process.exit(1);
  } finally {
    await client.end();
    console.log('');
    console.log('🔌 PostgreSQL 연결 종료');
  }
}

executeSQL();
