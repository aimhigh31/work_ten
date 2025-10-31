/**
 * 특정 역할의 권한 확인 스크립트
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const roleId = process.argv[2];

if (!roleId) {
  console.error('❌ 사용법: node check-role-permissions.js <role_id>');
  process.exit(1);
}

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

(async () => {
  try {
    // 역할 정보 조회
    const { data: role, error: roleError } = await supabase
      .from('admin_users_rules')
      .select('id, role_code, role_name, role_description')
      .eq('id', roleId)
      .single();

    if (roleError || !role) {
      console.error('❌ 역할 조회 실패:', roleError);
      return;
    }

    console.log('📋 역할 정보:');
    console.log('  - ID:', role.id);
    console.log('  - 코드:', role.role_code);
    console.log('  - 이름:', role.role_name);
    console.log('  - 설명:', role.role_description);

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
        admin_systemsetting_menu(id, menu_url, menu_page, menu_category, menu_level)
      `)
      .eq('role_id', roleId)
      .order('menu_id', { ascending: true });

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
      console.log(`  - [레벨 ${menu?.menu_level}] ${menu?.menu_category} / ${menu?.menu_page} : ${menu?.menu_url}`);
    });

    // 카테고리별 그룹화
    const byCategory = viewableMenus.reduce((acc, p) => {
      const category = p.admin_systemsetting_menu?.menu_category || '기타';
      if (!acc[category]) acc[category] = [];
      acc[category].push({
        level: p.admin_systemsetting_menu?.menu_level,
        page: p.admin_systemsetting_menu?.menu_page
      });
      return acc;
    }, {});

    console.log('\n📂 카테고리별 표시 가능한 메뉴:');
    Object.entries(byCategory).forEach(([category, menus]) => {
      console.log(`  [${category}]:`);
      menus.forEach(m => {
        console.log(`    - [레벨 ${m.level}] ${m.page}`);
      });
    });

    // 레벨 0 (카테고리 헤더) 확인
    const level0Menus = viewableMenus.filter(p => p.admin_systemsetting_menu?.menu_level === 0);
    console.log('\n📌 레벨 0 (카테고리 헤더) 권한 (' + level0Menus.length + '개):');
    level0Menus.forEach(p => {
      const menu = p.admin_systemsetting_menu;
      console.log(`  - ${menu?.menu_category} : ${menu?.menu_url}`);
    });

    // 레벨 1 (실제 메뉴) 확인
    const level1Menus = viewableMenus.filter(p => p.admin_systemsetting_menu?.menu_level === 1);
    console.log('\n📌 레벨 1 (실제 메뉴) 권한 (' + level1Menus.length + '개):');
    level1Menus.forEach(p => {
      const menu = p.admin_systemsetting_menu;
      console.log(`  - ${menu?.menu_category} / ${menu?.menu_page} : ${menu?.menu_url}`);
    });

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
})();
