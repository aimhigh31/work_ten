require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testStep5Process() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('🧪 Step5 프로세스 테스트 시작');

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. 최신 사고 데이터 확인
    const { data: accidents, error: accidentError } = await supabase
      .from('security_accident_data')
      .select('id, code, main_content')
      .order('id', { ascending: false })
      .limit(1);

    if (accidentError || !accidents || accidents.length === 0) {
      console.error('❌ 사고 데이터 조회 실패:', accidentError);
      return;
    }

    const accident = accidents[0];
    console.log(`✅ 테스트 대상 사고: ID ${accident.id}, 코드 ${accident.code}`);

    // 2. 기존 개선사항 확인
    const { data: existingImprovements } = await supabase
      .from('security_accident_improvement')
      .select('*')
      .eq('accident_id', accident.id)
      .eq('is_active', true);

    console.log(`📊 기존 개선사항 개수: ${existingImprovements?.length || 0}`);

    // 3. 테스트 개선사항 데이터 생성
    const testImprovements = [
      {
        accident_id: accident.id,
        plan: '테스트 개선사항 1 - ' + new Date().toLocaleTimeString(),
        status: '미완료',
        assignee: '테스트 담당자1'
      },
      {
        accident_id: accident.id,
        plan: '테스트 개선사항 2 - ' + new Date().toLocaleTimeString(),
        status: '진행중',
        completion_date: '2024-12-31',
        assignee: '테스트 담당자2'
      }
    ];

    // 4. data_relation.md 패턴 테스트: 삭제 후 재저장
    console.log('\n🗑️ 기존 데이터 삭제 중...');

    const { error: deleteError } = await supabase
      .from('security_accident_improvement')
      .delete()
      .eq('accident_id', accident.id);

    if (deleteError) {
      console.error('❌ 삭제 실패:', deleteError);
      return;
    }

    console.log('✅ 기존 데이터 삭제 완료');

    // 5. 새 데이터 삽입
    console.log('\n💾 새 데이터 삽입 중...');

    const { data: insertedData, error: insertError } = await supabase
      .from('security_accident_improvement')
      .insert(testImprovements)
      .select();

    if (insertError) {
      console.error('❌ 삽입 실패:', insertError);
      return;
    }

    console.log('✅ 새 데이터 삽입 완료:', insertedData.length, '개');

    // 6. 최종 확인
    const { data: finalData } = await supabase
      .from('security_accident_improvement')
      .select('*')
      .eq('accident_id', accident.id)
      .eq('is_active', true);

    console.log('\n📈 최종 결과:');
    console.table(finalData.map(item => ({
      id: item.id,
      plan: item.plan,
      status: item.status,
      assignee: item.assignee,
      completion_date: item.completion_date
    })));

    console.log('\n🎉 Step5 프로세스 테스트 성공!');

  } catch (error) {
    console.error('💥 테스트 중 오류:', error);
  }
}

testStep5Process();