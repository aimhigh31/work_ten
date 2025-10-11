const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres'
});

async function checkJaesikanLogin() {
  try {
    console.log('🔍 jaesikan 사용자 정보 확인 중...\n');

    // 1. admin_users_userprofiles 테이블에서 jaesikan 정보 조회
    const profileQuery = `
      SELECT
        id,
        user_code,
        user_account_id,
        user_name,
        email,
        status,
        is_active,
        auth_user_id
      FROM admin_users_userprofiles
      WHERE user_code = 'USER-25-009' OR user_account_id = 'jsan'
    `;

    const profileResult = await pool.query(profileQuery);

    if (profileResult.rows.length === 0) {
      console.log('❌ jaesikan 사용자를 찾을 수 없습니다.');
      return;
    }

    const profile = profileResult.rows[0];
    console.log('✅ Profile 정보:');
    console.log('   - user_code:', profile.user_code);
    console.log('   - user_account_id:', profile.user_account_id);
    console.log('   - user_name:', profile.user_name);
    console.log('   - email:', profile.email);
    console.log('   - status:', profile.status);
    console.log('   - is_active:', profile.is_active);
    console.log('   - auth_user_id:', profile.auth_user_id);
    console.log('');

    // 2. auth.users 테이블에서 인증 정보 조회
    if (profile.auth_user_id) {
      const authQuery = `
        SELECT
          id,
          email,
          last_sign_in_at,
          created_at
        FROM auth.users
        WHERE id = $1
      `;

      const authResult = await pool.query(authQuery, [profile.auth_user_id]);

      if (authResult.rows.length > 0) {
        const authUser = authResult.rows[0];
        console.log('✅ Auth 정보:');
        console.log('   - id:', authUser.id);
        console.log('   - email:', authUser.email);
        console.log('   - last_sign_in_at:', authUser.last_sign_in_at);
        console.log('   - created_at:', authUser.created_at);
        console.log('');
      } else {
        console.log('❌ auth.users에서 해당 사용자를 찾을 수 없습니다.');
        console.log('');
      }
    } else {
      console.log('⚠️  auth_user_id가 설정되지 않았습니다.');
      console.log('');
    }

    // 3. 로그인 가능 여부 체크
    console.log('📋 로그인 가능 여부 체크:');
    const checks = [
      { name: 'is_active', value: profile.is_active, expected: true },
      { name: 'status', value: profile.status, expected: 'active' },
      { name: 'auth_user_id 존재', value: !!profile.auth_user_id, expected: true },
      { name: 'email 존재', value: !!profile.email, expected: true }
    ];

    let allPassed = true;
    checks.forEach(check => {
      const passed = check.value === check.expected;
      const icon = passed ? '✅' : '❌';
      console.log(`   ${icon} ${check.name}: ${check.value} (기대값: ${check.expected})`);
      if (!passed) allPassed = false;
    });

    console.log('');
    if (allPassed) {
      console.log('✅ 모든 체크 통과! 로그인이 가능해야 합니다.');
      console.log('');
      console.log('로그인 정보:');
      console.log('   - Account ID: jaesikan 또는 jsan');
      console.log('   - Password: 123456');
      console.log('   - Email (실제 인증용):', profile.email);
    } else {
      console.log('❌ 일부 체크 실패! 로그인에 문제가 있을 수 있습니다.');
    }

  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await pool.end();
  }
}

checkJaesikanLogin();
