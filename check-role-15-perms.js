/**
 * role_id 15 (ROLE-25-ADMIN) 권한 확인
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

async function checkRole15Permissions() {
  try {
    console.log('✅ Supabase 연결 성공\n');

    const roleId = 15;

    // user-settings 메뉴 권한 확인
    console.log('📊 user-settings 메뉴 권한 확인...\n');
    const { data: menu } = await supabase
      .from('admin_systemsetting_menu')
      .select('id')
      .eq('menu_url', '/admin-panel/user-settings')
      .single();

    const { data: permission } = await supabase
      .from('admin_users_rules_permissions')
      .select('*')
      .eq('role_id', roleId)
      .eq('menu_id', menu.id)
      .single();

    if (!permission) {
      console.log(`❌ role_id ${roleId}에 user-settings 권한이 없습니다!`);
      return;
    }

    console.log('=== user-settings 메뉴 권한 ===');
    console.log('can_manage_own:', permission.can_manage_own, '← 추가 버튼');
    console.log('can_edit_others:', permission.can_edit_others, '← 삭제 버튼');
    console.log();

    if (permission.can_manage_own && permission.can_edit_others) {
      console.log('✅ 권한 OK!');
    } else {
      console.log('❌ 권한 부족! setup-role-15-permissions.js 실행 필요');
    }

  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

checkRole15Permissions();
