const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkUserFields() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('📡 Supabase 연결 중...\n');

    // 모든 사용자 조회
    const { data: users, error } = await supabase
      .from('admin_users_userprofiles')
      .select('id, user_name, user_account_id, department, position, role, email, phone, country, address')
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    console.log(`✅ 조회된 사용자 수: ${users?.length || 0}개\n`);

    if (users && users.length > 0) {
      console.log('📋 모든 사용자의 부서/직급/직책 정보:\n');

      users.forEach((user, index) => {
        console.log(`${index + 1}. ${user.user_name} (${user.user_account_id || user.email})`);
        console.log(`   부서(department): "${user.department || '없음'}"`);
        console.log(`   직급(position): "${user.position || '없음'}"`);
        console.log(`   직책(role): "${user.role || '없음'}"`);
        console.log(`   전화번호(phone): "${user.phone || '없음'}"`);
        console.log(`   국가(country): "${user.country || '없음'}"`);
        console.log(`   주소(address): "${user.address || '없음'}"`);
        console.log('');
      });

      // 통계
      const withDepartment = users.filter(u => u.department && u.department.trim() !== '').length;
      const withPosition = users.filter(u => u.position && u.position.trim() !== '').length;
      const withRole = users.filter(u => u.role && u.role.trim() !== '').length;

      console.log('📊 통계:');
      console.log(`   부서 있음: ${withDepartment}/${users.length}`);
      console.log(`   직급 있음: ${withPosition}/${users.length}`);
      console.log(`   직책 있음: ${withRole}/${users.length}`);
    }

  } catch (error) {
    console.error('❌ 에러 발생:', error.message);
    process.exit(1);
  }
}

checkUserFields();
