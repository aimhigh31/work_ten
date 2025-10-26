require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('🔍 인사평가관리 권한 확인 및 수정\n');

  // 1. system 사용자 확인
  const { data: users, error: userError } = await supabase
    .from('admin_user_management')
    .select('*')
    .eq('user_id', 'system')
    .single();

  if (!users) {
    console.log('❌ system 사용자를 찾을 수 없습니다.');
    return;
  }

  console.log(`✅ system 사용자 발견:`);
  console.log(`   user_id: ${users.user_id}, role_id: ${users.role_id}, role_name: ${users.role_name}`);

  const roleId = users.role_id;

  // 2. /hr/evaluation 메뉴 확인 (이미 ID 51인 것을 알고 있음)
  const menuId = 51;
  console.log(`\n✅ /hr/evaluation 메뉴 ID: ${menuId}`);

  // 3. 현재 권한 확인
  const { data: existingPerm, error: permError } = await supabase
    .from('admin_users_rules_permissions')
    .select('*')
    .eq('role_id', roleId)
    .eq('menu_id', menuId)
    .single();

  if (existingPerm) {
    console.log('\n✅ 권한이 이미 존재합니다:');
    console.log(`   읽기: ${existingPerm.can_read}, 쓰기: ${existingPerm.can_write}, 전체: ${existingPerm.can_full}`);

    if (existingPerm.can_read && existingPerm.can_write) {
      console.log('\n✅ 권한이 정상적으로 설정되어 있습니다!');
    } else {
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

      if (updateError) {
        console.log('❌ 권한 업데이트 실패:', updateError);
      } else {
        console.log('✅ 권한 업데이트 완료!');
      }
    }
  } else {
    console.log('\n❌ 권한이 없습니다. 권한을 추가합니다...');

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

    if (insertError) {
      console.log('❌ 권한 추가 실패:', insertError);
    } else {
      console.log('✅ 권한 추가 완료!');
    }
  }

  // 4. 최종 확인
  console.log('\n\n🔍 최종 확인:');
  const { data: finalPerm } = await supabase
    .from('admin_users_rules_permissions')
    .select(`
      can_read,
      can_write,
      can_full,
      admin_systemsetting_menu (
        menu_url,
        menu_page,
        menu_category
      )
    `)
    .eq('role_id', roleId)
    .eq('menu_id', menuId)
    .single();

  if (finalPerm) {
    console.log('✅ 권한 설정 완료:');
    console.log(`   메뉴: ${finalPerm.admin_systemsetting_menu?.menu_page} (${finalPerm.admin_systemsetting_menu?.menu_url})`);
    console.log(`   읽기: ${finalPerm.can_read}, 쓰기: ${finalPerm.can_write}, 전체: ${finalPerm.can_full}`);
  }
})();
