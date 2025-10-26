require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('🔍 인사평가관리 페이지 권한 확인\n');

  // 1. 인사평가관리 메뉴 확인
  const { data: menu, error: menuError } = await supabase
    .from('admin_systemsetting_menu')
    .select('*')
    .or('page_name.ilike.%평가%,menu_url.ilike.%evaluation%');

  console.log('📋 인사평가 관련 메뉴:');
  if (menu && menu.length > 0) {
    menu.forEach(m => {
      console.log(`  - ID: ${m.id}, 페이지명: ${m.page_name}, URL: ${m.menu_url}, 사용여부: ${m.is_used}`);
    });
  } else {
    console.log('  ❌ 인사평가 관련 메뉴를 찾을 수 없습니다.');
  }

  // 2. 슈퍼관리자 역할 확인
  const { data: roles, error: rolesError } = await supabase
    .from('admin_user_role')
    .select('*')
    .eq('role_name', '슈퍼관리자');

  console.log('\n👑 슈퍼관리자 역할:');
  if (roles && roles.length > 0) {
    console.log(`  - ID: ${roles[0].id}, 역할명: ${roles[0].role_name}`);

    // 3. 슈퍼관리자의 모든 권한 확인
    const { data: permissions, error: permError } = await supabase
      .from('admin_role_permission')
      .select('*, admin_systemsetting_menu(*)')
      .eq('role_id', roles[0].id);

    console.log('\n🔑 슈퍼관리자의 모든 권한 개수:', permissions?.length);

    // 인사평가 관련 권한만 필터링
    const evalPermissions = permissions?.filter(p =>
      p.admin_systemsetting_menu?.page_name?.includes('평가') ||
      p.admin_systemsetting_menu?.menu_url?.includes('evaluation')
    );

    console.log('\n📝 인사평가 관련 권한:');
    if (evalPermissions && evalPermissions.length > 0) {
      evalPermissions.forEach(p => {
        console.log(`  - 메뉴: ${p.admin_systemsetting_menu?.page_name}`);
        console.log(`    URL: ${p.admin_systemsetting_menu?.menu_url}`);
        console.log(`    읽기: ${p.can_read}, 쓰기: ${p.can_write}, 전체: ${p.can_full}`);
      });
    } else {
      console.log('  ❌ 인사평가 관련 권한이 없습니다.');
    }
  } else {
    console.log('  ❌ 슈퍼관리자 역할을 찾을 수 없습니다.');
  }

  // 4. /hr/evaluation URL로 메뉴 검색
  console.log('\n🔍 /hr/evaluation URL로 메뉴 검색:');
  const { data: hrMenu, error: hrError } = await supabase
    .from('admin_systemsetting_menu')
    .select('*')
    .eq('menu_url', '/hr/evaluation');

  if (hrMenu && hrMenu.length > 0) {
    console.log('  ✅ /hr/evaluation 메뉴 발견:', hrMenu[0].page_name);
  } else {
    console.log('  ❌ /hr/evaluation 메뉴가 DB에 없습니다.');
    console.log('  💡 메뉴를 먼저 생성해야 합니다.');
  }
})();
