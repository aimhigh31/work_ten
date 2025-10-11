const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

async function fixAuthEmail() {
  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false }
  });

  try {
    console.log('=== Auth 이메일 동기화 ===\n');

    const authUserId = '70d85c3f-b99a-44b4-92de-eb01da24e6c2';
    const correctEmail = 'jaesikan@nexplus.co.kr';
    const newPassword = '123456';

    console.log(`Auth User ID: ${authUserId}`);
    console.log(`올바른 이메일: ${correctEmail}`);
    console.log(`비밀번호: ${newPassword}\n`);

    // Auth 사용자의 이메일과 비밀번호 업데이트
    console.log('Auth 사용자 이메일 및 비밀번호 업데이트 중...');
    const { data: updateData, error: updateError } = await supabaseAdmin.auth.admin.updateUserById(
      authUserId,
      {
        email: correctEmail,
        password: newPassword,
        email_confirm: true
      }
    );

    if (updateError) {
      console.error('❌ 업데이트 오류:', updateError);
      return;
    }

    console.log('✅ 업데이트 성공!');
    console.log(`  새 이메일: ${updateData.user.email}`);
    console.log(`  이메일 확인: ${updateData.user.email_confirmed_at ? '✅' : '❌'}`);
    console.log(`  Updated At: ${updateData.user.updated_at}\n`);

    // 로그인 테스트
    console.log('로그인 테스트 중...');
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    const supabaseClient = createClient(supabaseUrl, anonKey, {
      auth: { autoRefreshToken: false, persistSession: false }
    });

    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email: correctEmail,
      password: newPassword
    });

    if (authError) {
      console.error('❌ 로그인 실패:', authError.message);
      return;
    }

    console.log('✅ 로그인 성공!');
    console.log(`  User ID: ${authData.user.id}`);
    console.log(`  Email: ${authData.user.email}\n`);

    console.log('=== 로그인 정보 ===');
    console.log(`Account ID: jaesikan`);
    console.log(`Password: ${newPassword}`);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

fixAuthEmail();
