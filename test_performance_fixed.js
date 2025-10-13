const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://exxumujwufzqnovhzvif.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eHVtdWp3dWZ6cW5vdmh6dmlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjAwOSwiZXhwIjoyMDczMjMyMDA5fQ.VcS_o4yWlpj074ht78r1w-Ho8Ze6uFySLj7YWb32DgE';

async function testPerformance() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  console.log('⚡ 성능 테스트 시작...\n');

  // 테스트 1: count 없이 (최적화 후)
  console.log('📊 테스트 1: count 없이 (최적화 후)');
  const start1 = Date.now();
  const { data: data1, error: error1 } = await supabase
    .from('common_log_data')
    .select('*')
    .eq('page', 'security_education')
    .order('created_at', { ascending: false })
    .limit(100);
  const end1 = Date.now();

  if (error1) {
    console.error('❌ 에러:', error1);
  } else {
    console.log(`✅ 성공: ${data1.length}개 조회`);
    console.log(`⏱️ 소요 시간: ${end1 - start1}ms`);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // 테스트 2: count: 'exact' 포함 (최적화 전)
  console.log('📊 테스트 2: count: exact 포함 (최적화 전)');
  const start2 = Date.now();
  const { data: data2, error: error2, count } = await supabase
    .from('common_log_data')
    .select('*', { count: 'exact' })
    .eq('page', 'security_education')
    .order('created_at', { ascending: false })
    .limit(100);
  const end2 = Date.now();

  if (error2) {
    console.error('❌ 에러:', error2);
  } else {
    console.log(`✅ 성공: ${data2.length}개 조회, 전체: ${count}개`);
    console.log(`⏱️ 소요 시간: ${end2 - start2}ms`);
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // 성능 비교
  const improvement = ((end2 - start2) / (end1 - start1)).toFixed(2);
  const saved = end2 - start2 - (end1 - start1);

  console.log('🎯 성능 비교 결과:');
  console.log(`  최적화 전: ${end2 - start2}ms`);
  console.log(`  최적화 후: ${end1 - start1}ms`);
  console.log(`  개선 배수: ${improvement}x 빠름`);
  console.log(`  절약 시간: ${saved}ms`);

  if (end1 - start1 < 500) {
    console.log('\n✅ 목표 달성! (500ms 이내)');
  } else if (end1 - start1 < 1000) {
    console.log('\n✅ 성능 양호 (1초 이내)');
  } else {
    console.log('\n⚠️ 추가 최적화 필요');
  }
}

testPerformance();
