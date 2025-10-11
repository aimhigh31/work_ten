const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('ERROR: 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

async function resetPassword() {
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    console.log('jaesikan 사용자의 비밀번호를 123456으로 재설정합니다...\n');

    // jaesikan 사용자의 auth_user_id 조회
    const { data: users, error: queryError } = await supabaseAdmin
      .from('admin_users_userprofiles')
      .select('auth_user_id, user_account_id, email, user_name')
      .eq('user_account_id', 'jaesikan')
      .limit(1);

    if (queryError) {
      console.error('❌ 사용자 조회 오류:', queryError);
      return;
    }

    if (!users || users.length === 0) {
      console.log('❌ jaesikan 사용자를 찾을 수 없습니다.');
      return;
    }

    const user = users[0];

    if (!user.auth_user_id) {
      console.log('❌ auth_user_id가 없습니다. Auth 사용자가 생성되지 않았습니다.');
      return;
    }

    console.log('사용자 정보:');
    console.log(`  auth_user_id: ${user.auth_user_id}`);
    console.log(`  user_account_id: ${user.user_account_id}`);
    console.log(`  email: ${user.email}`);
    console.log(`  user_name: ${user.user_name}\n`);

    // 비밀번호 재설정
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      user.auth_user_id,
      {
        password: '123456'
      }
    );

    if (updateError) {
      console.error('❌ 비밀번호 재설정 오류:', updateError);
      return;
    }

    console.log('✅ 비밀번호가 "123456"으로 재설정되었습니다.');
    console.log('\n이제 다음 정보로 로그인할 수 있습니다:');
    console.log(`  Account ID: ${user.user_account_id}`);
    console.log(`  Password: 123456`);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

resetPassword();
