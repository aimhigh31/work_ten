require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function addEvaluationCriteriaColumns() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '✅' : '❌');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅' : '❌');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅' : '❌');
    return;
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    console.log('✅ Supabase 연결 성공');
    console.log('📝 평가기준표 컬럼 추가 작업을 SQL Editor에서 수동으로 진행해주세요.');
    console.log('\n다음 SQL을 Supabase Dashboard > SQL Editor에서 실행하세요:');
    console.log('\n' + '='.repeat(80));
    console.log(`
-- main_kpi_data 테이블에 평가기준표 관련 컬럼 추가

-- 선정배경 컬럼 추가
ALTER TABLE main_kpi_data
ADD COLUMN IF NOT EXISTS selection_background TEXT;

-- 영향도 컬럼 추가
ALTER TABLE main_kpi_data
ADD COLUMN IF NOT EXISTS impact TEXT;

-- 평가기준표 컬럼 추가 (S, A, B, C, D 등급)
ALTER TABLE main_kpi_data
ADD COLUMN IF NOT EXISTS evaluation_criteria_s TEXT;

ALTER TABLE main_kpi_data
ADD COLUMN IF NOT EXISTS evaluation_criteria_a TEXT;

ALTER TABLE main_kpi_data
ADD COLUMN IF NOT EXISTS evaluation_criteria_b TEXT;

ALTER TABLE main_kpi_data
ADD COLUMN IF NOT EXISTS evaluation_criteria_c TEXT;

ALTER TABLE main_kpi_data
ADD COLUMN IF NOT EXISTS evaluation_criteria_d TEXT;

-- 컬럼 추가 확인
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'main_kpi_data'
  AND column_name IN (
    'selection_background',
    'impact',
    'evaluation_criteria_s',
    'evaluation_criteria_a',
    'evaluation_criteria_b',
    'evaluation_criteria_c',
    'evaluation_criteria_d'
  )
ORDER BY column_name;
    `);
    console.log('='.repeat(80));

    // 테이블 구조 확인
    const { data, error } = await supabase.from('main_kpi_data').select('*').limit(1);

    if (error) {
      console.error('❌ 테이블 조회 오류:', error);
    } else {
      console.log('\n✅ 현재 main_kpi_data 테이블 컬럼:');
      if (data && data.length > 0) {
        console.log(Object.keys(data[0]).join(', '));
      }
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  }
}

addEvaluationCriteriaColumns();
