/**
 * user-settings 메뉴 권한 상세 확인
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

async function checkUserSettingsPermissions() {
  try {
    console.log('✅ Supabase 연결 성공\n');

    // 1. user-settings 메뉴 ID 조회
    const { data: menu, error: menuError } = await supabase
      .from('admin_systemsetting_menu')
      .select('id, menu_category, menu_page, menu_url')
      .eq('menu_url', '/admin-panel/user-settings')
      .single();

    if (menuError || !menu) {
      console.error('❌ user-settings 메뉴를 찾을 수 없습니다:', menuError);
      return;
    }

    console.log('📋 user-settings 메뉴 정보:');
    console.log('  ID:', menu.id);
    console.log('  카테고리:', menu.menu_category);
    console.log('  페이지:', menu.menu_page);
    console.log('  URL:', menu.menu_url);

    // 2. system 계정 조회
    const { data: user } = await supabase
      .from('admin_users_userprofiles')
      .select('id, email, role_id')
      .eq('email', 'system@nexplus.co.kr')
      .single();

    if (!user || !user.role_id) {
      console.log('\n❌ system 계정을 찾을 수 없거나 role_id가 없습니다.');
      return;
    }

    console.log('\n📊 system 계정:');
    console.log('  이메일:', user.email);
    console.log('  role_id:', user.role_id);

    // 3. role 11의 user-settings 메뉴 권한 조회
    const { data: permission, error: permError } = await supabase
      .from('admin_users_rules_permissions')
      .select('*')
      .eq('role_id', user.role_id)
      .eq('menu_id', menu.id)
      .single();

    if (permError || !permission) {
      console.error('\n❌ 권한을 찾을 수 없습니다:', permError);
      return;
    }

    console.log('\n=== user-settings 메뉴 권한 상세 ===');
    console.log('  can_read:', permission.can_read);
    console.log('  can_write:', permission.can_write, '← 🔑 이것이 true여야 사용자 수정 가능');
    console.log('  can_full:', permission.can_full);
    console.log('  can_view_category:', permission.can_view_category);
    console.log('  can_read_data:', permission.can_read_data);
    console.log('  can_manage_own:', permission.can_manage_own);
    console.log('  can_edit_others:', permission.can_edit_others);

    if (!permission.can_write) {
      console.log('\n❌ 문제 발견: can_write가 false입니다!');
      console.log('해결 방법: setup-role-11-permissions.js를 다시 실행하거나');
      console.log('          수동으로 can_write를 true로 설정해야 합니다.');
    } else {
      console.log('\n✅ can_write 권한이 올바르게 설정되어 있습니다.');
      console.log('\n💡 권한 오류가 발생한다면:');
      console.log('  1. 완전 로그아웃 (모든 브라우저 탭 닫기)');
      console.log('  2. 브라우저 캐시 삭제 (Ctrl + Shift + Delete)');
      console.log('  3. 브라우저 재시작');
      console.log('  4. system@nexplus.co.kr로 다시 로그인');
    }

  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

checkUserSettingsPermissions();
