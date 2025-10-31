/**
 * system 계정 권한 확인
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

async function checkSystemPermissions() {
  try {
    console.log('✅ Supabase 연결 성공\n');

    // system 계정 조회
    console.log('📊 system 계정 정보 조회...');
    const { data: user, error: userError } = await supabase
      .from('admin_users_userprofiles')
      .select(`
        id,
        email,
        role_id,
        admin_users_rules (
          id,
          role_code,
          role_name,
          is_active
        )
      `)
      .eq('email', 'system@nexplus.co.kr')
      .single();

    if (userError || !user) {
      console.error('❌ 계정을 찾을 수 없습니다:', userError);
      return;
    }

    console.log('\n=== system 계정 정보 ===');
    console.log('이메일:', user.email);
    console.log('role_id:', user.role_id);
    console.log('역할 정보:', user.admin_users_rules);

    if (!user.role_id) {
      console.log('\n❌ role_id가 null입니다!');
      return;
    }

    // 역할 권한 조회
    console.log('\n📋 역할 권한 조회...');
    const { data: permissions, error: permError } = await supabase
      .from('admin_users_rules_permissions')
      .select(`
        menu_id,
        can_view_category,
        can_read_data,
        can_manage_own,
        can_edit_others,
        can_full,
        admin_systemsetting_menu (
          id,
          menu_category,
          menu_page,
          menu_url,
          is_enabled,
          display_order
        )
      `)
      .eq('role_id', user.role_id)
      .order('menu_id');

    if (permError) {
      console.error('❌ 권한 조회 실패:', permError);
      return;
    }

    console.log(`\n전체 권한 개수: ${permissions?.length || 0}`);

    // can_view_category가 true인 권한 필터링
    const viewableMenus = permissions?.filter(p => p.can_view_category === true) || [];

    console.log(`📌 카테고리 보기 권한(can_view_category=true): ${viewableMenus.length}개\n`);

    if (viewableMenus.length > 0) {
      console.log('카테고리 보기 권한이 있는 메뉴:');
      console.table(viewableMenus.slice(0, 10).map(p => ({
        menu_id: p.menu_id,
        카테고리: p.admin_systemsetting_menu?.menu_category,
        페이지: p.admin_systemsetting_menu?.menu_page,
        URL: p.admin_systemsetting_menu?.menu_url,
        활성화: p.admin_systemsetting_menu?.is_enabled,
        순서: p.admin_systemsetting_menu?.display_order
      })));
    } else {
      console.log('⚠️  카테고리 보기 권한이 하나도 없습니다!');
      console.log('\n💡 해결방법:');
      console.log(`   node setup-role-${user.role_id}-permissions.js`);
    }

  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

checkSystemPermissions();
