const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function generateItEducationCode() {
  try {
    const { data, error } = await supabase
      .from('it_education_data')
      .select('code')
      .order('id', { ascending: false })
      .limit(1);

    if (error) {
      console.error('IT교육 코드 조회 실패:', error);
    }

    const currentYear = new Date().getFullYear().toString().slice(-2);
    const currentData = data && data.length > 0 ? data[0] : null;

    if (currentData?.code) {
      const match = currentData.code.match(/IT-EDU-(\d{2})-(\d{3})/);
      if (match && match[1] === currentYear) {
        const nextNumber = parseInt(match[2]) + 1;
        return `IT-EDU-${currentYear}-${String(nextNumber).padStart(3, '0')}`;
      }
    }

    return `IT-EDU-${currentYear}-001`;
  } catch (err) {
    console.error('IT교육 코드 생성 오류:', err);
    return `IT-EDU-${new Date().getFullYear().toString().slice(-2)}-001`;
  }
}

async function addTestEducation() {
  console.log('🔄 테스트 교육 데이터 추가 시작...');

  try {
    // 새로운 코드 생성
    const newCode = await generateItEducationCode();
    console.log('생성된 코드:', newCode);

    // 새로운 교육 데이터 추가
    const { data, error } = await supabase
      .from('it_education_data')
      .insert([{
        registration_date: new Date().toISOString().split('T')[0],
        code: newCode,
        education_type: '온라인',
        education_name: '코드 생성 테스트 교육',
        description: '자동 생성된 코드가 올바른지 확인하는 테스트 교육입니다.',
        location: '온라인',
        participant_count: 10,
        execution_date: '2025-09-26',
        status: '계획',
        assignee: '테스터'
      }])
      .select()
      .single();

    if (error) {
      console.error('❌ 교육 데이터 추가 실패:', error);
      return;
    }

    console.log('✅ 테스트 교육 데이터 추가 성공:', data);

    // 다시 한 번 코드 생성해서 다음 코드 확인
    const nextCode = await generateItEducationCode();
    console.log('다음 생성될 코드:', nextCode);

  } catch (err) {
    console.error('❌ 테스트 실패:', err);
  }
}

addTestEducation();