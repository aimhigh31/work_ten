const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkUserStatus() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  console.log('========================================');
  console.log('사용자 상태 값 확인');
  console.log('========================================\n');

  const { data: users, error } = await supabase
    .from('admin_user_data')
    .select('status')
    .order('id', { ascending: true });

  if (error) {
    console.error('❌ 조회 오류:', error);
    return;
  }

  if (users) {
    const uniqueStatuses = [...new Set(users.map(u => u.status))];
    console.log('고유한 status 값 목록:');
    uniqueStatuses.forEach(status => {
      const count = users.filter(u => u.status === status).length;
      console.log(`  - "${status}" (${count}명)`);
    });
    console.log(`\n전체 사용자 수: ${users.length}명`);
  }

  console.log('\n========================================');
}

checkUserStatus();
