require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkStatusValues() {
  console.log('🔍 it_software_data 테이블의 status 값 조회 중...');

  const { data, error } = await supabase
    .from('it_software_data')
    .select('id, status, work_content')
    .eq('is_active', true)
    .limit(20);

  if (error) {
    console.error('❌ 데이터 조회 실패:', error);
    return;
  }

  console.log('✅ 조회 성공:', data.length + '개 데이터');

  // 고유한 status 값들 추출
  const uniqueStatuses = [...new Set(data.map(item => item.status))];
  console.log('📊 고유한 status 값들:', uniqueStatuses);

  // 각 데이터 샘플 출력
  data.forEach((item, index) => {
    console.log(`데이터 ${index + 1}: ID=${item.id}, status='${item.status}', work_content='${item.work_content}'`);
  });
}

checkStatusValues().then(() => {
  console.log('✅ 완료');
}).catch((err) => {
  console.error('❌ 오류:', err);
});