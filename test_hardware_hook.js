const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testHardwareHook() {
  console.log('🔍 하드웨어 훅 로직 테스트...');

  try {
    // useSupabaseHardware 훅과 동일한 쿼리
    const { data, error } = await supabase
      .from('it_software_data')
      .select('*')
      .eq('is_active', true)
      .like('code', 'HW-%')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ 하드웨어 데이터 조회 실패:', error);
      throw error;
    }

    console.log('✅ 하드웨어 데이터 조회 성공:', data?.length + '개');
    console.log('📋 조회된 데이터:');
    data?.forEach(item => {
      console.log(`  - ${item.code}: ${item.work_content} (${item.assignee})`);
    });

    console.log('🎉 하드웨어 훅 테스트 성공!');

  } catch (error) {
    console.error('❌ 하드웨어 훅 테스트 실패:', error);
  }
}

testHardwareHook();