const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://exxumujwufzqnovhzvif.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eHVtdWp3dWZ6cW5vdmh6dmlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjAwOSwiZXhwIjoyMDczMjMyMDA5fQ.VcS_o4yWlpj074ht78r1w-Ho8Ze6uFySLj7YWb32DgE';

async function checkHealth() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    console.log('🔍 테이블 상태 분석 중...\n');

    // 1. 전체 레코드 수
    console.log('📊 1. 전체 레코드 수 확인...');
    const { count: totalCount } = await supabase
      .from('common_log_data')
      .select('*', { count: 'exact', head: true });
    console.log(`   전체: ${totalCount}개\n`);

    // 2. page별 레코드 수 (직접 조회)
    console.log('📊 2. page별 레코드 수 확인...');
    const { data: allData } = await supabase
      .from('common_log_data')
      .select('page');

    if (allData) {
      const pageGroups = allData.reduce((acc, item) => {
        acc[item.page] = (acc[item.page] || 0) + 1;
        return acc;
      }, {});
      console.log('   page별 분포:', pageGroups);
      console.log(`   총 ${Object.keys(pageGroups).length}개 페이지\n`);
    }

    // 3. 최근 10개 데이터만 조회 테스트
    console.log('📊 3. 최근 10개 데이터만 조회 테스트...');
    const start = Date.now();
    const { data: recentData, error } = await supabase
      .from('common_log_data')
      .select('id, page, record_id, created_at')
      .eq('page', 'security_education')
      .order('created_at', { ascending: false })
      .limit(10);
    const end = Date.now();

    if (error) {
      console.error('   ❌ 에러:', error);
    } else {
      console.log(`   ✅ ${recentData.length}개 조회 성공`);
      console.log(`   ⏱️ 소요 시간: ${end - start}ms\n`);
    }

    // 4. security_education만 카운트
    console.log('📊 4. security_education 레코드 수...');
    const { count: secCount } = await supabase
      .from('common_log_data')
      .select('*', { count: 'exact', head: true })
      .eq('page', 'security_education');
    console.log(`   security_education: ${secCount}개\n`);

    console.log('✅ 진단 완료!');

  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

checkHealth();
