const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://exxumujwufzqnovhzvif.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eHVtdWp3dWZ6cW5vdmh6dmlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjAwOSwiZXhwIjoyMDczMjMyMDA5fQ.VcS_o4yWlpj074ht78r1w-Ho8Ze6uFySLj7YWb32DgE';

async function testOptimized() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  console.log('⚡ 최적화된 쿼리 성능 테스트\n');

  // 테스트 1: 필요한 필드만 선택, count 없음
  console.log('📊 최적화된 쿼리 실행 중...');
  const start = Date.now();

  const { data, error } = await supabase
    .from('common_log_data')
    .select('id, page, record_id, action_type, description, before_value, after_value, changed_field, user_name, team, user_department, created_at')
    .eq('page', 'security_education')
    .order('created_at', { ascending: false })
    .limit(100);

  const end = Date.now();
  const duration = end - start;

  if (error) {
    console.error('❌ 에러:', error);
  } else {
    console.log(`✅ 성공: ${data.length}개 조회`);
    console.log(`⏱️ 소요 시간: ${duration}ms`);

    if (duration < 500) {
      console.log('🎉 목표 달성! (500ms 이내)');
    } else if (duration < 1000) {
      console.log('✅ 성능 양호 (1초 이내)');
    } else if (duration < 2000) {
      console.log('⚠️ 성능 개선 필요 (2초 이내)');
    } else {
      console.log('❌ 성능 심각 (2초 이상)');
    }

    // 첫 번째 데이터 샘플 출력
    if (data.length > 0) {
      console.log('\n📄 첫 번째 데이터 샘플:');
      console.log(JSON.stringify(data[0], null, 2));
    }
  }
}

testOptimized();
