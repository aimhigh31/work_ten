/**
 * 현재 로그인된 사용자의 세션과 권한 확인
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

async function checkCurrentSession() {
  try {
    console.log('✅ Supabase 연결 성공\n');

    // system 계정 조회
    console.log('📊 system 계정 상태 확인...\n');
    const { data: user, error: userError } = await supabase
      .from('admin_users_userprofiles')
      .select(`
        id,
        email,
        user_name,
        role_id,
        admin_users_rules (
          id,
          role_code,
          role_name,
          is_active
        )
      `)
      .eq('email', 'system@nexplus.co.kr')
      .single();

    if (userError || !user) {
      console.error('❌ system 계정을 찾을 수 없습니다:', userError);
      return;
    }

    console.log('=== system 계정 정보 ===');
    console.log('사용자명:', user.user_name);
    console.log('이메일:', user.email);
    console.log('role_id:', user.role_id);
    console.log('역할 정보:', user.admin_users_rules);
    console.log();

    if (!user.role_id) {
      console.log('❌ role_id가 null입니다!');
      return;
    }

    // user-settings 메뉴 조회
    const { data: menu } = await supabase
      .from('admin_systemsetting_menu')
      .select('id, menu_category, menu_page, menu_url')
      .eq('menu_url', '/admin-panel/user-settings')
      .single();

    if (!menu) {
      console.error('❌ user-settings 메뉴를 찾을 수 없습니다');
      return;
    }

    console.log('=== user-settings 메뉴 정보 ===');
    console.log('메뉴 ID:', menu.id);
    console.log('카테고리:', menu.menu_category);
    console.log('페이지명:', menu.menu_page);
    console.log();

    // 권한 조회
    const { data: permission } = await supabase
      .from('admin_users_rules_permissions')
      .select('*')
      .eq('role_id', user.role_id)
      .eq('menu_id', menu.id)
      .single();

    if (!permission) {
      console.error('❌ user-settings 메뉴에 대한 권한이 없습니다!');
      return;
    }

    console.log('=== user-settings 권한 상세 ===');
    console.log('can_read:', permission.can_read);
    console.log('can_write:', permission.can_write);
    console.log('can_full:', permission.can_full);
    console.log('can_view_category:', permission.can_view_category);
    console.log('can_read_data:', permission.can_read_data);
    console.log('can_manage_own:', permission.can_manage_own, '← 추가 버튼 활성화에 필요');
    console.log('can_edit_others:', permission.can_edit_others, '← 삭제 버튼 활성화에 필요');
    console.log();

    // 진단
    console.log('=== 버튼 활성화 조건 체크 ===');
    console.log('추가 버튼 (canCreateData):', permission.can_manage_own ? '✅ 활성화' : '❌ 비활성화');
    console.log('삭제 버튼 (canEditOwn || canEditOthers):',
      (permission.can_manage_own || permission.can_edit_others) ? '✅ 활성화' : '❌ 비활성화');
    console.log();

    if (!permission.can_manage_own) {
      console.log('⚠️  can_manage_own이 false입니다!');
      console.log('해결: node setup-role-11-permissions.js 재실행');
    }

    if (!permission.can_edit_others) {
      console.log('⚠️  can_edit_others가 false입니다!');
      console.log('해결: node setup-role-11-permissions.js 재실행');
    }

    if (permission.can_manage_own && permission.can_edit_others) {
      console.log('✅ DB 권한은 올바르게 설정되어 있습니다.');
      console.log();
      console.log('💡 버튼이 보이지 않는다면:');
      console.log('  1. 브라우저 강력 새로고침 (Ctrl + Shift + R)');
      console.log('  2. 개발자 도구 (F12) → Console 탭에서 권한 로그 확인');
      console.log('  3. Application 탭 → Storage → Clear site data');
      console.log('  4. 브라우저 완전 재시작');
    }

  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

checkCurrentSession();
