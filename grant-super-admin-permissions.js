const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://exxumujwufzqnovhzvif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eHVtdWp3dWZ6cW5vdmh6dmlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjAwOSwiZXhwIjoyMDczMjMyMDA5fQ.VcS_o4yWlpj074ht78r1w-Ho8Ze6uFySLj7YWb32DgE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function grantSuperAdminPermissions() {
  console.log('🔐 [슈퍼관리자 권한 부여] 시작...\n');

  // 1. 슈퍼관리자 역할 찾기
  const { data: superAdminRole, error: roleError } = await supabase
    .from('admin_users_rules')
    .select('id, role_code, role_name')
    .eq('role_code', 'ROLE-00-SYSTEM')
    .single();

  if (roleError || !superAdminRole) {
    console.error('슈퍼관리자 역할을 찾을 수 없습니다:', roleError);
    return;
  }

  console.log('슈퍼관리자 역할:', superAdminRole.id, '-', superAdminRole.role_name);
  console.log('\n');

  // 2. 모든 메뉴 조회
  const { data: allMenus, error: menuError } = await supabase
    .from('admin_systemsetting_menu')
    .select('id, menu_path, menu_name')
    .order('id');

  if (menuError || !allMenus) {
    console.error('메뉴 조회 실패:', menuError);
    return;
  }

  console.log('총 메뉴 개수:', allMenus.length);
  console.log('\n');

  // 3. 각 메뉴에 대해 full 권한 부여
  for (const menu of allMenus) {
    console.log('권한 부여 중:', menu.menu_path, '-', menu.menu_name);

    // 기존 권한 확인
    const { data: existing } = await supabase
      .from('admin_users_menu_permissions')
      .select('*')
      .eq('role_id', superAdminRole.id)
      .eq('menu_id', menu.id)
      .single();

    if (existing) {
      // 기존 권한 업데이트
      const { error: updateError } = await supabase
        .from('admin_users_menu_permissions')
        .update({
          can_read: true,
          can_write: true,
          can_full: true
        })
        .eq('role_id', superAdminRole.id)
        .eq('menu_id', menu.id);

      if (updateError) {
        console.error('  업데이트 실패:', updateError);
      } else {
        console.log('  업데이트 완료 (full 권한)');
      }
    } else {
      // 새 권한 생성
      const { error: insertError } = await supabase
        .from('admin_users_menu_permissions')
        .insert([{
          role_id: superAdminRole.id,
          menu_id: menu.id,
          can_read: true,
          can_write: true,
          can_full: true
        }]);

      if (insertError) {
        console.error('  생성 실패:', insertError);
      } else {
        console.log('  생성 완료 (full 권한)');
      }
    }
  }

  console.log('\n슈퍼관리자 권한 부여 완료!');

  // 4. 최종 확인
  const { data: finalPermissions } = await supabase
    .from('admin_users_menu_permissions')
    .select('menu_id, can_read, can_write, can_full')
    .eq('role_id', superAdminRole.id);

  console.log('\n슈퍼관리자 권한 목록:', finalPermissions ? finalPermissions.length : 0, '개');
}

grantSuperAdminPermissions().catch(console.error);
