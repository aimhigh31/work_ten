/**
 * 역할 ID 15번 (시스템관리자 - jaesikan 계정) 권한 확인
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

async function checkRole15Permissions() {
  try {
    console.log('✅ Supabase 연결 성공\n');

    const roleId = 15;

    // 1. 역할 정보 조회
    console.log('📊 역할 정보 조회...');
    const { data: role, error: roleError } = await supabase
      .from('admin_users_rules')
      .select('*')
      .eq('id', roleId)
      .single();

    if (roleError || !role) {
      console.error('❌ 역할을 찾을 수 없습니다:', roleError);
      return;
    }

    console.log('역할 정보:', {
      ID: role.id,
      코드: role.role_code,
      이름: role.role_name,
      설명: role.role_description,
      활성화: role.is_active
    });

    // 2. 역할 권한 조회
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
      .eq('role_id', roleId)
      .order('menu_id');

    if (permError) {
      console.error('❌ 권한 조회 실패:', permError);
      return;
    }

    console.log(`\n전체 권한 개수: ${permissions?.length || 0}`);

    // 3. can_view_category가 true인 권한 필터링
    const viewableMenus = permissions?.filter(p => p.can_view_category === true) || [];

    console.log(`📌 카테고리 보기 권한(can_view_category=true): ${viewableMenus.length}개\n`);

    if (viewableMenus.length > 0) {
      console.log('카테고리 보기 권한이 있는 메뉴:');
      console.table(viewableMenus.map(p => ({
        menu_id: p.menu_id,
        카테고리: p.admin_systemsetting_menu?.menu_category,
        페이지: p.admin_systemsetting_menu?.menu_page,
        URL: p.admin_systemsetting_menu?.menu_url,
        활성화: p.admin_systemsetting_menu?.is_enabled,
        순서: p.admin_systemsetting_menu?.display_order
      })));
    } else {
      console.log('⚠️  카테고리 보기 권한이 하나도 없습니다!');

      // 모든 권한 출력
      if (permissions && permissions.length > 0) {
        console.log('\n설정된 권한 (카테고리보기=false):');
        console.table(permissions.slice(0, 10).map(p => ({
          menu_id: p.menu_id,
          카테고리: p.admin_systemsetting_menu?.menu_category,
          페이지: p.admin_systemsetting_menu?.menu_page,
          카테고리보기: p.can_view_category,
          데이터조회: p.can_read_data,
          나의데이터관리: p.can_manage_own
        })));
      }
    }

    // 4. 활성화된 메뉴 확인
    console.log('\n📋 활성화된 메뉴 목록...');
    const { data: allMenus } = await supabase
      .from('admin_systemsetting_menu')
      .select('id, menu_category, menu_page, is_enabled')
      .eq('is_enabled', true);

    console.log(`활성화된 메뉴: ${allMenus?.length || 0}개`);

    // 5. 진단 결과
    console.log('\n\n=== 진단 결과 ===');
    if (viewableMenus.length === 0) {
      console.log('❌ 문제 발견: can_view_category 권한이 하나도 없습니다!');
      console.log('\n💡 해결방법:');
      console.log('   1. 사용자설정 > 역할관리 페이지 접속');
      console.log('   2. "시스템관리자" 역할 편집');
      console.log('   3. 역할권한 탭 클릭');
      console.log('   4. 각 메뉴의 "카테고리보기" 체크박스 선택');
      console.log('   5. 저장 버튼 클릭');
    } else {
      console.log('✅ 권한 설정 정상:', viewableMenus.length, '개 메뉴 표시 예정');
    }

  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

checkRole15Permissions();
