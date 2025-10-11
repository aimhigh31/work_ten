const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testUpdate() {
  console.log('🔍 커리큘럼 테이블 구조 확인...');

  // 테이블 구조 확인
  const { data: tableInfo, error: tableError } = await supabase
    .from('security_education_curriculum')
    .select('*')
    .limit(1);

  if (tableError) {
    console.error('테이블 조회 오류:', tableError);
    return;
  }

  console.log('📋 현재 데이터 샘플:', tableInfo[0]);

  // 업데이트 테스트
  console.log('\n🔧 업데이트 테스트 시작...');

  const testUpdates = {
    session_title: 'Updated Title Test'
  };

  const { data: updateResult, error: updateError } = await supabase
    .from('security_education_curriculum')
    .update(testUpdates)
    .eq('id', 18)
    .select()
    .single();

  if (updateError) {
    console.error('❌ 업데이트 오류:', updateError);
    console.error('오류 상세:', {
      message: updateError.message,
      details: updateError.details,
      hint: updateError.hint,
      code: updateError.code
    });
  } else {
    console.log('✅ 업데이트 성공:', updateResult);
  }
}

testUpdate();