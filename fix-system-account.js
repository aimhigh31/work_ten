const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function fixSystemAccount() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('📡 Supabase 연결 중...');
    console.log('✅ 연결 성공!\n');

    // 1. Auth 사용자 조회
    console.log('🔍 Auth 사용자 조회 중...');
    const { data: { users: authUsers }, error: authListError } = await supabase.auth.admin.listUsers();

    if (authListError) {
      throw new Error(`Auth 사용자 목록 조회 실패: ${authListError.message}`);
    }

    const systemAuthUser = authUsers.find(u => u.email === 'system@nexplus.co.kr');

    if (!systemAuthUser) {
      console.log('❌ Auth 사용자가 없습니다. 새로 생성합니다...');

      // Auth 사용자 생성
      const { data: newAuthData, error: createAuthError } = await supabase.auth.admin.createUser({
        email: 'system@nexplus.co.kr',
        password: 'System@2025!',
        email_confirm: true,
        user_metadata: {
          name: 'System Admin'
        }
      });

      if (createAuthError) {
        throw new Error(`Auth 사용자 생성 실패: ${createAuthError.message}`);
      }

      console.log(`✅ Auth 사용자 생성 완료: ${newAuthData.user.id}`);
      systemAuthUser = newAuthData.user;
    } else {
      console.log(`✅ 기존 Auth 사용자 발견: ${systemAuthUser.id}`);

      // 비밀번호 업데이트
      console.log('🔐 비밀번호 업데이트 중...');
      const { error: updatePwError } = await supabase.auth.admin.updateUserById(
        systemAuthUser.id,
        { password: 'System@2025!' }
      );

      if (updatePwError) {
        console.warn(`⚠️  비밀번호 업데이트 실패: ${updatePwError.message}`);
      } else {
        console.log('✅ 비밀번호 업데이트 완료');
      }
    }
    console.log();

    // 2. SYSTEM 역할 확인/생성
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
        throw new Error(`SYSTEM 역할 생성 실패: ${roleError.message}`);
      }
      systemRole = newRole;
      console.log(`✅ SYSTEM 역할 생성 완료: ID ${systemRole.id}`);
    }
    console.log();

    // 3. 프로필 확인/생성
    console.log('🔍 프로필 확인/생성 중...');

    // auth_user_id로 먼저 검색
    let { data: existingProfile } = await supabase
      .from('admin_users_userprofiles')
      .select('*')
      .eq('auth_user_id', systemAuthUser.id)
      .maybeSingle();

    // auth_user_id로 못 찾으면 이메일로 검색
    if (!existingProfile) {
      const { data: profileByEmail } = await supabase
        .from('admin_users_userprofiles')
        .select('*')
        .eq('email', 'system@nexplus.co.kr')
        .maybeSingle();
      existingProfile = profileByEmail;
    }

    let systemProfile;

    if (existingProfile) {
      // 프로필 업데이트
      const { data: updatedProfile, error: updateError } = await supabase
        .from('admin_users_userprofiles')
        .update({
          auth_user_id: systemAuthUser.id,
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
        .eq('id', existingProfile.id)
        .select()
        .single();

      if (updateError) {
        throw new Error(`프로필 업데이트 실패: ${updateError.message}`);
      }
      systemProfile = updatedProfile;
      console.log(`✅ 기존 프로필 업데이트 완료: ID ${systemProfile.id}`);
    } else {
      // 프로필 생성
      const { data: newProfile, error: profileError } = await supabase
        .from('admin_users_userprofiles')
        .insert({
          user_code: 'SYSTEM-001',
          user_account_id: 'system',
          email: 'system@nexplus.co.kr',
          user_name: 'System Admin',
          auth_user_id: systemAuthUser.id,
          role_id: systemRole.id,
          department: '시스템',
          position: 'SYSTEM',
          role: 'admin',
          status: 'active',
          is_active: true,
          phone: '000-0000-0000',
          hire_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          created_by: 'system',
          updated_by: 'system'
        })
        .select()
        .single();

      if (profileError) {
        throw new Error(`프로필 생성 실패: ${profileError.message}`);
      }
      systemProfile = newProfile;
      console.log(`✅ 프로필 생성 완료: ID ${systemProfile.id}`);
    }
    console.log();

    // 4. 모든 메뉴 조회
    console.log('🔍 모든 메뉴 조회 중...');
    const { data: allMenus, error: menuError } = await supabase
      .from('admin_systemsetting_menu')
      .select('id, menu_page, menu_url')
      .order('id');

    if (menuError || !allMenus || allMenus.length === 0) {
      throw new Error(`메뉴 조회 실패: ${menuError?.message || '메뉴가 없습니다'}`);
    }
    console.log(`✅ ${allMenus.length}개의 메뉴 발견\n`);

    // 5. 각 메뉴에 대한 전체 권한 부여
    console.log('📝 모든 메뉴에 대한 권한 부여 중...');
    let createdCount = 0;
    let updatedCount = 0;

    for (const menu of allMenus) {
      const { data: existingPerm } = await supabase
        .from('admin_users_rules_permissions')
        .select('*')
        .eq('role_id', systemRole.id)
        .eq('menu_id', menu.id)
        .maybeSingle();

      if (existingPerm) {
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
    console.log('✅ SYSTEM 계정 설정 완료!');
    console.log('========================================');
    console.log(`👤 사용자 ID: system`);
    console.log(`🔑 비밀번호: System@2025!`);
    console.log(`📧 이메일: system@nexplus.co.kr`);
    console.log(`🎭 역할: ${systemRole.role_name} (${systemRole.role_code})`);
    console.log(`📋 권한: ${allMenus.length}개 메뉴에 대한 전체 권한`);
    console.log(`  - 생성: ${createdCount}개`);
    console.log(`  - 업데이트: ${updatedCount}개`);
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ 에러 발생:', error.message);
    if (error.details) console.error('상세:', error.details);
    if (error.hint) console.error('힌트:', error.hint);
    process.exit(1);
  }
}

fixSystemAccount();
