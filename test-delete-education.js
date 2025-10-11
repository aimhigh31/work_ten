const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testDeleteEducation(id) {
  console.log(`\n🗑️ ID ${id} 삭제 테스트 시작...\n`);

  try {
    // 삭제 전 확인
    const { data: beforeData, error: beforeError } = await supabase
      .from('security_education_data')
      .select('id, education_name, is_active')
      .eq('id', id)
      .single();

    if (beforeError) {
      console.error('❌ 데이터 조회 실패:', beforeError);
      return;
    }

    console.log('삭제 전 데이터:', beforeData);

    // 소프트 삭제 (is_active를 false로)
    const { error: deleteError } = await supabase
      .from('security_education_data')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('id', id);

    if (deleteError) {
      console.error('❌ 삭제 실패:', deleteError);
      return;
    }

    console.log('✅ 소프트 삭제 완료');

    // 삭제 후 확인
    const { data: afterData, error: afterError } = await supabase
      .from('security_education_data')
      .select('id, education_name, is_active')
      .eq('id', id)
      .single();

    console.log('삭제 후 데이터:', afterData);

    // 활성 데이터만 조회
    const { data: activeData, count } = await supabase
      .from('security_education_data')
      .select('*', { count: 'exact', head: false })
      .eq('is_active', true);

    console.log(`\n📊 남은 활성 데이터: ${count}개`);

  } catch (error) {
    console.error('❌ 실행 오류:', error);
  }
}

// ID 6번 테스트 삭제
testDeleteEducation(6);