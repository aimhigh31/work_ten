const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ 환경 변수가 설정되지 않았습니다.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testGroup007Subcodes() {
  console.log("🔍 GROUP007 서브코드 확인 중...\n");

  try {
    // GROUP007의 서브코드들 조회
    const { data, error } = await supabase
      .from('admin_mastercode_data')
      .select('*')
      .eq('group_code', 'GROUP007')
      .eq('codetype', 'subcode')
      .eq('is_active', true)
      .order('subcode_order', { ascending: true });

    if (error) {
      console.error('❌ GROUP007 서브코드 조회 실패:', error);
      return;
    }

    console.log(`📋 GROUP007 서브코드 총 ${data?.length || 0}개 발견\n`);

    if (data && data.length > 0) {
      console.log('📝 서브코드 목록:');
      data.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.subcode}: ${item.subcode_name}`);
        if (item.subcode_description) {
          console.log(`     설명: ${item.subcode_description}`);
        }
      });

      console.log('\n🎯 폴더 구조 예시:');
      data.forEach((item, index) => {
        console.log(`  📁 ${item.subcode_name} (ID: ${index + 1})`);
      });
    } else {
      console.log('⚠️ GROUP007 서브코드가 없습니다.');
      console.log('💡 GROUP007 그룹을 먼저 생성하고 서브코드를 추가해주세요.');
    }

    // 마스터코드 그룹도 확인
    console.log('\n🔍 GROUP007 그룹 정보 확인...');
    const { data: groupData, error: groupError } = await supabase
      .from('admin_mastercode_data')
      .select('*')
      .eq('group_code', 'GROUP007')
      .eq('codetype', 'group')
      .eq('is_active', true);

    if (groupError) {
      console.error('❌ GROUP007 그룹 조회 실패:', groupError);
    } else if (groupData && groupData.length > 0) {
      const group = groupData[0];
      console.log(`✅ 그룹명: ${group.group_code_name}`);
      console.log(`📄 설명: ${group.group_code_description || '없음'}`);
    } else {
      console.log('❌ GROUP007 그룹이 존재하지 않습니다.');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

testGroup007Subcodes();