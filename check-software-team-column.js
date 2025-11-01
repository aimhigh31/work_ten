const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSoftwareTeamColumn() {
  console.log('🔍 소프트웨어관리 테이블의 team 컬럼 정보 확인 중...\n');

  // 1. 테이블 스키마 확인 (PostgreSQL 시스템 카탈로그 조회)
  const { data: columns, error: schemaError } = await supabase
    .rpc('exec_sql', {
      sql: `
        SELECT
          column_name,
          data_type,
          character_maximum_length,
          is_nullable
        FROM information_schema.columns
        WHERE table_name = 'it_software_data'
          AND column_name = 'team'
      `
    });

  if (schemaError) {
    console.log('⚠️  RPC 방식 실패, 직접 조회 시도...\n');

    // 대체 방법: 실제 데이터를 조회해서 추론
    const { data: sampleData, error: dataError } = await supabase
      .from('it_software_data')
      .select('team')
      .limit(5);

    if (dataError) {
      console.error('❌ 데이터 조회 실패:', dataError);
      return;
    }

    console.log('📊 소프트웨어관리 테이블 샘플 데이터:');
    console.log('테이블명: it_software_data');
    console.log('\n샘플 team 값들:');
    sampleData.forEach((row, idx) => {
      console.log(`  ${idx + 1}. "${row.team}" (길이: ${row.team?.length || 0}자)`);
    });

    console.log('\n💡 team 컬럼 타입 추론:');
    const maxLength = Math.max(...sampleData.map(row => row.team?.length || 0));
    console.log(`  - 최대 길이: ${maxLength}자`);
    console.log(`  - 추정: varchar(50) 이상으로 보임 (한글 저장 가능)`);

  } else {
    console.log('✅ 컬럼 정보 조회 성공:');
    console.table(columns);
  }

  // 2. 솔루션관리 테이블도 비교
  console.log('\n\n🔍 솔루션관리 테이블의 team 컬럼 정보 확인 중...\n');

  const { data: solutionSample, error: solutionError } = await supabase
    .from('it_solution_data')
    .select('team')
    .limit(5);

  if (solutionError) {
    console.error('❌ 솔루션 데이터 조회 실패:', solutionError);
  } else {
    console.log('📊 솔루션관리 테이블 샘플 데이터:');
    console.log('테이블명: it_solution_data');
    console.log('\n샘플 team 값들:');
    solutionSample.forEach((row, idx) => {
      const teamValue = row.team || '(null)';
      const byteLength = Buffer.from(teamValue).length;
      console.log(`  ${idx + 1}. "${teamValue}" (길이: ${teamValue.length}자, 바이트: ${byteLength})`);
    });
  }
}

checkSoftwareTeamColumn();
