require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

async function testImprovementInsert() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  console.log('🔗 Supabase URL:', supabaseUrl);
  console.log('🔗 Supabase Key 존재:', !!supabaseKey);

  const supabase = createClient(supabaseUrl, supabaseKey);

  try {
    // 1. 연결 테스트
    console.log('\n1️⃣ 연결 테스트');
    const { count, error: countError } = await supabase
      .from('security_accident_improvement')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.error('❌ 연결 테스트 실패:', countError);
      return;
    }

    console.log('✅ 연결 성공, 현재 레코드 수:', count);

    // 2. 사고 데이터 확인
    console.log('\n2️⃣ 사고 데이터 확인');
    const { data: accidents, error: accidentError } = await supabase
      .from('security_accident_data')
      .select('id, code, main_content')
      .limit(1)
      .order('id', { ascending: false });

    if (accidentError) {
      console.error('❌ 사고 데이터 조회 실패:', accidentError);
      return;
    }

    if (!accidents || accidents.length === 0) {
      console.error('❌ 사고 데이터가 없습니다.');
      return;
    }

    const accident = accidents[0];
    console.log('✅ 사고 데이터:', accident);

    // 3. 개선사항 데이터 삽입 테스트
    console.log('\n3️⃣ 개선사항 삽입 테스트');
    const testData = {
      accident_id: accident.id,
      plan: '테스트 개선사항 - ' + new Date().toLocaleTimeString(),
      status: '미완료',
      assignee: '테스트 담당자'
    };

    console.log('📝 삽입할 데이터:', testData);

    const { data: insertResult, error: insertError } = await supabase
      .from('security_accident_improvement')
      .insert(testData)
      .select()
      .single();

    if (insertError) {
      console.error('❌ 삽입 실패:', insertError);
      console.error('❌ Error 상세:', JSON.stringify(insertError, null, 2));
      return;
    }

    console.log('✅ 삽입 성공:', insertResult);

    // 4. 삽입된 데이터 확인
    console.log('\n4️⃣ 삽입된 데이터 확인');
    const { data: allData, error: selectError } = await supabase
      .from('security_accident_improvement')
      .select('*')
      .eq('accident_id', accident.id);

    if (selectError) {
      console.error('❌ 조회 실패:', selectError);
      return;
    }

    console.log('✅ 해당 사고의 개선사항들:', allData);

  } catch (error) {
    console.error('❌ 전체 오류:', error);
  }
}

testImprovementInsert();