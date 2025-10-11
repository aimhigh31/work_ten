const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://exxumujwufzqnovhzvif.supabase.co';
const serviceRoleKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eHVtdWp3dWZ6cW5vdmh6dmlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjAwOSwiZXhwIjoyMDczMjMyMDA5fQ.VcS_o4yWlpj074ht78r1w-Ho8Ze6uFySLj7YWb32DgE';

async function resetPassword() {
  console.log('🔐 jsan 비밀번호 초기화 시작...\n');

  const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  });

  try {
    // 1. auth_user_id 조회
    const { Pool } = require('pg');
    const pool = new Pool({
      connectionString: 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres'
    });

    const result = await pool.query(
      `SELECT auth_user_id, email FROM admin_users_userprofiles WHERE user_account_id = 'jsan'`
    );

    if (result.rows.length === 0) {
      console.log('❌ jsan 사용자를 찾을 수 없습니다.');
      await pool.end();
      return;
    }

    const { auth_user_id, email } = result.rows[0];
    console.log(`✅ 사용자 정보:`);
    console.log(`   - Email: ${email}`);
    console.log(`   - Auth User ID: ${auth_user_id}\n`);

    await pool.end();

    // 2. 비밀번호 초기화
    console.log('🔄 비밀번호를 "123456"으로 초기화 중...');

    const { data, error } = await supabaseAdmin.auth.admin.updateUserById(
      auth_user_id,
      { password: '123456' }
    );

    if (error) {
      console.error('❌ 비밀번호 초기화 실패:', error.message);
      return;
    }

    console.log('✅ 비밀번호 초기화 성공!\n');

    // 3. 로그인 테스트
    console.log('🔐 로그인 테스트 중...');

    const supabaseClient = createClient(
      supabaseUrl,
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eHVtdWp3dWZ6cW5vdmh6dmlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2NTYwMDksImV4cCI6MjA3MzIzMjAwOX0.zTU0q24c72ewx8DKHqD5lUB1VuuuwBY0jLzWel9DIME'
    );

    const { data: authData, error: authError } = await supabaseClient.auth.signInWithPassword({
      email: email,
      password: '123456'
    });

    if (authError) {
      console.error('❌ 로그인 테스트 실패:', authError.message);
      return;
    }

    console.log('✅ 로그인 테스트 성공!\n');
    console.log('═══════════════════════════════════════');
    console.log('🎉 비밀번호가 성공적으로 초기화되었습니다!');
    console.log('═══════════════════════════════════════');
    console.log('\n로그인 정보:');
    console.log('   Account ID: jsan');
    console.log('   Password: 123456');
    console.log('\n브라우저에서 다음을 실행하세요:');
    console.log('1. F12 → Application → Cookies → 모든 쿠키 삭제');
    console.log('2. Ctrl + Shift + R (하드 리프레시)');
    console.log('3. 위 정보로 로그인');

    await supabaseClient.auth.signOut();

  } catch (error) {
    console.error('❌ 오류:', error.message);
  }
}

resetPassword();
