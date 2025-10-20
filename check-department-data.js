const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkDepartmentData() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('📡 Supabase 연결 중...\n');

    // 부서 데이터 조회
    console.log('🔍 부서 데이터 조회:');
    const { data: departments, error } = await supabase
      .from('admin_users_department')
      .select('*')
      .order('created_at', { ascending: false })
      .order('id', { ascending: false });

    if (error) {
      console.error('❌ 조회 실패:', error.message);
      throw error;
    }

    console.log(`✅ 조회 성공: ${departments?.length || 0}개 부서\n`);

    if (!departments || departments.length === 0) {
      console.log('⚠️  부서 데이터가 없습니다!');
      console.log('   샘플 부서 데이터를 생성하시겠습니까?\n');
    } else {
      console.log('📋 부서 목록:');
      departments.forEach((dept, index) => {
        console.log(`\n${index + 1}. ${dept.department_name}`);
        console.log(`   ID: ${dept.id}`);
        console.log(`   코드: ${dept.department_code}`);
        console.log(`   레벨: ${dept.department_level}`);
        console.log(`   활성화: ${dept.is_active}`);
        console.log(`   생성일: ${dept.created_at}`);
      });
    }

  } catch (error) {
    console.error('❌ 에러 발생:', error.message);
    process.exit(1);
  }
}

checkDepartmentData();
