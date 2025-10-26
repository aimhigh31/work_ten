require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  console.log('🔍 사용자 확인\n');

  const { data: users, error } = await supabase
    .from('admin_user_management')
    .select('user_id, user_name, email, role_id, role_name')
    .order('user_id')
    .limit(10);

  if (users) {
    console.log(`총 ${users.length}명의 사용자 발견:\n`);
    users.forEach(user => {
      console.log(`user_id: "${user.user_id}", 이름: ${user.user_name}, 역할: ${user.role_name} (role_id: ${user.role_id})`);
    });
  } else {
    console.log('사용자를 찾을 수 없습니다.');
  }

  console.log('\n\n🔍 슈퍼관리자 또는 관리자 역할 사용자:\n');
  const { data: admins } = await supabase
    .from('admin_user_management')
    .select('user_id, user_name, email, role_id, role_name')
    .or('role_name.ilike.%관리자%,role_name.ilike.%admin%');

  if (admins && admins.length > 0) {
    admins.forEach(user => {
      console.log(`user_id: "${user.user_id}", 이름: ${user.user_name}, 역할: ${user.role_name}`);
    });
  }
})();
