const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function grantSystemAdminPermissions() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('🚀 시스템 관리자 권한 부여 시작...\n');

    // 1. 시스템 관리자 역할 ID 확인 (ID 11)
    const roleId = 11;

    const { data: role } = await supabase
      .from('admin_users_rules')
      .select('id, role_code, role_name')
      .eq('id', roleId)
      .single();

    if (!role) {
      throw new Error(`Role ID ${roleId}를 찾을 수 없습니다.`);
    }

    console.log('✅ 역할 확인:');
    console.log(`   Role ID: ${role.id}`);
    console.log(`   Role Code: ${role.role_code}`);
    console.log(`   Role Name: ${role.role_name}\n`);

    // 2. 모든 메뉴 조회
    const { data: menus, error: menuError } = await supabase
      .from('admin_systemsetting_menu')
      .select('id, menu_page, menu_url')
      .order('id');

    if (menuError) {
      throw menuError;
    }

    console.log(`📋 활성 메뉴 ${menus.length}개 발견\n`);

    // 3. 각 메뉴에 대해 권한 부여
    const permissions = menus.map(menu => ({
      role_id: role.id,
      menu_id: menu.id,
      can_read: true,
      can_write: true,
      can_full: true,
      created_by: 'system',
      updated_by: 'system'
    }));

    console.log('💾 권한 레코드 삽입 중...\n');

    const { data: insertedPermissions, error: insertError } = await supabase
      .from('admin_users_rules_permissions')
      .upsert(permissions, {
        onConflict: 'role_id,menu_id'
      })
      .select();

    if (insertError) {
      throw insertError;
    }

    console.log(`✅ ${insertedPermissions.length}개의 권한 레코드 생성 완료!\n`);

    // 4. 결과 확인
    console.log('📋 부여된 권한 목록:');
    for (const menu of menus) {
      console.log(`   ✓ ${menu.menu_page} (${menu.menu_url}) - Full 권한`);
    }

    console.log('\n🎉 시스템 관리자 권한 부여 완료!');
    console.log('   이제 system@nexplus.co.kr로 모든 메뉴에 접근 가능합니다.\n');

  } catch (error) {
    console.error('❌ 에러 발생:', error.message);
    console.error(error);
    process.exit(1);
  }
}

grantSystemAdminPermissions();
