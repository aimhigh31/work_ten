const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugUsersCount() {
  console.log('\n🔍 사용자 수 디버깅 시작...\n');

  try {
    // 1. 전체 사용자 수 확인
    const { data: allUsers, error } = await supabase
      .from('admin_users_userprofiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('❌ 조회 실패:', error);
      return;
    }

    console.log(`📊 DB에 저장된 전체 사용자 수: ${allUsers.length}명\n`);

    // 2. 각 사용자 정보 출력
    allUsers.forEach((user, index) => {
      console.log(`${index + 1}. ${user.user_code} - ${user.user_name}`);
      console.log(`   부서: ${user.department || '없음'}`);
      console.log(`   이메일: ${user.email}`);
      console.log(`   상태: ${user.status}`);
      console.log(`   생성일: ${user.created_at}`);
      console.log(`   assignedRole: ${user.assigned_roles ? JSON.stringify(user.assigned_roles) : '없음'}`);
      console.log('');
    });

    // 3. 상태별 개수
    const activeCount = allUsers.filter(u => u.status === 'active').length;
    const inactiveCount = allUsers.filter(u => u.status === 'inactive').length;
    const pendingCount = allUsers.filter(u => u.status === 'pending').length;

    console.log('📈 상태별 사용자 수:');
    console.log(`   active: ${activeCount}명`);
    console.log(`   inactive: ${inactiveCount}명`);
    console.log(`   pending: ${pendingCount}명`);

    console.log('\n✅ 디버깅 완료\n');
  } catch (err) {
    console.error('❌ 오류 발생:', err);
  }
}

debugUsersCount();
