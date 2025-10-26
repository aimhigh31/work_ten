const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://exxumujwufzqnovhzvif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eHVtdWp3dWZ6cW5vdmh6dmlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjAwOSwiZXhwIjoyMDczMjMyMDA5fQ.VcS_o4yWlpj074ht78r1w-Ho8Ze6uFySLj7YWb32DgE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function grantAllPermissions() {
  console.log('슈퍼관리자 전체 권한 부여 시작\n');

  // 1. 슈퍼관리자 역할 찾기
  const { data: superAdmin } = await supabase
    .from('admin_users_rules')
    .select('id, role_code, role_name')
    .eq('role_code', 'ROLE-00-SYSTEM')
    .single();

  if (!superAdmin) {
    console.error('슈퍼관리자 역할을 찾을 수 없습니다.');
    return;
  }

  console.log('슈퍼관리자:', superAdmin.id, '-', superAdmin.role_name, '\n');

  // 2. 모든 메뉴 조회
  const { data: menus } = await supabase
    .from('admin_systemsetting_menu')
    .select('id, menu_page, menu_url, menu_category')
    .order('id');

  if (!menus || menus.length === 0) {
    console.log('메뉴가 없습니다.');
    return;
  }

  console.log('총 메뉴:', menus.length, '개\n');

  // 3. 각 메뉴에 full 권한 부여
  let created = 0;
  let updated = 0;
  let failed = 0;

  for (const menu of menus) {
    console.log('처리중:', menu.menu_url, '(' + menu.menu_page + ')');

    // 기존 권한 확인
    const { data: existing } = await supabase
      .from('admin_users_rules_permissions')
      .select('*')
      .eq('role_id', superAdmin.id)
      .eq('menu_id', menu.id)
      .maybeSingle();

    if (existing) {
      // 업데이트
      const { error } = await supabase
        .from('admin_users_rules_permissions')
        .update({
          can_read: true,
          can_write: true,
          can_full: true
        })
        .eq('role_id', superAdmin.id)
        .eq('menu_id', menu.id);

      if (error) {
        console.log('  ❌ 업데이트 실패:', error.message);
        failed++;
      } else {
        console.log('  ✅ 업데이트 완료');
        updated++;
      }
    } else {
      // 신규 생성
      const { error } = await supabase
        .from('admin_users_rules_permissions')
        .insert([{
          role_id: superAdmin.id,
          menu_id: menu.id,
          can_read: true,
          can_write: true,
          can_full: true
        }]);

      if (error) {
        console.log('  ❌ 생성 실패:', error.message);
        failed++;
      } else {
        console.log('  ✅ 생성 완료');
        created++;
      }
    }
  }

  console.log('\n=============================');
  console.log('권한 부여 완료!');
  console.log('생성:', created, '개');
  console.log('업데이트:', updated, '개');
  console.log('실패:', failed, '개');
  console.log('=============================\n');

  // 4. 최종 확인
  const { data: finalPerms } = await supabase
    .from('admin_users_rules_permissions')
    .select('menu_id, can_read, can_write, can_full')
    .eq('role_id', superAdmin.id);

  console.log('슈퍼관리자 최종 권한:', finalPerms ? finalPerms.length : 0, '개');
}

grantAllPermissions().catch(console.error);
