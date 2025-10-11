const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugSaveData() {
  console.log('🐛 저장된 데이터 디버깅...');

  try {
    // 최신 데이터 확인
    const { data, error } = await supabase
      .from('it_education_data')
      .select('id, education_name, achievements, improvements, education_feedback, report_notes, updated_at')
      .eq('id', 18)
      .single();

    if (error) {
      console.error('❌ 데이터 조회 실패:', error);
      return;
    }

    console.log('\n🔍 ID 18번 교육 데이터 상세 분석:');
    console.log(`교육명: "${data.education_name}"`);
    console.log(`업데이트 시간: ${data.updated_at}`);

    console.log('\n📋 교육실적보고 필드 분석:');
    console.log(`성과:`);
    console.log(`  - 값: "${data.achievements}"`);
    console.log(`  - 타입: ${typeof data.achievements}`);
    console.log(`  - 길이: ${(data.achievements || '').length}`);
    console.log(`  - null 여부: ${data.achievements === null}`);
    console.log(`  - 빈 문자열 여부: ${data.achievements === ''}`);

    console.log(`\n개선사항:`);
    console.log(`  - 값: "${data.improvements}"`);
    console.log(`  - 타입: ${typeof data.improvements}`);
    console.log(`  - 길이: ${(data.improvements || '').length}`);
    console.log(`  - null 여부: ${data.improvements === null}`);
    console.log(`  - 빈 문자열 여부: ${data.improvements === ''}`);

    console.log(`\n교육소감:`);
    console.log(`  - 값: "${data.education_feedback}"`);
    console.log(`  - 타입: ${typeof data.education_feedback}`);
    console.log(`  - 길이: ${(data.education_feedback || '').length}`);
    console.log(`  - null 여부: ${data.education_feedback === null}`);
    console.log(`  - 빈 문자열 여부: ${data.education_feedback === ''}`);

    console.log(`\n비고:`);
    console.log(`  - 값: "${data.report_notes}"`);
    console.log(`  - 타입: ${typeof data.report_notes}`);
    console.log(`  - 길이: ${(data.report_notes || '').length}`);
    console.log(`  - null 여부: ${data.report_notes === null}`);
    console.log(`  - 빈 문자열 여부: ${data.report_notes === ''}`);

    // 테스트 데이터로 직접 업데이트
    console.log('\n🧪 테스트 데이터로 업데이트 시도...');
    const testData = {
      achievements: '테스트 성과 데이터입니다.',
      improvements: '테스트 개선사항 데이터입니다.',
      education_feedback: '테스트 교육소감 데이터입니다.',
      report_notes: '테스트 비고 데이터입니다.',
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('it_education_data')
      .update(testData)
      .eq('id', 18);

    if (updateError) {
      console.error('❌ 테스트 업데이트 실패:', updateError);
    } else {
      console.log('✅ 테스트 업데이트 성공');
    }

  } catch (err) {
    console.error('❌ 디버깅 중 오류:', err);
  }
}

debugSaveData();