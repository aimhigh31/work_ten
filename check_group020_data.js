const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkGroup020Data() {
  console.log('🔍 GROUP020 마스터코드 데이터 확인...');

  try {
    const { data, error } = await supabase
      .from('admin_mastercode_data')
      .select('subcode, subcode_name, subcode_order')
      .eq('group_code', 'GROUP020')
      .eq('codetype', 'subcode')
      .eq('is_active', true)
      .order('subcode_order', { ascending: true });

    if (error) {
      console.error('❌ GROUP020 데이터 조회 실패:', error);
      return;
    }

    console.log('✅ GROUP020 데이터 조회 성공:', data?.length || 0, '개');
    console.table(data);

    if (!data || data.length === 0) {
      console.log('⚠️ GROUP020 데이터가 없습니다. 샘플 데이터를 생성합니다...');

      const sampleData = [
        { group_code: 'GROUP020', codetype: 'subcode', subcode: 'ACTIVE', subcode_name: '사용중', subcode_order: 1, is_active: true },
        { group_code: 'GROUP020', codetype: 'subcode', subcode: 'INACTIVE', subcode_name: '종료', subcode_order: 2, is_active: true },
        { group_code: 'GROUP020', codetype: 'subcode', subcode: 'MAINTENANCE', subcode_name: '점검중', subcode_order: 3, is_active: true },
        { group_code: 'GROUP020', codetype: 'subcode', subcode: 'RESERVED', subcode_name: '예약됨', subcode_order: 4, is_active: true }
      ];

      const { data: insertData, error: insertError } = await supabase
        .from('admin_mastercode_data')
        .insert(sampleData)
        .select();

      if (insertError) {
        console.error('❌ 샘플 데이터 생성 실패:', insertError);
      } else {
        console.log('✅ GROUP020 샘플 데이터 생성 완료:', insertData?.length || 0, '개');
        console.table(insertData);
      }
    }

  } catch (error) {
    console.error('💥 GROUP020 확인 실패:', error);
  }
}

// 실행
checkGroup020Data()
  .then(() => {
    console.log('\n🎉 GROUP020 확인 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 실행 실패:', error);
    process.exit(1);
  });