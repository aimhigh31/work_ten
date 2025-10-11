const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testEducationReportUpdate() {
  console.log('🧪 교육실적보고 테스트 데이터 업데이트...');

  try {
    // ID 18번 교육에 테스트 데이터 업데이트
    const testData = {
      achievements: '참석자 95%가 교육 목표를 달성했으며, 실무 적용 능력이 크게 향상되었습니다.',
      improvements: '실습 시간을 늘리고, 더 다양한 예제를 제공할 필요가 있습니다.',
      education_feedback: '매우 유익한 교육이었으며, 업무에 바로 적용할 수 있는 내용들로 구성되어 있어 만족도가 높았습니다.',
      report_notes: '다음 교육에서는 고급 과정도 개설을 검토해보겠습니다.',
      updated_at: new Date().toISOString()
    };

    const { error: updateError } = await supabase
      .from('it_education_data')
      .update(testData)
      .eq('id', 18);

    if (updateError) {
      console.error('❌ 업데이트 실패:', updateError);
      return;
    }

    console.log('✅ 교육실적보고 테스트 데이터 업데이트 완료');

    // 업데이트된 데이터 확인
    const { data: updatedData, error: selectError } = await supabase
      .from('it_education_data')
      .select('id, education_name, achievements, improvements, education_feedback, report_notes')
      .eq('id', 18)
      .single();

    if (selectError) {
      console.error('❌ 데이터 조회 실패:', selectError);
      return;
    }

    console.log('\n📊 업데이트된 교육실적보고 데이터:');
    console.log(`교육명: ${updatedData.education_name}`);
    console.log(`성과: ${updatedData.achievements}`);
    console.log(`개선사항: ${updatedData.improvements}`);
    console.log(`교육소감: ${updatedData.education_feedback}`);
    console.log(`비고: ${updatedData.report_notes}`);

  } catch (err) {
    console.error('❌ 테스트 실행 중 오류:', err);
  }
}

testEducationReportUpdate();