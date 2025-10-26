const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://exxumujwufzqnovhzvif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eHVtdWp3dWZ6cW5vdmh6dmlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjAwOSwiZXhwIjoyMDczMjMyMDA5fQ.VcS_o4yWlpj074ht78r1w-Ho8Ze6uFySLj7YWb32DgE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function grantPermissions() {
  console.log('슈퍼관리자 권한 부여 시작\n');

  // 1. 슈퍼관리자 역할 찾기
  const { data: superAdminRole } = await supabase
    .from('admin_users_rules')
    .select('id, role_code, role_name')
    .eq('role_code', 'ROLE-00-SYSTEM')
    .single();

  if (!superAdminRole) {
    console.error('슈퍼관리자 역할을 찾을 수 없습니다.');
    return;
  }

  console.log('슈퍼관리자 역할 ID:', superAdminRole.id, '-', superAdminRole.role_name);

  // 2. 모든 메뉴 조회
  const { data: allMenus } = await supabase
    .from('admin_systemsetting_menu')
    .select('id, menu_page, menu_url, menu_category')
    .order('id');

  console.log('총 메뉴:', allMenus ? allMenus.length : 0, '개\n');

  if (!allMenus || allMenus.length === 0) {
    console.log('메뉴가 없습니다.');
    return;
  }

  // 3. 각 메뉴에 full 권한 부여
  for (const menu of allMenus) {
    console.log('처리 중:', menu.menu_url, '(' + menu.menu_page + ')');

    // 기존 권한 확인
    const { data: existing } = await supabase
      .from('admin_users_menu_permissions')
      .select('*')
      .eq('role_id', superAdminRole.id)
      .eq('menu_id', menu.id)
      .maybeSingle();

    if (existing) {
      // 업데이트
      const { error } = await supabase
        .from('admin_users_menu_permissions')
        .update({
          can_read: true,
          can_write: true,
          can_full: true
        })
        .eq('role_id', superAdminRole.id)
        .eq('menu_id', menu.id);

      if (error) {
        console.log('  업데이트 실패:', error.message);
      } else {
        console.log('  업데이트 완료');
      }
    } else {
      // 신규 생성
      const { error } = await supabase
        .from('admin_users_menu_permissions')
        .insert([{
          role_id: superAdminRole.id,
          menu_id: menu.id,
          can_read: true,
          can_write: true,
          can_full: true
        }]);

      if (error) {
        console.log('  생성 실패:', error.message);
      } else {
        console.log('  생성 완료');
      }
    }
  }

  console.log('\n권한 부여 완료!');

  // 4. 최종 확인
  const { data: permissions } = await supabase
    .from('admin_users_menu_permissions')
    .select('menu_id, can_read, can_write, can_full')
    .eq('role_id', superAdminRole.id);

  console.log('\n슈퍼관리자 권한:', permissions ? permissions.length : 0, '개');
}

grantPermissions().catch(console.error);
