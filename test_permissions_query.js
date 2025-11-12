const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function testPermissionsQuery() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  );

  try {
    console.log('🔍 권한 조회 테스트 시작\n');

    // 1. 역할 코드로 역할 ID 조회
    console.log('1️⃣ 테스트 역할 코드 조회...');
    const { data: roles, error: rolesError } = await supabase
      .from('admin_users_rules')
      .select('id, role_code')
      .eq('is_active', true)
      .limit(1);

    if (rolesError) {
      console.error('❌ 역할 조회 실패:', rolesError);
      return;
    }

    if (!roles || roles.length === 0) {
      console.log('⚠️ 활성화된 역할이 없습니다.');
      return;
    }

    const testRole = roles[0];
    console.log(`✅ 테스트 역할: ${testRole.role_code} (ID: ${testRole.id})\n`);

    // 2. 해당 역할의 권한 조회 (조인 포함)
    console.log('2️⃣ 권한 조회 (조인 포함)...');
    const { data: permissions, error } = await supabase
      .from('admin_users_rules_permissions')
      .select(`
        menu_id,
        can_read,
        can_write,
        can_full,
        can_view_category,
        can_read_data,
        can_manage_own,
        can_edit_others,
        admin_systemsetting_menu (
          menu_url,
          menu_page,
          menu_category
        )
      `)
      .eq('role_id', testRole.id)
      .limit(5);

    if (error) {
      console.error('❌ 권한 조회 실패:', error);
      console.error('\n📋 에러 상세:');
      console.error('  code:', error.code);
      console.error('  message:', error.message);
      console.error('  details:', error.details);
      console.error('  hint:', error.hint);
      return;
    }

    if (!permissions || permissions.length === 0) {
      console.log('⚠️ 해당 역할에 권한이 없습니다.');
      return;
    }

    console.log(`✅ ${permissions.length}개 권한 조회 성공\n`);
    console.log('📋 첫 번째 권한 샘플:');
    console.log(JSON.stringify(permissions[0], null, 2));

  } catch (error) {
    console.error('❌ 예외 발생:', error.message);
    console.error('상세:', error);
  }
}

testPermissionsQuery();
