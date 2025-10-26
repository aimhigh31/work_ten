const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkHardwareData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  console.log('🔍 it_hardware_data 테이블 조회...\n');

  // 전체 데이터 조회
  const { data: allData, error: allError } = await supabase
    .from('it_hardware_data')
    .select('*')
    .order('created_at', { ascending: false });

  if (allError) {
    console.error('❌ 전체 조회 오류:', allError);
    return;
  }

  console.log(`📊 전체 데이터: ${allData?.length || 0}개`);

  // is_active = true인 데이터 조회
  const { data: activeData, error: activeError } = await supabase
    .from('it_hardware_data')
    .select('*')
    .eq('is_active', true)
    .order('created_at', { ascending: false });

  if (activeError) {
    console.error('❌ is_active 조회 오류:', activeError);
    return;
  }

  console.log(`✅ is_active=true 데이터: ${activeData?.length || 0}개\n`);

  if (activeData && activeData.length > 0) {
    console.log('📝 샘플 데이터 (최신 3개):');
    activeData.slice(0, 3).forEach((item, index) => {
      console.log(`\n[${index + 1}]`);
      console.log(`  ID: ${item.id}`);
      console.log(`  코드: ${item.code}`);
      console.log(`  자산명: ${item.asset_name}`);
      console.log(`  상태: ${item.status}`);
      console.log(`  is_active: ${item.is_active}`);
      console.log(`  등록일: ${item.registration_date}`);
      console.log(`  생성일: ${item.created_at}`);
    });
  } else {
    console.log('⚠️ 활성화된 하드웨어 데이터가 없습니다.');

    if (allData && allData.length > 0) {
      console.log('\n📝 is_active=false인 데이터가 있습니다:');
      allData.slice(0, 3).forEach((item, index) => {
        console.log(`\n[${index + 1}]`);
        console.log(`  ID: ${item.id}`);
        console.log(`  코드: ${item.code}`);
        console.log(`  is_active: ${item.is_active}`);
      });
    }
  }
}

checkHardwareData();
