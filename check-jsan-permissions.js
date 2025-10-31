require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkJsanPermissions() {
  try {
    console.log('1. jsan 계정 찾기...\n');
    const { data: users } = await supabase
      .from('admin_users_userprofiles')
      .select('id, email, user_name, user_code, role_id, admin_users_rules(id, role_code, role_name, is_active)')
      .or('user_code.eq.user-25-009,email.ilike.%jsan%');

    if (!users || users.length === 0) {
      console.log('jsan 계정을 찾을 수 없습니다.');
      return;
    }

    console.log('찾은 계정:', users[0]);
    const jsanUser = users[0];

    if (!jsanUser.role_id) {
      console.log('role_id가 null입니다!');
      return;
    }

    console.log('\n2. role_id', jsanUser.role_id, '권한 확인...\n');
    const { data: permissions } = await supabase
      .from('admin_users_rules_permissions')
      .select('*, admin_systemsetting_menu(menu_category, menu_page, menu_url, is_enabled)')
      .eq('role_id', jsanUser.role_id)
      .eq('can_view_category', true);

    console.log('can_view_category=true 권한:', permissions?.length || 0, '개');
    if (permissions && permissions.length > 0) {
      console.table(permissions.slice(0, 5).map(p => ({
        menu_id: p.menu_id,
        카테고리: p.admin_systemsetting_menu?.menu_category,
        페이지: p.admin_systemsetting_menu?.menu_page
      })));
    }
  } catch (error) {
    console.error('오류:', error);
  }
}

checkJsanPermissions();
