const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkDepartmentCodes() {
  console.log('\n=== 부서 테이블 코드 확인 ===');

  const { data, error } = await supabase
    .from('admin_users_department')
    .select('id, department_code, department_name, created_at')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('❌ admin_users_department 오류:', error);
  } else {
    console.log('✅ admin_users_department 데이터:');
    console.log(`총 ${data?.length || 0}개의 데이터\n`);

    if (data && data.length > 0) {
      console.log('코드 형식 예시:');
      data.forEach(d => console.log(`  ${d.department_code} - ${d.department_name}`));

      // 25년도 코드만 필터링
      const year25Codes = data.filter(d => d.department_code && d.department_code.startsWith('DEPT-25-'));
      console.log(`\n25년도 코드: ${year25Codes.length}개`);
      year25Codes.forEach(d => console.log(`  ${d.department_code}`));
    }
  }
}

checkDepartmentCodes();
