const { createClient } = require("@supabase/supabase-js");
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ 환경 변수가 설정되지 않았습니다.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testUserList() {
  console.log("🔍 사용자 목록 확인 중...\n");

  try {
    // 활성 사용자 조회
    const { data, error } = await supabase
      .from('admin_users_userprofiles')
      .select('*')
      .eq('is_active', true)
      .eq('status', 'active')
      .order('user_name', { ascending: true });

    if (error) {
      console.error('❌ 사용자 조회 실패:', error);
      return;
    }

    console.log(`📋 활성 사용자 총 ${data?.length || 0}명\n`);

    if (data && data.length > 0) {
      console.log('👥 사용자 목록:');
      data.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.user_name} (${user.user_code})`);
        console.log(`     - 부서: ${user.department || '부서미지정'}`);
        console.log(`     - 직급: ${user.position || '직급미지정'}`);
        console.log(`     - 이메일: ${user.email}`);
      });

      console.log('\n🎯 담당자 드롭다운 옵션 예시:');
      data.forEach((user) => {
        console.log(`  👤 ${user.user_name} (${user.department || '부서미지정'})`);
      });
    } else {
      console.log('⚠️ 활성 사용자가 없습니다.');
      console.log('💡 사용자관리 페이지에서 사용자를 추가해주세요.');
    }

    // 전체 사용자 수 확인
    const { data: allUsers, error: allError } = await supabase
      .from('admin_users_userprofiles')
      .select('*');

    if (!allError && allUsers) {
      console.log(`\n📊 전체 사용자 통계:`);
      console.log(`  - 전체 사용자: ${allUsers.length}명`);
      console.log(`  - 활성 사용자: ${data?.length || 0}명`);
      console.log(`  - 비활성 사용자: ${allUsers.length - (data?.length || 0)}명`);
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

testUserList();