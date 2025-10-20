const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkSystemUser() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('📡 Supabase 연결 중...\n');

    // 1. Auth 사용자 확인
    console.log('🔍 Auth 사용자 확인:');
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
    const systemAuthUser = authUsers.find(u => u.email === 'system@nexplus.co.kr');

    if (systemAuthUser) {
      console.log('✅ Auth 사용자 발견');
      console.log(`   ID: ${systemAuthUser.id}`);
      console.log(`   Email: ${systemAuthUser.email}`);
      console.log(`   Created: ${systemAuthUser.created_at}`);
    } else {
      console.log('❌ Auth 사용자 없음');
    }
    console.log();

    // 2. 프로필 확인
    console.log('🔍 프로필 확인 (이메일로 검색):');
    const { data: profileByEmail, error: emailError } = await supabase
      .from('admin_users_userprofiles')
      .select('*')
      .eq('email', 'system@nexplus.co.kr')
      .maybeSingle();

    if (profileByEmail) {
      console.log('✅ 프로필 발견 (이메일 검색)');
      console.log(`   ID: ${profileByEmail.id}`);
      console.log(`   user_code: ${profileByEmail.user_code}`);
      console.log(`   user_account_id: ${profileByEmail.user_account_id}`);
      console.log(`   email: ${profileByEmail.email}`);
      console.log(`   user_name: ${profileByEmail.user_name}`);
      console.log(`   auth_user_id: ${profileByEmail.auth_user_id}`);
      console.log(`   role_id: ${profileByEmail.role_id}`);
      console.log(`   status: ${profileByEmail.status}`);
      console.log(`   is_active: ${profileByEmail.is_active}`);
    } else {
      console.log('❌ 프로필 없음 (이메일 검색)');
      if (emailError) console.log(`   에러: ${emailError.message}`);
    }
    console.log();

    // 3. user_account_id로 검색
    console.log('🔍 프로필 확인 (user_account_id로 검색):');
    const { data: profileByAccountId, error: accountError } = await supabase
      .from('admin_users_userprofiles')
      .select('*')
      .eq('user_account_id', 'system')
      .maybeSingle();

    if (profileByAccountId) {
      console.log('✅ 프로필 발견 (user_account_id 검색)');
      console.log(`   ID: ${profileByAccountId.id}`);
      console.log(`   user_code: ${profileByAccountId.user_code}`);
      console.log(`   user_account_id: ${profileByAccountId.user_account_id}`);
      console.log(`   email: ${profileByAccountId.email}`);
    } else {
      console.log('❌ 프로필 없음 (user_account_id 검색)');
      if (accountError) console.log(`   에러: ${accountError.message}`);
    }
    console.log();

    // 4. user_code로 검색
    console.log('🔍 프로필 확인 (user_code로 검색):');
    const { data: profileByCode, error: codeError } = await supabase
      .from('admin_users_userprofiles')
      .select('*')
      .eq('user_code', 'system')
      .maybeSingle();

    if (profileByCode) {
      console.log('✅ 프로필 발견 (user_code 검색)');
      console.log(`   ID: ${profileByCode.id}`);
      console.log(`   user_code: ${profileByCode.user_code}`);
      console.log(`   user_account_id: ${profileByCode.user_account_id}`);
      console.log(`   email: ${profileByCode.email}`);
    } else {
      console.log('❌ 프로필 없음 (user_code 검색)');
      if (codeError) console.log(`   에러: ${codeError.message}`);
    }
    console.log();

    // 5. 로그인 시뮬레이션 (authOptions.ts의 로직과 동일)
    console.log('🔐 로그인 시뮬레이션 (authOptions.ts 로직):');
    const { data: users, error: queryError } = await supabase
      .from('admin_users_userprofiles')
      .select(`
        email, user_name, status, is_active, auth_user_id,
        position, department, avatar_url, profile_image_url,
        role_id,
        admin_users_rules!inner(id, role_name)
      `)
      .or(`user_code.eq.system,user_account_id.eq.system`)
      .limit(1);

    console.log(`   쿼리 결과: ${users?.length || 0}개`);
    if (queryError) {
      console.log(`   ❌ 쿼리 에러: ${queryError.message}`);
    }
    if (users && users.length > 0) {
      const user = users[0];
      console.log('   ✅ 사용자 발견');
      console.log(`   Email: ${user.email}`);
      console.log(`   Status: ${user.status}`);
      console.log(`   Is Active: ${user.is_active}`);
      console.log(`   Auth User ID: ${user.auth_user_id}`);
      console.log(`   Role ID: ${user.role_id}`);
      console.log(`   Role: ${user.admin_users_rules?.role_name || 'N/A'}`);

      // 비밀번호 테스트
      console.log();
      console.log('   🔐 비밀번호 테스트 중...');
      const supabaseClient = createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
      );

      const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
        email: user.email,
        password: 'System@2025!'
      });

      if (authError) {
        console.log(`   ❌ 로그인 실패: ${authError.message}`);
      } else {
        console.log('   ✅ 로그인 성공!');
      }
    }
    console.log();

  } catch (error) {
    console.error('❌ 에러 발생:', error.message);
    process.exit(1);
  }
}

checkSystemUser();
