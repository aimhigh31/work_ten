require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('🔍 모든 관리자 역할에 인사평가관리 권한 추가\n');

  const menuId = 51;
  const adminRoleIds = [1, 11, 15, 18]; // 모든 관리자 역할 ID

  for (const roleId of adminRoleIds) {
    // 역할 정보 가져오기
    const { data: role } = await supabase
      .from('admin_users_rules')
      .select('role_name')
      .eq('id', roleId)
      .single();

    if (!role) continue;

    console.log(`\n📋 ${role.role_name} (ID: ${roleId})`);

    // 기존 권한 확인
    const { data: existingPerm } = await supabase
      .from('admin_users_rules_permissions')
      .select('*')
      .eq('role_id', roleId)
      .eq('menu_id', menuId)
      .maybeSingle();

    if (existingPerm) {
      if (existingPerm.can_read && existingPerm.can_write) {
        console.log('   ✅ 권한이 이미 올바르게 설정되어 있습니다.');
      } else {
        await supabase
          .from('admin_users_rules_permissions')
          .update({
            can_read: true,
            can_write: true,
            can_full: true
          })
          .eq('id', existingPerm.id);
        console.log('   ✅ 권한 업데이트 완료!');
      }
    } else {
      const { error } = await supabase
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

      if (!error) {
        console.log('   ✅ 권한 추가 완료!');
      } else {
        console.log('   ❌ 권한 추가 실패:', error.message);
      }
    }
  }

  console.log('\n\n✅ 모든 관리자 역할에 인사평가관리 권한이 추가되었습니다!');
  console.log('페이지를 새로고침하거나 다시 로그인하면 권한이 적용됩니다.');
})();
