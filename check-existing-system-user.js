const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkUser() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // system@nexplus.co.kr 이메일로 사용자 조회
  const { data, error } = await supabase
    .from('admin_users_userprofiles')
    .select('*')
    .eq('email', 'system@nexplus.co.kr');

  console.log('조회 결과:', data);
  console.log('에러:', error);
}

checkUser();
