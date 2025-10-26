const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

(async () => {
  const { data, error } = await supabase
    .from('admin_users_userprofiles')
    .select('id, user_code, user_name, phone, country, address')
    .order('created_at', { ascending: false })
    .limit(5);

  if (error) {
    console.error('조회 오류:', error);
    return;
  }

  console.log('\n📊 최근 5명 사용자 데이터:\n');
  data.forEach((user, idx) => {
    console.log(`${idx + 1}. ${user.user_code} - ${user.user_name}`);
    console.log(`   전화번호: ${user.phone || 'NULL'}`);
    console.log(`   국가: ${user.country || 'NULL'}`);
    console.log(`   주소: ${user.address || 'NULL'}`);
    console.log('');
  });
})();
