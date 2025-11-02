const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkEvaluation() {
  try {
    const evaluationCode = 'HR-EVA-25-011';

    console.log(`🔍 평가 코드 "${evaluationCode}" 조회 중...\n`);

    const { data, error } = await supabase
      .from('hr_evaluation_data')
      .select('*')
      .eq('evaluation_code', evaluationCode)
      .single();

    if (error) {
      console.error('❌ 조회 오류:', error);
      process.exit(1);
    }

    if (!data) {
      console.log(`⚠️ 평가 코드 "${evaluationCode}"를 찾을 수 없습니다.`);
      return;
    }

    console.log('✅ 데이터 조회 성공!\n');
    console.log('📊 평가 정보:');
    console.log('='.repeat(80));
    console.log('평가 제목:', data.evaluation_title);
    console.log('평가 코드:', data.evaluation_code);
    console.log('체크리스트 ID:', data.checklist_id);
    console.log('평가 유형:', data.checklist_evaluation_type);
    console.log('='.repeat(80));

    console.log('\n📝 안내가이드 (checklist_guide):');
    console.log('='.repeat(80));
    if (data.checklist_guide && data.checklist_guide.trim() !== '') {
      console.log(data.checklist_guide);
    } else {
      console.log('❌ 안내가이드가 비어있습니다!');
      console.log('값 타입:', typeof data.checklist_guide);
      console.log('값:', JSON.stringify(data.checklist_guide));
    }
    console.log('='.repeat(80));

    // 체크리스트 데이터도 조회
    if (data.checklist_id) {
      console.log('\n🔍 체크리스트 데이터 조회 중...');
      const { data: checklistData, error: checklistError } = await supabase
        .from('admin_checklist_management')
        .select('*')
        .eq('id', data.checklist_id)
        .single();

      if (checklistError) {
        console.error('❌ 체크리스트 조회 오류:', checklistError);
      } else if (checklistData) {
        console.log('✅ 체크리스트 정보:');
        console.log('  제목:', checklistData.title);
        console.log('  평가유형:', checklistData.evaluation_type);
        console.log('  안내가이드:', checklistData.guide || '(없음)');
      }
    }

  } catch (err) {
    console.error('❌ 실행 중 오류:', err);
    process.exit(1);
  }
}

checkEvaluation();
