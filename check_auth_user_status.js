const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function checkAuthUser() {
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    console.log('=== Supabase Auth 사용자 상태 확인 ===\n');

    const authUserId = '70d85c3f-b99a-44b4-92de-eb01da24e6c2';

    // Auth 사용자 정보 조회
    const { data: userData, error: userError } = await supabaseAdmin.auth.admin.getUserById(authUserId);

    if (userError) {
      console.error('❌ 사용자 조회 오류:', userError);
      return;
    }

    console.log('Auth 사용자 정보:');
    console.log(`  ID: ${userData.user.id}`);
    console.log(`  Email: ${userData.user.email}`);
    console.log(`  Email Confirmed: ${userData.user.email_confirmed_at ? '✅' : '❌'}`);
    console.log(`  Phone Confirmed: ${userData.user.phone_confirmed_at ? '✅' : '❌'}`);
    console.log(`  Created At: ${userData.user.created_at}`);
    console.log(`  Updated At: ${userData.user.updated_at}`);
    console.log(`  Last Sign In: ${userData.user.last_sign_in_at || 'Never'}`);
    console.log(`  App Metadata:`, JSON.stringify(userData.user.app_metadata, null, 2));
    console.log(`  User Metadata:`, JSON.stringify(userData.user.user_metadata, null, 2));
    console.log(`  Banned: ${userData.user.banned_until ? '❌ YES' : '✅ NO'}`);
    console.log(`  Role: ${userData.user.role}`);

    // 비밀번호 재설정 시도
    console.log('\n비밀번호를 "123456"으로 강제 재설정합니다...');
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      authUserId,
      {
        password: '123456',
        email_confirm: true // 이메일 확인도 자동으로 설정
      }
    );

    if (updateError) {
      console.error('❌ 비밀번호 재설정 오류:', updateError);
      return;
    }

    console.log('✅ 비밀번호 재설정 성공');
    console.log('   Updated At:', updateData.user.updated_at);

    // 재설정 후 다시 조회
    const { data: updatedUserData } = await supabaseAdmin.auth.admin.getUserById(authUserId);
    console.log('\n업데이트 후 상태:');
    console.log(`  Email Confirmed: ${updatedUserData.user.email_confirmed_at ? '✅' : '❌'}`);
    console.log(`  Updated At: ${updatedUserData.user.updated_at}`);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

checkAuthUser();
