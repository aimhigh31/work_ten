/**
 * /api/check-permission API 직접 테스트
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// getAllMenuPermissions 함수 복사
async function getAllMenuPermissions(roleId) {
  try {
    console.log(`🔍 [getAllMenuPermissions] roleId=${roleId} 전체 권한 조회 시작`);

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
          menu_category
        )
      `)
      .eq('role_id', roleId);

    if (error) {
      console.error('❌ [getAllMenuPermissions] 조회 실패:', error);
      return new Map();
    }

    const permissionMap = new Map();

    for (const perm of permissions || []) {
      const menuUrl = perm.admin_systemsetting_menu?.menu_url;
      const menuId = perm.menu_id;

      // menuId를 키로 사용 (URL 중복 문제 해결)
      if (menuId) {
        permissionMap.set(menuId, {
          // 메뉴 식별자 및 URL
          menuId: menuId,
          menuUrl: menuUrl,
          // 기존 3개 (하위 호환성)
          canRead: perm.can_read,
          canWrite: perm.can_write,
          canFull: perm.can_full,
          // 새로운 5개
          canViewCategory: perm.can_view_category,
          canReadData: perm.can_read_data,
          canCreateData: perm.can_create_data,
          canEditOwn: perm.can_edit_own,
          canEditOthers: perm.can_edit_others,
          // 메뉴 정보
          menuPage: perm.admin_systemsetting_menu?.menu_page,
          menuCategory: perm.admin_systemsetting_menu?.menu_category
        });
      }
    }

    console.log(`✅ [getAllMenuPermissions] roleId=${roleId}: ${permissionMap.size}개 메뉴 권한 로드 완료`);

    return permissionMap;
  } catch (error) {
    console.error('❌ [getAllMenuPermissions] 오류:', error);
    return new Map();
  }
}

(async () => {
  try {
    // kim 사용자 role_id 조회
    const { data: user } = await supabase
      .from('admin_users_userprofiles')
      .select('role_id')
      .eq('email', 'kim@company.com')
      .single();

    console.log('📋 kim 사용자 role_id:', user?.role_id);

    if (!user?.role_id) {
      console.error('❌ role_id가 없습니다!');
      return;
    }

    // getAllMenuPermissions 호출
    const permissionMap = await getAllMenuPermissions(user.role_id);

    console.log('\n📊 permissionMap 정보:');
    console.log('  - 타입:', permissionMap.constructor.name);
    console.log('  - 크기:', permissionMap.size);

    // Map을 객체로 변환 (API가 하는 것처럼)
    const permissions = {};
    permissionMap.forEach((value, key) => {
      permissions[key] = value;
    });

    console.log('\n📦 변환된 permissions 객체:');
    console.log('  - 타입:', typeof permissions);
    console.log('  - 키 개수:', Object.keys(permissions).length);
    console.log('  - 키 샘플 (처음 5개):', Object.keys(permissions).slice(0, 5));

    console.log('\n✅ canViewCategory=true인 권한:');
    Object.entries(permissions).forEach(([key, value]) => {
      if (value.canViewCategory === true) {
        console.log(`  - [키: ${key}] ${value.menuCategory} / ${value.menuPage}`);
      }
    });

    // JSON 직렬화 테스트
    console.log('\n🔄 JSON 직렬화 테스트:');
    const jsonString = JSON.stringify(permissions);
    console.log('  - JSON 길이:', jsonString.length);
    const parsed = JSON.parse(jsonString);
    console.log('  - 파싱 후 키 개수:', Object.keys(parsed).length);
    console.log('  - 파싱 후 키 샘플:', Object.keys(parsed).slice(0, 3));

  } catch (error) {
    console.error('❌ 오류:', error);
  }
})();
