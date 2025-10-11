const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
  console.error('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅' : '❌');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addTeamColumn() {
  console.log('🚀 it_education_data 테이블에 team 컬럼 추가 시작...\n');

  try {
    // 1. team 컬럼 추가 SQL
    const addColumnSQL = `
      -- team 컬럼이 없으면 추가
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1
          FROM information_schema.columns
          WHERE table_name = 'it_education_data'
          AND column_name = 'team'
        ) THEN
          ALTER TABLE it_education_data ADD COLUMN team TEXT;
          RAISE NOTICE 'team 컬럼이 추가되었습니다.';
        ELSE
          RAISE NOTICE 'team 컬럼이 이미 존재합니다.';
        END IF;
      END $$;
    `;

    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: addColumnSQL
    });

    if (error) {
      // rpc 함수가 없을 수 있으므로 대안 방법 시도
      console.log('⚠️ rpc 실행 실패, 직접 insert 방식으로 테스트합니다.');

      // 테스트용으로 데이터 조회해서 team 컬럼 존재 여부 확인
      const { data: testData, error: testError } = await supabase
        .from('it_education_data')
        .select('id, team')
        .limit(1);

      if (testError) {
        if (testError.message.includes('column "team" does not exist')) {
          console.error('❌ team 컬럼이 존재하지 않습니다.');
          console.log('\n📝 Supabase Dashboard에서 직접 다음 SQL을 실행하세요:');
          console.log('\nALTER TABLE it_education_data ADD COLUMN team TEXT;\n');
        } else {
          console.error('❌ 오류:', testError);
        }
      } else {
        console.log('✅ team 컬럼이 이미 존재합니다.');
      }
    } else {
      console.log('✅ SQL 실행 완료:', data);
    }

    // 2. 현재 테이블 데이터 샘플 확인
    const { data: sampleData, error: sampleError } = await supabase
      .from('it_education_data')
      .select('*')
      .limit(1);

    if (!sampleError && sampleData && sampleData.length > 0) {
      console.log('\n📋 테이블 컬럼 목록:');
      Object.keys(sampleData[0]).forEach(key => {
        console.log(`  - ${key}`);
      });
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }

  console.log('\n✅ 작업 완료');
}

addTeamColumn();
