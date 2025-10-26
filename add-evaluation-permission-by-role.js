require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('🔍 슈퍼관리자 권한 추가\n');

  // 1. 슈퍼관리자 역할 찾기
  const { data: roles, error: roleError } = await supabase
    .from('admin_users_rules')
    .select('*')
    .or('role_name.ilike.%슈퍼%,role_name.ilike.%시스템%')
    .order('id');

  if (!roles || roles.length === 0) {
    console.log('❌ 슈퍼관리자 역할을 찾을 수 없습니다.');
    return;
  }

  console.log(`✅ ${roles.length}개의 관리자 역할 발견:`);
  roles.forEach(role => {
    console.log(`   ID: ${role.id}, 역할명: ${role.role_name}`);
  });

  // 가장 첫 번째 역할 사용 (보통 시스템관리자)
  const roleId = roles[0].id;
  const roleName = roles[0].role_name;

  console.log(`\n사용할 역할: ${roleName} (ID: ${roleId})`);

  // 2. /hr/evaluation 메뉴 ID
  const menuId = 51;
  console.log(`메뉴 ID: ${menuId} (/hr/evaluation)`);

  // 3. 기존 권한 확인
  const { data: existingPerm } = await supabase
    .from('admin_users_rules_permissions')
    .select('*')
    .eq('role_id', roleId)
    .eq('menu_id', menuId)
    .maybeSingle();

  if (existingPerm) {
    console.log('\n✅ 권한이 이미 존재합니다.');
    console.log(`   읽기: ${existingPerm.can_read}, 쓰기: ${existingPerm.can_write}, 전체: ${existingPerm.can_full}`);

    if (!existingPerm.can_read || !existingPerm.can_write) {
      console.log('\n⚠️ 권한을 업데이트합니다...');
      const { error: updateError } = await supabase
        .from('admin_users_rules_permissions')
        .update({
          can_read: true,
          can_write: true,
          can_full: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingPerm.id);

      if (!updateError) {
        console.log('✅ 권한 업데이트 완료!');
      }
    }
  } else {
    console.log('\n❌ 권한이 없습니다. 추가합니다...');

    const { error: insertError } = await supabase
      .from('admin_users_rules_permissions')
      .insert({
        role_id: roleId,
        menu_id: menuId,
        can_read: true,
        can_write: true,
        can_full: true,
        created_by: 'system',
        updated_by: 'system'
      });

    if (!insertError) {
      console.log('✅ 권한 추가 완료!');
    } else {
      console.log('❌ 권한 추가 실패:', insertError);
    }
  }

  // 4. 최종 확인
  console.log('\n🔍 최종 권한 확인:');
  const { data: finalPerms } = await supabase
    .from('admin_users_rules_permissions')
    .select(`
      can_read,
      can_write,
      can_full,
      admin_systemsetting_menu (
        menu_url,
        menu_page
      )
    `)
    .eq('role_id', roleId)
    .eq('menu_id', menuId);

  if (finalPerms && finalPerms.length > 0) {
    const perm = finalPerms[0];
    console.log(`✅ ${roleName}의 ${perm.admin_systemsetting_menu?.menu_page} 권한:`);
    console.log(`   읽기: ${perm.can_read}, 쓰기: ${perm.can_write}, 전체: ${perm.can_full}`);
  }
})();
