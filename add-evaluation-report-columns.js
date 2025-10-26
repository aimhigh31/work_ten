// hr_evaluation_data 테이블에 평가성과보고 컬럼 추가
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addReportColumns() {
  try {
    console.log('🔄 Supabase 연결 시작...');

    // RPC를 사용하여 SQL 실행
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE hr_evaluation_data
        ADD COLUMN IF NOT EXISTS performance TEXT,
        ADD COLUMN IF NOT EXISTS improvements TEXT,
        ADD COLUMN IF NOT EXISTS thoughts TEXT,
        ADD COLUMN IF NOT EXISTS notes TEXT;
      `
    });

    if (error) {
      // RPC 함수가 없을 수 있으므로, 직접 테이블 확인
      console.log('⚠️ RPC 방식 실패, 테이블 직접 확인 시도...');

      // 테스트용: 한 행을 조회해서 컬럼이 있는지 확인
      const { data: testData, error: testError } = await supabase
        .from('hr_evaluation_data')
        .select('id, performance, improvements, thoughts, notes')
        .limit(1);

      if (testError) {
        if (testError.message.includes('column') && testError.message.includes('does not exist')) {
          console.error('❌ 컬럼이 존재하지 않습니다. Supabase Dashboard에서 직접 추가해야 합니다.');
          console.log('\n📝 Supabase Dashboard SQL Editor에서 다음 SQL을 실행하세요:');
          console.log('----------------------------------------------------');
          console.log(`
ALTER TABLE hr_evaluation_data
ADD COLUMN IF NOT EXISTS performance TEXT,
ADD COLUMN IF NOT EXISTS improvements TEXT,
ADD COLUMN IF NOT EXISTS thoughts TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 컬럼에 대한 주석 추가
COMMENT ON COLUMN hr_evaluation_data.performance IS '평가 성과';
COMMENT ON COLUMN hr_evaluation_data.improvements IS '개선사항';
COMMENT ON COLUMN hr_evaluation_data.thoughts IS '평가소감';
COMMENT ON COLUMN hr_evaluation_data.notes IS '비고';
          `);
          console.log('----------------------------------------------------\n');
        } else {
          throw testError;
        }
      } else {
        console.log('✅ 컬럼이 이미 존재합니다!');
        console.log('📊 테스트 조회 성공:', testData);
      }
    } else {
      console.log('✅ 평가성과보고 컬럼 추가 완료');
      console.log('📊 결과:', data);
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

addReportColumns();
