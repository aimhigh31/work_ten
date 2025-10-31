/**
 * /api/check-permission API 테스트 (kim 사용자)
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
    // kim 사용자 정보 조회
    const { data: user } = await supabase
      .from('admin_users_userprofiles')
      .select('email, user_name, role_id')
      .eq('email', 'kim@company.com')
      .single();

    console.log('📋 kim 사용자:', user);

    if (!user?.role_id) {
      console.error('❌ role_id가 없습니다!');
      return;
    }

    // getAllMenuPermissions 로직 시뮬레이션
    const { data: permissions, error } = await supabase
      .from('admin_users_rules_permissions')
      .select(`
        can_read,
        can_write,
        can_full,
        can_view_category,
        can_read_data,
        can_create_data,
        can_edit_own,
        can_edit_others,
        menu_id,
        admin_systemsetting_menu (
          menu_url,
          menu_page,
          menu_category,
          id
        )
      `)
      .eq('role_id', user.role_id);

    if (error) {
      console.error('❌ 권한 조회 실패:', error);
      return;
    }

    console.log('\n📊 조회된 권한 수:', permissions?.length);

    // API가 반환할 데이터 구조 생성
    const permissionMap = {};

    for (const perm of permissions || []) {
      const menuUrl = perm.admin_systemsetting_menu?.menu_url;
      if (menuUrl) {
        permissionMap[menuUrl] = {
          menuId: perm.menu_id,
          canRead: perm.can_read,
          canWrite: perm.can_write,
          canFull: perm.can_full,
          canViewCategory: perm.can_view_category,
          canReadData: perm.can_read_data,
          canCreateData: perm.can_create_data,
          canEditOwn: perm.can_edit_own,
          canEditOthers: perm.can_edit_others,
          menuPage: perm.admin_systemsetting_menu?.menu_page,
          menuCategory: perm.admin_systemsetting_menu?.menu_category
        };
      }
    }

    console.log('\n📂 permissions 객체 구조:');
    console.log(`  총 ${Object.keys(permissionMap).length}개 URL 키`);
    console.log('\n샘플 (처음 5개):');
    Object.entries(permissionMap).slice(0, 5).forEach(([url, perm]) => {
      console.log(`\n  URL: "${url}"`);
      console.log(`    menuId: ${perm.menuId}`);
      console.log(`    menuPage: ${perm.menuPage}`);
      console.log(`    menuCategory: ${perm.menuCategory}`);
      console.log(`    canViewCategory: ${perm.canViewCategory}`);
    });

    // canViewCategory=true인 권한만 추출
    const viewablePermissions = Object.entries(permissionMap).filter(
      ([url, perm]) => perm.canViewCategory === true
    );

    console.log('\n\n✅ canViewCategory=true인 권한:');
    console.log(`  총 ${viewablePermissions.length}개`);
    viewablePermissions.forEach(([url, perm]) => {
      console.log(`  - [ID: ${perm.menuId}] ${perm.menuCategory} / ${perm.menuPage} : ${url}`);
    });

    // Object.values로 변환했을 때
    console.log('\n\n🔍 Object.values(permissionMap) 결과:');
    const permArray = Object.values(permissionMap);
    console.log(`  배열 길이: ${permArray.length}`);
    console.log('  처음 3개 항목의 menuId:');
    permArray.slice(0, 3).forEach((p) => {
      console.log(`    - menuId: ${p.menuId}, page: ${p.menuPage}`);
    });

  } catch (error) {
    console.error('❌ 오류:', error);
  }
})();
