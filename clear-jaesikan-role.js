/**
 * jaesikan 계정 역할 해제
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function clearJaesikanRole() {
  try {
    console.log('✅ Supabase 연결 성공\n');

    // jaesikan 계정 역할 해제 (role_id를 null로 설정)
    console.log('📋 jaesikan 계정 역할 해제 중...');
    const { data, error } = await supabase
      .from('admin_users_userprofiles')
      .update({ role_id: null })
      .eq('email', 'jaesikan@nexplus.co.kr')
      .select();

    if (error) {
      console.error('❌ 역할 해제 실패:', error);
      return;
    }

    console.log('✅ 역할 해제 완료!');
    console.log('업데이트된 레코드:', data);

    // 확인
    const { data: user } = await supabase
      .from('admin_users_userprofiles')
      .select('email, role_id')
      .eq('email', 'jaesikan@nexplus.co.kr')
      .single();

    console.log('\n=== 현재 상태 ===');
    console.log('이메일:', user?.email);
    console.log('role_id:', user?.role_id);

    if (user?.role_id === null) {
      console.log('\n✅ 성공적으로 역할이 해제되었습니다!');
      console.log('\n다음 단계:');
      console.log('  1. jaesikan 계정에서 완전 로그아웃');
      console.log('  2. 브라우저 캐시 삭제 (Ctrl + Shift + Delete)');
      console.log('  3. 다시 로그인');
      console.log('  4. 좌측 사이드바에 "메인메뉴 > 대시보드"만 표시되는지 확인');
    } else {
      console.log('\n⚠️  role_id가 여전히 null이 아닙니다:', user?.role_id);
    }

  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

clearJaesikanRole();
