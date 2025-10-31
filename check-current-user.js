const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkCurrentUser() {
  console.log('🔍 kim2@company.com 사용자 정보 확인 중...\n');

  const { data, error } = await supabase
    .from('admin_users_userprofiles')
    .select('id, email, user_name, user_code, role_id')
    .eq('email', 'kim2@company.com')
    .single();

  if (error) {
    console.error('❌ 오류:', error);
    return;
  }

  console.log('✅ 사용자 정보:');
  console.log(JSON.stringify(data, null, 2));
  console.log('\n중요: user_name = "' + data.user_name + '"');
}

checkCurrentUser();
