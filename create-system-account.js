const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function createSystemAccount() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('📡 Supabase 연결 중...');
    console.log('✅ 연결 성공!\n');

    // 1. SYSTEM 역할 생성 또는 확인
    console.log('🔍 SYSTEM 역할 확인/생성 중...');
    let systemRole;

    const { data: existingRole } = await supabase
      .from('admin_users_rules')
      .select('*')
      .eq('role_code', 'ROLE-00-SYSTEM')
      .maybeSingle();

    if (existingRole) {
      systemRole = existingRole;
      console.log(`✅ 기존 SYSTEM 역할 발견: ID ${systemRole.id}`);
    } else {
      const { data: newRole, error: roleError } = await supabase
        .from('admin_users_rules')
        .insert({
          role_code: 'ROLE-00-SYSTEM',
          role_name: '슈퍼관리자',
          role_description: '모든 권한을 가진 시스템 관리자',
          is_active: true,
          created_at: new Date().toISOString(),
          created_by: 'system',
          updated_at: new Date().toISOString(),
          updated_by: 'system'
        })
        .select()
        .single();

      if (roleError) {
        throw new Error(`❌ SYSTEM 역할 생성 실패: ${roleError.message}`);
      }
      systemRole = newRole;
      console.log(`✅ SYSTEM 역할 생성 완료: ID ${systemRole.id}`);
    }
    console.log();

    // 2. SYSTEM 사용자 생성 또는 확인
    console.log('🔍 system 사용자 확인/생성 중...');
    let systemUser;

    const { data: existingUsers } = await supabase
      .from('admin_users_userprofiles')
      .select('*')
      .eq('email', 'system@nexplus.co.kr');

    const existingUser = existingUsers && existingUsers.length > 0 ? existingUsers[0] : null;

    if (existingUser) {
      // 기존 사용자를 시스템 관리자로 업데이트
      const { data: updatedUser, error: updateError } = await supabase
        .from('admin_users_userprofiles')
        .update({
          user_account_id: 'system',
          user_name: 'System Admin',
          role_id: systemRole.id,
          department: '시스템',
          position: 'SYSTEM',
          role: 'admin',
          status: 'active',
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingUser.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`❌ system 사용자 업데이트 실패: ${updateError.message}`);
      }
      systemUser = updatedUser;
      console.log(`✅ 기존 system 사용자를 슈퍼관리자로 업데이트: ID ${systemUser.id}`);
    } else {
      // 1단계: Supabase Auth 사용자 생성
      console.log('  🔐 Supabase Auth 사용자 생성 중...');
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: 'system@nexplus.co.kr',
        password: 'System@2025!',
        email_confirm: true,
        user_metadata: {
          name: 'System Admin'
        }
      });

      if (authError) {
        throw new Error(`❌ Auth 사용자 생성 실패: ${authError.message}`);
      }
      console.log(`  ✅ Auth 사용자 생성 완료: ${authData.user.id}`);

      // 2단계: 프로필 생성
      const { data: newUser, error: userError } = await supabase
        .from('admin_users_userprofiles')
        .insert({
          user_code: 'SYSTEM-001',
          user_account_id: 'system',
          email: 'system@nexplus.co.kr',
          user_name: 'System Admin',
          auth_user_id: authData.user.id,
          role_id: systemRole.id,
          department: '시스템',
          position: 'SYSTEM',
          role: 'admin',
          status: 'active',
          is_active: true,
          phone: '000-0000-0000',
          hire_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

      if (userError) {
        throw new Error(`❌ system 사용자 생성 실패: ${userError.message}`);
      }
      systemUser = newUser;
      console.log(`✅ system 사용자 생성 완료: ID ${systemUser.id}`);
    }
    console.log();

    // 3. 모든 메뉴 가져오기
    console.log('🔍 모든 메뉴 조회 중...');
    const { data: allMenus, error: menuError } = await supabase
      .from('admin_systemsetting_menu')
      .select('id, menu_page, menu_url')
      .order('id');

    if (menuError || !allMenus || allMenus.length === 0) {
      throw new Error(`❌ 메뉴 조회 실패: ${menuError?.message || '메뉴가 없습니다'}`);
    }
    console.log(`✅ ${allMenus.length}개의 메뉴 발견\n`);

    // 4. 각 메뉴에 대한 전체 권한 부여
    console.log('📝 모든 메뉴에 대한 권한 부여 중...');
    let createdCount = 0;
    let updatedCount = 0;

    for (const menu of allMenus) {
      // 기존 권한 확인
      const { data: existingPerm } = await supabase
        .from('admin_users_rules_permissions')
        .select('*')
        .eq('role_id', systemRole.id)
        .eq('menu_id', menu.id)
        .maybeSingle();

      if (existingPerm) {
        // 업데이트
        const { error: updateError } = await supabase
          .from('admin_users_rules_permissions')
          .update({
            can_read: true,
            can_write: true,
            can_full: true,
            updated_at: new Date().toISOString(),
            updated_by: 'system'
          })
          .eq('role_id', systemRole.id)
          .eq('menu_id', menu.id);

        if (!updateError) {
          updatedCount++;
          console.log(`  ✓ 업데이트: ${menu.menu_page} (${menu.menu_url})`);
        }
      } else {
        // 생성
        const { error: insertError } = await supabase
          .from('admin_users_rules_permissions')
          .insert({
            role_id: systemRole.id,
            menu_id: menu.id,
            can_read: true,
            can_write: true,
            can_full: true,
            created_at: new Date().toISOString(),
            created_by: 'system',
            updated_at: new Date().toISOString(),
            updated_by: 'system'
          });

        if (!insertError) {
          createdCount++;
          console.log(`  ✓ 생성: ${menu.menu_page} (${menu.menu_url})`);
        }
      }
    }

    console.log();
    console.log('========================================');
    console.log('📊 SYSTEM 계정 생성 완료!');
    console.log('========================================');
    console.log(`🎭 역할: ${systemRole.role_name} (${systemRole.role_code})`);
    console.log(`👤 사용자 ID: ${systemUser.user_account_id}`);
    console.log(`👤 사용자명: ${systemUser.user_name}`);
    console.log(`📧 이메일: ${systemUser.email}`);
    console.log(`🔑 비밀번호: System@2025!`);
    console.log(`📋 권한: ${allMenus.length}개 메뉴에 대한 전체 권한`);
    console.log(`  - 생성: ${createdCount}개`);
    console.log(`  - 업데이트: ${updatedCount}개`);
    console.log('========================================\n');

    console.log('⚠️  다음 단계:');
    console.log('1. system / System@2025! 로 로그인');
    console.log('   (또는 system@nexplus.co.kr / System@2025!)');
    console.log('2. 모든 메뉴 접근 가능 확인');
    console.log();

  } catch (error) {
    console.error('❌ 에러 발생:', error.message);
    if (error.details) console.error('상세:', error.details);
    if (error.hint) console.error('힌트:', error.hint);
    process.exit(1);
  }
}

createSystemAccount();
