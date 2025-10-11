const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://exxumujwufzqnovhzvif.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eHVtdWp3dWZ6cW5vdmh6dmlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTc2NTYwMDksImV4cCI6MjA3MzIzMjAwOX0.zTU0q24c72ewx8DKHqD5lUB1VuuuwBY0jLzWel9DIME';

async function testLogin() {
  console.log('🔐 Supabase Auth 로그인 테스트\n');

  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  const email = 'jaesikan@nexplus.co.kr';
  const passwords = ['123456', '1234', 'password', 'Password123!'];

  for (const password of passwords) {
    console.log(`시도 중: ${email} / ${password}`);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password
    });

    if (error) {
      console.log(`❌ 실패: ${error.message}\n`);
    } else {
      console.log(`✅ 성공!`);
      console.log(`   User ID: ${data.user.id}`);
      console.log(`   Email: ${data.user.email}`);
      console.log(`   Last Sign In: ${data.user.last_sign_in_at}\n`);
      console.log(`🎉 올바른 비밀번호: ${password}\n`);

      // 로그아웃
      await supabase.auth.signOut();
      return;
    }
  }

  console.log('❌ 모든 비밀번호 시도 실패\n');
  console.log('💡 비밀번호를 다시 초기화해야 합니다.');
}

testLogin();
