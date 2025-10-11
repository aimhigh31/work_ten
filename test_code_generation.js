const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testCodeGeneration() {
  console.log('🔄 IT교육 코드 생성 테스트 시작...');

  try {
    // 현재 데이터 확인
    const { data, error } = await supabase
      .from('it_education_data')
      .select('code')
      .order('id', { ascending: false })
      .limit(1);

    if (error) {
      console.error('코드 조회 실패:', error);
      return;
    }

    console.log('현재 최신 코드:', data?.[0]?.code);

    // 코드 생성 로직 테스트
    const currentYear = new Date().getFullYear().toString().slice(-2);
    const currentData = data && data.length > 0 ? data[0] : null;

    console.log('현재 년도:', currentYear);
    console.log('현재 데이터:', currentData);

    if (currentData?.code) {
      const match = currentData.code.match(/IT-EDU-(\d{2})-(\d{3})/);
      console.log('정규식 매치 결과:', match);

      if (match && match[1] === currentYear) {
        const nextNumber = parseInt(match[2]) + 1;
        const newCode = `IT-EDU-${currentYear}-${String(nextNumber).padStart(3, '0')}`;
        console.log('✅ 새로운 코드 (같은 년도):', newCode);
      } else {
        const newCode = `IT-EDU-${currentYear}-001`;
        console.log('✅ 새로운 코드 (새 년도 또는 다른 형식):', newCode);
      }
    } else {
      const newCode = `IT-EDU-${currentYear}-001`;
      console.log('✅ 새로운 코드 (첫 번째):', newCode);
    }

  } catch (err) {
    console.error('❌ 테스트 실패:', err);
  }
}

testCodeGeneration();