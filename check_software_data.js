require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSoftwareData() {
  console.log('🔍 it_software_data 테이블 데이터 확인 중...');

  const { data, error } = await supabase
    .from('it_software_data')
    .select('id, status, assignee, current_users, work_content')
    .eq('is_active', true)
    .limit(5);

  if (error) {
    console.error('❌ 데이터 조회 실패:', error);
    return;
  }

  console.log('✅ 조회 성공:', data.length + '개 데이터\n');

  // 각 데이터 출력
  data.forEach((item, index) => {
    console.log(`📋 데이터 ${index + 1}:`);
    console.log(`  - ID: ${item.id}`);
    console.log(`  - work_content: ${item.work_content}`);
    console.log(`  - status: '${item.status}'`);
    console.log(`  - assignee: '${item.assignee}'`);
    console.log(`  - current_users: '${item.current_users}'`);
    console.log('');
  });
}

checkSoftwareData().then(() => {
  console.log('✅ 완료');
}).catch((err) => {
  console.error('❌ 오류:', err);
});