const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

async function executeSQL() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('📡 Supabase 연결 중...');
    console.log('✅ 연결 성공!\n');

    // 1. ROLE-25-ADMIN 역할 ID 조회
    console.log('🔍 ROLE-25-ADMIN 역할 조회 중...');
    const { data: roleData, error: roleError } = await supabase
      .from('admin_users_rules')
      .select('id, role_name')
      .eq('role_code', 'ROLE-25-ADMIN')
      .single();

    if (roleError || !roleData) {
      throw new Error(`❌ ROLE-25-ADMIN 역할을 찾을 수 없습니다: ${roleError?.message || '데이터 없음'}`);
    }
    console.log(`✅ 역할 ID: ${roleData.id} (${roleData.role_name})\n`);

    // 2. 사용자설정 메뉴 ID 조회
    console.log('🔍 사용자설정 메뉴 조회 중...');
    const { data: menuData, error: menuError } = await supabase
      .from('admin_systemsetting_menu')
      .select('id, menu_page, menu_url')
      .or('menu_url.eq./admin-panel/user-settings,menu_page.ilike.%사용자설정%,menu_page.ilike.%사용자 설정%')
      .limit(1)
      .single();

    if (menuError || !menuData) {
      throw new Error(`❌ 사용자설정 메뉴를 찾을 수 없습니다: ${menuError?.message || '데이터 없음'}`);
    }
    console.log(`✅ 메뉴 ID: ${menuData.id} (${menuData.menu_page})\n`);

    // 3. 기존 권한 확인
    console.log('🔍 기존 권한 확인 중...');
    const { data: existingPerm, error: checkError } = await supabase
      .from('admin_users_rules_permissions')
      .select('*')
      .eq('role_id', roleData.id)
      .eq('menu_id', menuData.id)
      .maybeSingle();

    if (existingPerm) {
      // 기존 권한 업데이트
      console.log('⚠️  기존 권한이 존재합니다. 업데이트합니다...\n');
      const { error: updateError } = await supabase
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

      if (updateError) {
        throw new Error(`❌ 권한 업데이트 실패: ${updateError.message}`);
      }
      console.log('✅ 권한이 업데이트되었습니다!\n');
    } else {
      // 새 권한 추가
      console.log('📝 새 권한을 추가합니다...\n');
      const { error: insertError } = await supabase
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

      if (insertError) {
        throw new Error(`❌ 권한 추가 실패: ${insertError.message}`);
      }
      console.log('✅ 새 권한이 추가되었습니다!\n');
    }

    // 4. 결과 확인
    console.log('========================================');
    console.log('📊 권한 추가 완료');
    console.log(`👤 사용자: jsan (jaesikan@nexplus.co.kr)`);
    console.log(`🎭 역할: ${roleData.role_name} (ROLE-25-ADMIN)`);
    console.log(`📄 메뉴: ${menuData.menu_page} (${menuData.menu_url})`);
    console.log('✅ 권한: READ, WRITE, FULL');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ 에러 발생:', error.message);
    if (error.details) console.error('상세:', error.details);
    if (error.hint) console.error('힌트:', error.hint);
    process.exit(1);
  }
}

executeSQL();
