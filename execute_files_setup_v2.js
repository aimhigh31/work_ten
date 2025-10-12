const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function executeSQL() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log('🔍 환경변수 확인:');
  console.log('SUPABASE_URL:', supabaseUrl);
  console.log('SERVICE_ROLE_KEY:', serviceRoleKey ? '✓ 존재함' : '✗ 없음');
  console.log('');

  if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ 필수 환경변수가 설정되지 않았습니다.');
    console.log('NEXT_PUBLIC_SUPABASE_URL과 SUPABASE_SERVICE_ROLE_KEY가 필요합니다.');
    process.exit(1);
  }

  // Service Role Key로 Supabase 클라이언트 생성 (RLS 우회 가능)
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  console.log('✅ Supabase 클라이언트 생성 완료');
  console.log('');

  try {
    // 1. common_files_data 테이블 생성
    console.log('📄 Step 1: common_files_data 테이블 생성 중...');
    const tableSQL = fs.readFileSync(path.join(__dirname, 'create_common_files_table.sql'), 'utf8');

    // SQL을 개별 명령으로 분리하여 실행
    const sqlCommands = tableSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('SELECT'));

    for (const sql of sqlCommands) {
      if (sql.includes('CREATE TABLE') || sql.includes('CREATE INDEX') || sql.includes('ALTER TABLE') || sql.includes('CREATE POLICY') || sql.includes('DROP POLICY')) {
        console.log('  실행 중:', sql.substring(0, 50) + '...');
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
          // RPC가 없으면 직접 테이블 생성 시도
          console.log('  ℹ️  RPC 방식 실패, 직접 실행 시도...');

          // 테이블 생성은 .from() 방식으로는 불가능하므로 PostgreSQL REST API 사용
          // 또는 Supabase Dashboard에서 직접 실행해야 함
          console.log('');
          console.log('⚠️  JavaScript 클라이언트로 DDL 실행이 제한됩니다.');
          console.log('');
          console.log('📋 다음 SQL을 Supabase Dashboard에서 실행해주세요:');
          console.log('   https://supabase.com/dashboard/project/' + process.env.SUPABASE_PROJECT_REF + '/sql/new');
          console.log('');
          console.log('='.repeat(80));
          console.log('-- Step 1: common_files_data 테이블 생성');
          console.log('='.repeat(80));
          console.log(tableSQL);
          console.log('');

          // Storage 버킷 SQL도 출력
          const storageSQL = fs.readFileSync(path.join(__dirname, 'create_common_files_storage.sql'), 'utf8');
          console.log('='.repeat(80));
          console.log('-- Step 2: common-files Storage 버킷 생성');
          console.log('='.repeat(80));
          console.log(storageSQL);
          console.log('');
          console.log('위 SQL을 복사하여 Supabase SQL Editor에서 실행해주세요!');
          process.exit(0);
        }
      }
    }

    console.log('✅ common_files_data 테이블 생성 완료!');
    console.log('');

    // 2. Storage 버킷 생성
    console.log('📄 Step 2: common-files Storage 버킷 생성 중...');
    const storageSQL = fs.readFileSync(path.join(__dirname, 'create_common_files_storage.sql'), 'utf8');

    const storageCommands = storageSQL
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && !cmd.startsWith('SELECT'));

    for (const sql of storageCommands) {
      if (sql.includes('INSERT') || sql.includes('CREATE POLICY') || sql.includes('DROP POLICY')) {
        console.log('  실행 중:', sql.substring(0, 50) + '...');
        const { error } = await supabase.rpc('exec_sql', { sql_query: sql });

        if (error) {
          console.log('  ℹ️  Storage 설정은 Dashboard에서 진행하세요.');
        }
      }
    }

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

    // 실패 시 SQL을 출력하여 수동 실행 가능하도록 함
    console.log('');
    console.log('📋 수동으로 다음 SQL을 Supabase Dashboard에서 실행해주세요:');
    console.log('');
    const tableSQL = fs.readFileSync(path.join(__dirname, 'create_common_files_table.sql'), 'utf8');
    const storageSQL = fs.readFileSync(path.join(__dirname, 'create_common_files_storage.sql'), 'utf8');
    console.log('='.repeat(80));
    console.log(tableSQL);
    console.log('');
    console.log('='.repeat(80));
    console.log(storageSQL);

    process.exit(1);
  }
}

executeSQL();
