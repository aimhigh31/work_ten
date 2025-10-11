const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

async function testLoginFlow() {
  console.log('=== 로그인 플로우 테스트 ===\n');

  const userId = 'jaesikan';
  const password = '123456';

  console.log(`Account ID: ${userId}`);
  console.log(`Password: ${password}\n`);

  try {
    // 1단계: Account ID로 사용자 조회
    console.log('1단계: Account ID로 사용자 조회...');
    const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: users, error: queryError } = await supabaseAdmin
      .from('admin_users_userprofiles')
      .select('email, user_name, status, is_active, auth_user_id')
      .or(`user_code.eq.${userId},user_account_id.eq.${userId}`)
      .limit(1);

    if (queryError) {
      console.error('❌ 쿼리 오류:', queryError);
      return;
    }

    if (!users || users.length === 0) {
      console.log('❌ 사용자를 찾을 수 없습니다.');
      return;
    }

    const userProfile = users[0];
    console.log('✅ 사용자 찾음:');
    console.log(`   email: ${userProfile.email}`);
    console.log(`   user_name: ${userProfile.user_name}`);
    console.log(`   status: ${userProfile.status}`);
    console.log(`   is_active: ${userProfile.is_active}`);
    console.log(`   auth_user_id: ${userProfile.auth_user_id}\n`);

    // 사용자 상태 확인
    if (!userProfile.is_active || userProfile.status !== 'active') {
      console.log('❌ 사용자가 비활성화 상태입니다.');
      return;
    }

    // 2단계: Supabase Auth로 로그인
    console.log('2단계: Supabase Auth 로그인 시도...');
    console.log(`   이메일: ${userProfile.email}`);
    console.log(`   비밀번호: ${password}\n`);

    const supabaseClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email: userProfile.email,
      password: password
    });

    if (authError) {
      console.error('❌ Supabase Auth 로그인 실패:');
      console.error('   오류 메시지:', authError.message);
      console.error('   오류 코드:', authError.status);
      console.error('   전체 오류:', JSON.stringify(authError, null, 2));
      return;
    }

    if (!authData.user) {
      console.log('❌ 로그인 실패: 사용자 데이터가 없습니다.');
      return;
    }

    console.log('✅ 로그인 성공!');
    console.log(`   User ID: ${authData.user.id}`);
    console.log(`   Email: ${authData.user.email}`);
    console.log(`   Access Token: ${authData.session?.access_token?.substring(0, 20)}...`);

  } catch (error) {
    console.error('❌ 예외 발생:', error);
  }
}

testLoginFlow();
