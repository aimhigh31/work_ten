require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function assignRole() {
  try {
    const { data, error } = await supabase
      .from('admin_users_userprofiles')
      .update({ role_id: 11 })
      .eq('email', 'jaesikan@nexplus.co.kr')
      .select('email, role_id');

    if (error) {
      console.error('실패:', error);
      return;
    }

    console.log('jaesikan 계정에 role_id 11 (일반조회) 부여 완료!');
    console.log(data);
    console.log('\n로그아웃 후 다시 로그인하세요.');
  } catch (error) {
    console.error('오류:', error);
  }
}

assignRole();
