const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function addSecurityPermissions() {
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

    // 2. 보안 관련 메뉴 조회
    const { data: securityMenus } = await supabase
      .from('admin_systemsetting_menu')
      .select('id, menu_page, menu_url')
      .or('menu_page.ilike.%보안점검%,menu_page.ilike.%보안교육%,menu_url.like.%security%');

    console.log('🔍 보안 관련 메뉴:');
    console.table(securityMenus);
    console.log();

    if (!securityMenus || securityMenus.length === 0) {
      throw new Error('보안 관련 메뉴를 찾을 수 없습니다.');
    }

    // 3. 각 메뉴에 대한 권한 확인 및 추가
    let addedCount = 0;
    let updatedCount = 0;
    let existingCount = 0;

    for (const menu of securityMenus) {
      const { data: existingPerm } = await supabase
        .from('admin_users_rules_permissions')
        .select('*')
        .eq('role_id', roleData.id)
        .eq('menu_id', menu.id)
        .maybeSingle();

      if (existingPerm) {
        // 권한이 있는지 확인
        if (existingPerm.can_read && existingPerm.can_write && existingPerm.can_full) {
          console.log(`  ✓ 이미 전체 권한 있음: ${menu.menu_page} (${menu.menu_url})`);
          existingCount++;
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
            .eq('menu_id', menu.id);

          if (!error) {
            console.log(`  ✓ 권한 업데이트: ${menu.menu_page} (${menu.menu_url})`);
            updatedCount++;
          }
        }
      } else {
        // 권한 추가
        const { error } = await supabase
          .from('admin_users_rules_permissions')
          .insert({
            role_id: roleData.id,
            menu_id: menu.id,
            can_read: true,
            can_write: true,
            can_full: true,
            created_at: new Date().toISOString(),
            created_by: 'system',
            updated_at: new Date().toISOString(),
            updated_by: 'system'
          });

        if (!error) {
          console.log(`  ✓ 권한 추가: ${menu.menu_page} (${menu.menu_url})`);
          addedCount++;
        } else {
          console.error(`  ✗ 권한 추가 실패: ${menu.menu_page} - ${error.message}`);
        }
      }
    }

    console.log();
    console.log('========================================');
    console.log('📊 보안 페이지 권한 설정 완료!');
    console.log('========================================');
    console.log(`✅ 이미 있음: ${existingCount}개`);
    console.log(`✅ 추가됨: ${addedCount}개`);
    console.log(`✅ 업데이트됨: ${updatedCount}개`);
    console.log(`📋 총 메뉴: ${securityMenus.length}개`);
    console.log('========================================\n');

    // 4. 최종 확인
    console.log('📊 SYSTEM 역할의 보안 관련 권한 확인:\n');
    const { data: finalPerms } = await supabase
      .from('admin_users_rules_permissions')
      .select(`
        id,
        can_read,
        can_write,
        can_full,
        admin_systemsetting_menu!inner(menu_page, menu_url)
      `)
      .eq('role_id', roleData.id)
      .or('admin_systemsetting_menu.menu_page.ilike.%보안%,admin_systemsetting_menu.menu_url.like.%security%', { foreignTable: 'admin_systemsetting_menu' });

    if (finalPerms && finalPerms.length > 0) {
      const formattedPerms = finalPerms.map(p => ({
        메뉴: p.admin_systemsetting_menu.menu_page,
        URL: p.admin_systemsetting_menu.menu_url,
        읽기: p.can_read ? '✓' : '✗',
        쓰기: p.can_write ? '✓' : '✗',
        전체: p.can_full ? '✓' : '✗'
      }));
      console.table(formattedPerms);
    }

  } catch (error) {
    console.error('❌ 에러 발생:', error.message);
    if (error.details) console.error('상세:', error.details);
    process.exit(1);
  }
}

addSecurityPermissions();
