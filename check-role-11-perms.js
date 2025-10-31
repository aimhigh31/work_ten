require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function checkRole11() {
  try {
    console.log('role_id 11 (일반조회) 권한 확인...\n');
    
    const { data: permissions } = await supabase
      .from('admin_users_rules_permissions')
      .select('*, admin_systemsetting_menu(menu_category, menu_page, menu_url, is_enabled)')
      .eq('role_id', 11)
      .eq('can_view_category', true);

    console.log('can_view_category=true 권한:', permissions?.length || 0, '개\n');
    
    if (!permissions || permissions.length === 0) {
      console.log('❌ can_view_category 권한이 없습니다!');
      console.log('해결: 역할관리 탭에서 role_id 11에 권한 설정 필요');
      return;
    }

    console.log('카테고리 보기 권한이 있는 메뉴:');
    console.table(permissions.slice(0, 10).map(p => ({
      menu_id: p.menu_id,
      카테고리: p.admin_systemsetting_menu?.menu_category,
      페이지: p.admin_systemsetting_menu?.menu_page,
      URL: p.admin_systemsetting_menu?.menu_url,
      활성화: p.admin_systemsetting_menu?.is_enabled
    })));

    console.log('\n✅ 권한이 설정되어 있습니다.');
    console.log('jaesikan 계정으로 로그아웃 후 재로그인하세요.');
  } catch (error) {
    console.error('오류:', error);
  }
}

checkRole11();
