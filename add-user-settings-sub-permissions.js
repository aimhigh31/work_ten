const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function addUserSettingsSubPermissions() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('📡 Supabase 연결 중...');
    console.log('✅ 연결 성공!\n');

    // 1. SYSTEM 역할 ID 조회
    const { data: roleData } = await supabase
      .from('admin_users_rules')
      .select('id, role_name')
      .eq('role_code', 'ROLE-00-SYSTEM')
      .single();

    if (!roleData) {
      throw new Error('SYSTEM 역할을 찾을 수 없습니다.');
    }
    console.log(`✅ 역할 ID: ${roleData.id} (${roleData.role_name})\n`);

    // 2. 사용자설정 관련 메뉴 조회
    const menuUrls = [
      '/admin-panel/user-management',
      '/admin-panel/department-management',
      '/admin-panel/role-management'
    ];

    console.log('🔍 사용자설정 관련 메뉴 조회 중...\n');

    let addedCount = 0;
    let updatedCount = 0;
    let notFoundCount = 0;

    for (const menuUrl of menuUrls) {
      // 메뉴 조회
      const { data: menuData } = await supabase
        .from('admin_systemsetting_menu')
        .select('id, menu_page, menu_url')
        .eq('menu_url', menuUrl)
        .maybeSingle();

      if (!menuData) {
        console.log(`  ⚠️  메뉴를 찾을 수 없음: ${menuUrl}`);
        notFoundCount++;
        continue;
      }

      console.log(`  ✓ 메뉴 발견: ${menuData.menu_page} (${menuData.menu_url})`);

      // 기존 권한 확인
      const { data: existingPerm } = await supabase
        .from('admin_users_rules_permissions')
        .select('*')
        .eq('role_id', roleData.id)
        .eq('menu_id', menuData.id)
        .maybeSingle();

      if (existingPerm) {
        // 권한이 있는지 확인
        if (existingPerm.can_read && existingPerm.can_write && existingPerm.can_full) {
          console.log(`    → 이미 전체 권한 있음\n`);
        } else {
          // 권한 업데이트
          const { error } = await supabase
            .from('admin_users_rules_permissions')
            .update({
              can_read: true,
              can_write: true,
              can_full: true,
              updated_at: new Date().toISOString(),
              updated_by: 'system'
            })
            .eq('role_id', roleData.id)
            .eq('menu_id', menuData.id);

          if (!error) {
            console.log(`    → 권한 업데이트 완료\n`);
            updatedCount++;
          }
        }
      } else {
        // 권한 추가
        const { error } = await supabase
          .from('admin_users_rules_permissions')
          .insert({
            role_id: roleData.id,
            menu_id: menuData.id,
            can_read: true,
            can_write: true,
            can_full: true,
            created_at: new Date().toISOString(),
            created_by: 'system',
            updated_at: new Date().toISOString(),
            updated_by: 'system'
          });

        if (!error) {
          console.log(`    → 권한 추가 완료\n`);
          addedCount++;
        } else {
          console.error(`    → 권한 추가 실패: ${error.message}\n`);
        }
      }
    }

    console.log('========================================');
    console.log('📊 사용자설정 관련 권한 설정 완료!');
    console.log('========================================');
    console.log(`✅ 추가됨: ${addedCount}개`);
    console.log(`✅ 업데이트됨: ${updatedCount}개`);
    console.log(`⚠️  찾을 수 없음: ${notFoundCount}개`);
    console.log('========================================\n');

    if (notFoundCount > 0) {
      console.log('⚠️  일부 메뉴를 찾을 수 없습니다.');
      console.log('   admin_systemsetting_menu 테이블에 해당 메뉴가 등록되어 있는지 확인해주세요.\n');
    }

  } catch (error) {
    console.error('❌ 에러 발생:', error.message);
    if (error.details) console.error('상세:', error.details);
    process.exit(1);
  }
}

addUserSettingsSubPermissions();
