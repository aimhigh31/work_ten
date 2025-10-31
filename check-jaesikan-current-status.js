/**
 * jaesikan 계정 현재 상태 확인
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

async function checkJaesikanStatus() {
  try {
    console.log('✅ Supabase 연결 성공\n');

    // jaesikan 계정 조회
    console.log('📊 jaesikan 계정 정보 조회...');
    const { data: user, error: userError } = await supabase
      .from('admin_users_userprofiles')
      .select(`
        id,
        email,
        role_id,
        admin_users_rules (
          id,
          role_code,
          role_name,
          is_active
        )
      `)
      .eq('email', 'jaesikan@nexplus.co.kr')
      .single();

    if (userError || !user) {
      console.error('❌ 계정을 찾을 수 없습니다:', userError);
      return;
    }

    console.log('\n=== jaesikan 계정 정보 ===');
    console.log('이메일:', user.email);
    console.log('role_id:', user.role_id);
    console.log('역할 정보:', user.admin_users_rules);

    if (user.role_id === null) {
      console.log('\n✅ role_id가 null입니다. 역할이 해제된 상태입니다.');
      console.log('💡 이 경우 권한이 없어야 하므로 메뉴가 보이지 않아야 합니다.');
    } else {
      console.log('\n⚠️  role_id가 여전히 설정되어 있습니다:', user.role_id);
      console.log('역할 이름:', user.admin_users_rules?.role_name);
      console.log('역할 활성화:', user.admin_users_rules?.is_active);
    }

  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

checkJaesikanStatus();
