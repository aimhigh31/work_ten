const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkSystemPermissions() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('📡 Supabase 연결 중...\n');

    // 1. System 사용자 확인
    console.log('🔍 System 사용자 확인:');
    const { data: systemUser } = await supabase
      .from('admin_users_userprofiles')
      .select('id, user_account_id, email, user_name, role_id')
      .eq('user_account_id', 'system')
      .single();

    if (!systemUser) {
      throw new Error('System 사용자를 찾을 수 없습니다.');
    }

    console.log('✅ System 사용자 발견');
    console.log(`   ID: ${systemUser.id}`);
    console.log(`   Email: ${systemUser.email}`);
    console.log(`   Role ID: ${systemUser.role_id}`);
    console.log();

    // 2. 역할 확인
    console.log('🔍 역할 확인:');
    const { data: role } = await supabase
      .from('admin_users_rules')
      .select('id, role_code, role_name')
      .eq('id', systemUser.role_id)
      .single();

    if (!role) {
      throw new Error('역할을 찾을 수 없습니다.');
    }

    console.log('✅ 역할 발견');
    console.log(`   Role Code: ${role.role_code}`);
    console.log(`   Role Name: ${role.role_name}`);
    console.log();

    // 3. user-settings 메뉴 확인
    console.log('🔍 /admin-panel/user-settings 메뉴 확인:');
    const { data: menu } = await supabase
      .from('admin_systemsetting_menu')
      .select('id, menu_page, menu_url')
      .eq('menu_url', '/admin-panel/user-settings')
      .maybeSingle();

    if (!menu) {
      console.log('❌ /admin-panel/user-settings 메뉴가 존재하지 않습니다!');
      console.log('   이것이 문제의 원인입니다.');
      console.log();

      // 모든 메뉴 출력
      console.log('📋 현재 등록된 모든 메뉴:');
      const { data: allMenus } = await supabase
        .from('admin_systemsetting_menu')
        .select('id, menu_page, menu_url')
        .order('id');

      allMenus?.forEach(m => {
        console.log(`   ${m.id}: ${m.menu_page} (${m.menu_url})`);
      });
      console.log();
    } else {
      console.log('✅ 메뉴 발견');
      console.log(`   Menu ID: ${menu.id}`);
      console.log(`   Menu Page: ${menu.menu_page}`);
      console.log(`   Menu URL: ${menu.menu_url}`);
      console.log();

      // 4. 권한 확인
      console.log('🔍 권한 확인:');
      const { data: permission } = await supabase
        .from('admin_users_rules_permissions')
        .select('*')
        .eq('role_id', role.id)
        .eq('menu_id', menu.id)
        .maybeSingle();

      if (!permission) {
        console.log('❌ 권한이 없습니다!');
        console.log('   이것이 문제의 원인입니다.');
      } else {
        console.log('✅ 권한 발견');
        console.log(`   can_read: ${permission.can_read}`);
        console.log(`   can_write: ${permission.can_write}`);
        console.log(`   can_full: ${permission.can_full}`);
      }
      console.log();
    }

    // 5. System 역할의 모든 권한 출력
    console.log('📋 System 역할의 모든 권한:');
    const { data: allPermissions } = await supabase
      .from('admin_users_rules_permissions')
      .select(`
        id,
        can_read,
        can_write,
        can_full,
        admin_systemsetting_menu (
          menu_page,
          menu_url
        )
      `)
      .eq('role_id', role.id)
      .order('id');

    if (allPermissions && allPermissions.length > 0) {
      console.log(`✅ 총 ${allPermissions.length}개의 권한:`);
      allPermissions.forEach(p => {
        const menu = p.admin_systemsetting_menu;
        console.log(`   - ${menu.menu_page} (${menu.menu_url})`);
        console.log(`     Read: ${p.can_read}, Write: ${p.can_write}, Full: ${p.can_full}`);
      });
    } else {
      console.log('❌ 권한이 하나도 없습니다!');
    }

  } catch (error) {
    console.error('❌ 에러 발생:', error.message);
    process.exit(1);
  }
}

checkSystemPermissions();
