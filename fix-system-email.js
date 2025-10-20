const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function fixSystemEmail() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('📡 Supabase 연결 중...\n');

    // 잘못된 이메일로 저장된 프로필 찾기
    const { data: wrongProfile, error: findError } = await supabase
      .from('admin_users_userprofiles')
      .select('*')
      .eq('user_account_id', 'system')
      .single();

    if (findError || !wrongProfile) {
      throw new Error('system 사용자를 찾을 수 없습니다.');
    }

    console.log('🔍 현재 프로필 정보:');
    console.log(`   ID: ${wrongProfile.id}`);
    console.log(`   Email (잘못됨): ${wrongProfile.email}`);
    console.log(`   user_account_id: ${wrongProfile.user_account_id}`);
    console.log(`   auth_user_id: ${wrongProfile.auth_user_id}`);
    console.log();

    // 이메일 수정
    console.log('🔧 이메일 수정 중...');
    const { data: updatedProfile, error: updateError } = await supabase
      .from('admin_users_userprofiles')
      .update({
        email: 'system@nexplus.co.kr',
        updated_at: new Date().toISOString()
      })
      .eq('id', wrongProfile.id)
      .select()
      .single();

    if (updateError) {
      throw new Error(`이메일 수정 실패: ${updateError.message}`);
    }

    console.log('✅ 이메일 수정 완료!');
    console.log(`   새 Email: ${updatedProfile.email}`);
    console.log();

    // 로그인 테스트
    console.log('🔐 로그인 테스트 중...');
    const supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    );

    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email: 'system@nexplus.co.kr',
      password: 'System@2025!'
    });

    if (authError) {
      console.log(`❌ 로그인 실패: ${authError.message}`);
    } else {
      console.log('✅ 로그인 성공!');
      console.log(`   User ID: ${authData.user.id}`);
      console.log(`   Email: ${authData.user.email}`);
    }
    console.log();

    console.log('========================================');
    console.log('✅ System 계정 수정 완료!');
    console.log('========================================');
    console.log('👤 사용자 ID: system');
    console.log('🔑 비밀번호: System@2025!');
    console.log('📧 이메일: system@nexplus.co.kr (수정됨)');
    console.log('========================================\n');

  } catch (error) {
    console.error('❌ 에러 발생:', error.message);
    process.exit(1);
  }
}

fixSystemEmail();
