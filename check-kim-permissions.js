/**
 * kim 사용자의 권한 확인 스크립트
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

(async () => {
  try {
    // kim 사용자의 role_id 확인
    const { data: user, error: userError } = await supabase
      .from('admin_users_userprofiles')
      .select('email, user_name, role_id, admin_users_rules(role_name)')
      .eq('email', 'kim@company.com')
      .single();

    if (userError) {
      console.error('❌ 사용자 조회 실패:', userError);
      return;
    }

    console.log('📋 kim 사용자 정보:');
    console.log('  - 이메일:', user.email);
    console.log('  - 이름:', user.user_name);
    console.log('  - role_id:', user.role_id);
    console.log('  - 역할명:', user.admin_users_rules?.role_name);

    if (user?.role_id) {
      // 전체 권한 조회
      const { data: allPermissions, error: permError } = await supabase
        .from('admin_users_rules_permissions')
        .select(`
          menu_id,
          can_read,
          can_write,
          can_full,
          can_view_category,
          can_read_data,
          can_create_data,
          can_edit_own,
          can_edit_others,
          admin_systemsetting_menu(id, menu_url, menu_page, menu_category)
        `)
        .eq('role_id', user.role_id);

      if (permError) {
        console.error('❌ 권한 조회 실패:', permError);
        return;
      }

      console.log('\n📊 전체 권한 수:', allPermissions?.length || 0);

      // canViewCategory=true인 권한만 필터링
      const viewableMenus = allPermissions?.filter(p => p.can_view_category === true) || [];

      console.log('\n✅ canViewCategory=true인 권한 (' + viewableMenus.length + '개):');
      viewableMenus.forEach(p => {
        const menu = p.admin_systemsetting_menu;
        console.log('  -', menu?.menu_category, '/', menu?.menu_page, ':', menu?.menu_url);
      });

      // 카테고리별 그룹화
      const byCategory = viewableMenus.reduce((acc, p) => {
        const category = p.admin_systemsetting_menu?.menu_category || '기타';
        if (!acc[category]) acc[category] = [];
        acc[category].push(p.admin_systemsetting_menu?.menu_page);
        return acc;
      }, {});

      console.log('\n📂 카테고리별 표시 가능한 메뉴:');
      Object.entries(byCategory).forEach(([category, menus]) => {
        console.log('  [' + category + ']:', menus.join(', '));
      });

      // canViewCategory=false 또는 null인 권한
      const notViewableMenus = allPermissions?.filter(p => p.can_view_category !== true) || [];
      console.log('\n❌ canViewCategory=false/null인 권한 (' + notViewableMenus.length + '개):');
      notViewableMenus.slice(0, 5).forEach(p => {
        const menu = p.admin_systemsetting_menu;
        console.log('  -', menu?.menu_category, '/', menu?.menu_page,
                    '(canViewCategory=' + p.can_view_category + ')');
      });
      if (notViewableMenus.length > 5) {
        console.log('  ... 외 ' + (notViewableMenus.length - 5) + '개');
      }
    }
  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
})();
