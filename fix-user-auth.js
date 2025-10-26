const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function fixUserAuth() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('🔍 auth_user_id가 없는 사용자 찾기...\n');

    // auth_user_id가 NULL인 사용자들 조회
    const { data: usersWithoutAuth, error: queryError } = await supabase
      .from('admin_users_userprofiles')
      .select('id, user_code, user_name, email, user_account_id, auth_user_id')
      .is('auth_user_id', null);

    if (queryError) {
      throw queryError;
    }

    if (!usersWithoutAuth || usersWithoutAuth.length === 0) {
      console.log('✅ 모든 사용자가 Auth와 연결되어 있습니다.');
      return;
    }

    console.log(`⚠️ Auth와 연결되지 않은 사용자 ${usersWithoutAuth.length}명 발견:\n`);

    usersWithoutAuth.forEach((user, index) => {
      console.log(`${index + 1}. ${user.user_name} (${user.user_code})`);
      console.log(`   Email: ${user.email}`);
      console.log(`   User Account ID: ${user.user_account_id || '없음'}`);
      console.log(`   Auth User ID: ${user.auth_user_id || 'NULL ❌'}`);
      console.log('');
    });

    console.log('\n🔧 해결 방법:\n');
    console.log('각 사용자에 대해 다음 중 하나를 선택하세요:');
    console.log('1. Supabase Auth에 새 계정 생성 (이메일 + 비밀번호)');
    console.log('2. 기존 Auth 계정과 연결 (이미 Auth에 있다면)');
    console.log('3. 사용자 삭제 (더 이상 필요 없다면)\n');

    console.log('💡 자동으로 모든 사용자에게 Auth 계정을 생성하시겠습니까?');
    console.log('   각 사용자의 기본 비밀번호는 "changeMe123!"로 설정됩니다.\n');

    // 사용자 입력 대기하지 않고 수동 실행 안내만 제공
    console.log('⚠️ 자동 실행을 원하시면 이 스크립트를 수정하여 실행하세요.');

  } catch (error) {
    console.error('❌ 에러 발생:', error.message);
    console.error(error);
    process.exit(1);
  }
}

fixUserAuth();
