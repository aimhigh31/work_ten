const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function updatePassword() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('📡 Supabase 연결 중...');

    // system@nexplus.co.kr 사용자 조회
    const { data: users } = await supabase
      .from('admin_users_userprofiles')
      .select('auth_user_id')
      .eq('email', 'system@nexplus.co.kr')
      .single();

    if (!users || !users.auth_user_id) {
      throw new Error('system 사용자를 찾을 수 없습니다.');
    }

    console.log('✅ system 사용자 발견');
    console.log('🔐 비밀번호 변경 중...\n');

    // Supabase Auth 비밀번호 변경
    const newPassword = 'System@2025!';
    const { error } = await supabase.auth.admin.updateUserById(
      users.auth_user_id,
      { password: newPassword }
    );

    if (error) {
      throw error;
    }

    console.log('========================================');
    console.log('✅ 비밀번호 변경 완료!');
    console.log('========================================');
    console.log('📧 이메일: system@nexplus.co.kr');
    console.log('👤 사용자 ID: system');
    console.log(`🔑 새 비밀번호: ${newPassword}`);
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ 에러 발생:', error.message);
    process.exit(1);
  }
}

updatePassword();
