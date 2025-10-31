/**
 * 역할 ID 11번 (시스템 관리자 - system 계정) 권한 자동 설정
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function setupRole11Permissions() {
  try {
    console.log('✅ Supabase 연결 성공\n');

    const roleId = 11;

    // 1. 역할 활성화
    console.log('📋 1단계: 역할 활성화...');
    const { error: activateError } = await supabase
      .from('admin_users_rules')
      .update({ is_active: true })
      .eq('id', roleId);

    if (activateError) {
      console.error('❌ 역할 활성화 실패:', activateError);
      return;
    }
    console.log('✅ 역할 활성화 완료\n');

    // 2. 활성화된 모든 메뉴 조회
    console.log('📋 2단계: 활성화된 메뉴 조회...');
    const { data: menus, error: menuError } = await supabase
      .from('admin_systemsetting_menu')
      .select('id, menu_category, menu_page, menu_url')
      .eq('is_enabled', true)
      .order('id');

    if (menuError || !menus || menus.length === 0) {
      console.error('❌ 메뉴 조회 실패:', menuError);
      return;
    }

    console.log(`✅ ${menus.length}개 메뉴 발견\n`);

    // 3. 기존 권한 삭제
    console.log('📋 3단계: 기존 권한 삭제...');
    const { error: deleteError } = await supabase
      .from('admin_users_rules_permissions')
      .delete()
      .eq('role_id', roleId);

    if (deleteError) {
      console.log('⚠️  기존 권한 삭제 중 오류 (권한이 없을 수 있음):', deleteError.message);
    } else {
      console.log('✅ 기존 권한 삭제 완료\n');
    }

    // 4. 새 권한 생성
    console.log('📋 4단계: 새 권한 생성...');
    console.log('   모든 메뉴에 대해 전체 권한 부여 중...\n');

    const permissionsToInsert = menus.map(menu => ({
      role_id: roleId,
      menu_id: menu.id,
      can_read: true,
      can_write: true,
      can_full: true,
      can_view_category: true,
      can_read_data: true,
      can_manage_own: true,
      can_edit_others: true,
      created_by: 'system',
      updated_by: 'system'
    }));

    const { error: insertError } = await supabase
      .from('admin_users_rules_permissions')
      .insert(permissionsToInsert);

    if (insertError) {
      console.error('❌ 권한 생성 실패:', insertError);
      return;
    }

    console.log(`✅ ${permissionsToInsert.length}개 권한 생성 완료!\n`);

    // 5. 결과 확인
    console.log('📋 5단계: 결과 확인...');
    const { data: newPermissions } = await supabase
      .from('admin_users_rules_permissions')
      .select('menu_id, can_view_category')
      .eq('role_id', roleId)
      .eq('can_view_category', true);

    console.log(`✅ 카테고리 보기 권한: ${newPermissions?.length || 0}개\n`);

    // 6. 완료 메시지
    console.log('\n🎉 권한 설정 완료!\n');
    console.log('다음 단계:');
    console.log('  1. 브라우저에서 완전 로그아웃');
    console.log('  2. 캐시 삭제 (Ctrl + Shift + Delete)');
    console.log('  3. system@nexplus.co.kr로 다시 로그인');
    console.log('  4. 좌측 사이드바에 메뉴가 표시되는지 확인\n');

  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

setupRole11Permissions();
