// main_task_management 테이블 테스트
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testTable() {
  console.log('\n🔍 main_task_management 테이블 테스트\n');

  // 1. 전체 데이터 개수 확인
  const { data: countData, error: countError, count } = await supabase
    .from('main_task_management')
    .select('*', { count: 'exact', head: true });

  if (countError) {
    console.error('❌ 개수 조회 실패:', countError);
    return;
  }

  console.log(`📊 전체 데이터: ${count}개`);

  // 2. 샘플 데이터 조회 (최대 5개)
  const { data, error } = await supabase
    .from('main_task_management')
    .select('*')
    .limit(5);

  if (error) {
    console.error('❌ 데이터 조회 실패:', error);
    return;
  }

  console.log(`\n📋 샘플 데이터 (최대 5개):\n`);
  if (data && data.length > 0) {
    data.forEach((item, idx) => {
      console.log(`${idx + 1}. task_id: ${item.task_id}, item_id: ${item.item_id}`);
      console.log(`   text: "${item.text}"`);
      console.log(`   level: ${item.level}, status: ${item.status}`);
      console.log('');
    });
  } else {
    console.log('   (데이터 없음)');
  }

  // 3. 컬럼 구조 확인
  if (data && data.length > 0) {
    console.log('\n📋 테이블 컬럼:\n');
    const columns = Object.keys(data[0]);
    columns.forEach((col, idx) => {
      console.log(`   ${idx + 1}. ${col}`);
    });
  }

  console.log('\n✅ 테이블 테스트 완료\n');
}

testTable().catch(error => {
  console.error('❌ 스크립트 실행 오류:', error);
  process.exit(1);
});
