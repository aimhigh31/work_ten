/**
 * admin_systemsetting_menu 테이블의 메뉴 데이터 확인
 */
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

(async () => {
  try {
    console.log('📋 admin_systemsetting_menu 테이블 조회 중...\n');

    const { data: menus, error } = await supabase
      .from('admin_systemsetting_menu')
      .select('*')
      .eq('is_enabled', true)
      .order('display_order', { ascending: true });

    if (error) {
      console.error('❌ 메뉴 조회 실패:', error);
      return;
    }

    console.log('📊 전체 메뉴 수:', menus?.length || 0);

    // 카테고리별 그룹화
    const byCategory = (menus || []).reduce((acc, menu) => {
      const category = menu.menu_category || '기타';
      if (!acc[category]) acc[category] = [];
      acc[category].push(menu);
      return acc;
    }, {});

    console.log('\n📂 카테고리별 메뉴:');
    Object.entries(byCategory).forEach(([category, categoryMenus]) => {
      console.log(`\n  [${category}] (${categoryMenus.length}개):`);
      categoryMenus.forEach(menu => {
        console.log(`    - [레벨 ${menu.menu_level}] ${menu.menu_page} : ${menu.menu_url}`);
      });
    });

    // 기획메뉴 상세 확인
    const planningMenus = menus?.filter(m => m.menu_category === '기획메뉴') || [];
    console.log('\n\n🔍 기획메뉴 상세:');
    if (planningMenus.length === 0) {
      console.log('  ❌ 기획메뉴가 admin_systemsetting_menu 테이블에 없습니다!');
    } else {
      console.log(`  ✅ 기획메뉴가 ${planningMenus.length}개 있습니다:`);
      planningMenus.forEach(menu => {
        console.log(`    - ID: ${menu.id}`);
        console.log(`      레벨: ${menu.menu_level}`);
        console.log(`      페이지명: ${menu.menu_page}`);
        console.log(`      URL: ${menu.menu_url}`);
        console.log(`      활성화: ${menu.is_enabled}`);
        console.log('');
      });
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
})();
