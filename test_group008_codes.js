const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testGroup008Codes() {
  console.log('🔄 GROUP008 서브코드 조회 테스트 시작...');

  try {
    // GROUP008 서브코드 조회
    const { data, error } = await supabase
      .from('admin_mastercode_data')
      .select('*')
      .eq('group_code', 'GROUP008')
      .eq('codetype', 'subcode')
      .eq('is_active', true)
      .order('subcode_order', { ascending: true });

    if (error) {
      console.error('❌ GROUP008 조회 실패:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('✅ GROUP008 서브코드 목록:');
      data.forEach((code, index) => {
        console.log(`  ${index + 1}. 코드: ${code.subcode}, 이름: ${code.subcode_name}, 순서: ${code.subcode_order}, 상태: ${code.subcode_status}`);
      });

      console.log('\n📊 교육유형 Select 옵션으로 사용될 값들:');
      data.forEach((code, index) => {
        console.log(`  ${index + 1}. ${code.subcode_name}`);
      });

    } else {
      console.log('❌ GROUP008 서브코드가 없습니다.');
    }

    // 전체 마스터코드 그룹 확인 (참고용)
    const { data: groups, error: groupError } = await supabase
      .from('admin_mastercode_data')
      .select('group_code, group_code_name')
      .eq('codetype', 'group')
      .eq('is_active', true)
      .order('group_code_order', { ascending: true });

    if (groupError) {
      console.error('❌ 그룹 조회 실패:', groupError);
    } else {
      console.log('\n📋 참고: 전체 마스터코드 그룹 목록');
      groups.forEach((group) => {
        console.log(`  - ${group.group_code}: ${group.group_code_name}`);
      });
    }

  } catch (err) {
    console.error('❌ 테스트 실패:', err);
  }
}

testGroup008Codes();