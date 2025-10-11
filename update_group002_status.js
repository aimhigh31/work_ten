require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function updateGroup002Status() {
  console.log('🔄 GROUP002 상태 마스터코드 업데이트 중...');

  try {
    // 1. 기존 데이터 확인
    const { data: existingData } = await supabase
      .from('admin_mastercode_data')
      .select('subcode, subcode_name')
      .eq('group_code', 'GROUP002')
      .eq('codetype', 'subcode');

    console.log('📋 기존 상태:', existingData?.map(item => item.subcode_name));

    // 2. '사용중' 상태가 없으면 추가
    const hasUsageStatus = existingData?.some(item => item.subcode_name === '사용중');

    if (!hasUsageStatus) {
      const { data, error } = await supabase
        .from('admin_mastercode_data')
        .insert([{
          group_code: 'GROUP002',
          group_code_name: '업무 상태',
          group_code_description: '업무 처리 상태 관리',
          group_code_status: 'active',
          group_code_order: 2,
          codetype: 'subcode',
          subcode: 'GROUP002-SUB005',
          subcode_name: '사용중',
          subcode_description: '소프트웨어가 현재 사용 중인 상태',
          subcode_status: 'active',
          subcode_remark: '활성 사용',
          subcode_order: 5,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 'system',
          updated_by: 'system'
        }]);

      if (error) {
        console.error('❌ 사용중 상태 추가 실패:', error);
        return;
      }

      console.log('✅ 사용중 상태 추가 성공');
    } else {
      console.log('ℹ️ 사용중 상태가 이미 존재합니다.');
    }

    // 3. 최종 상태 확인
    const { data: finalData } = await supabase
      .from('admin_mastercode_data')
      .select('subcode, subcode_name, subcode_order')
      .eq('group_code', 'GROUP002')
      .eq('codetype', 'subcode')
      .eq('is_active', true)
      .order('subcode_order', { ascending: true });

    console.log('📊 최종 상태 목록:');
    finalData?.forEach((item, index) => {
      console.log(`  ${index + 1}. ${item.subcode_name} (${item.subcode})`);
    });

  } catch (err) {
    console.error('❌ GROUP002 업데이트 오류:', err);
  }
}

updateGroup002Status().then(() => {
  console.log('✅ 완료');
}).catch((err) => {
  console.error('❌ 오류:', err);
});