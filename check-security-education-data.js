const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSecurityEducationData() {
  console.log('🔍 보안교육 데이터 확인 중...\n');

  // NO 42번 데이터 확인
  const { data: education42, error: error42 } = await supabase
    .from('security_education_data')
    .select('*')
    .eq('no', 42)
    .single();

  if (error42) {
    console.error('❌ NO 42번 조회 실패:', error42);
  } else {
    console.log('✅ NO 42번 데이터:');
    console.log('  - id:', education42.id);
    console.log('  - no:', education42.no);
    console.log('  - code:', education42.code);
    console.log('  - education_name:', education42.education_name);
    console.log('  - assignee (담당자):', education42.assignee);
    console.log('  - created_by (생성자):', education42.created_by);
    console.log('  - team:', education42.team);
    console.log('\n전체 데이터:', JSON.stringify(education42, null, 2));
  }

  console.log('\n---\n');

  // 김선생 관련 사용자 정보 확인
  const { data: users, error: userError } = await supabase
    .from('admin_user_management')
    .select('*')
    .or('user_name.eq.김선생,email.eq.kim2@company.com');

  if (userError) {
    console.error('❌ 사용자 조회 실패:', userError);
  } else {
    console.log('✅ 김선생 사용자 정보:');
    users.forEach(user => {
      console.log('  - user_code:', user.user_code);
      console.log('  - user_name:', user.user_name);
      console.log('  - email:', user.email);
      console.log('  - 전체:', JSON.stringify(user, null, 2));
    });
  }
}

checkSecurityEducationData();
