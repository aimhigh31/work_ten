const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://exxumujwufzqnovhzvif.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eHVtdWp3dWZ6cW5vdmh6dmlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjAwOSwiZXhwIjoyMDczMjMyMDA5fQ.VcS_o4yWlpj074ht78r1w-Ho8Ze6uFySLj7YWb32DgE';

async function checkTable() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    console.log('🔗 Supabase 연결 중...');

    // 테이블 구조 확인
    const { data, error } = await supabase
      .from('common_log_data')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ 테이블 조회 실패:', error);
      return;
    }

    console.log('✅ 테이블 조회 성공');
    console.log('📊 테이블 컬럼:', data && data.length > 0 ? Object.keys(data[0]) : '데이터 없음');

    // 전체 데이터 개수
    const { count, error: countError } = await supabase
      .from('common_log_data')
      .select('*', { count: 'exact', head: true });

    if (!countError) {
      console.log('📈 전체 데이터 개수:', count);
    }

    // security_education 데이터 개수
    const { count: secCount, error: secError } = await supabase
      .from('common_log_data')
      .select('*', { count: 'exact', head: true })
      .eq('page', 'security_education');

    if (!secError) {
      console.log('🔐 security_education 데이터 개수:', secCount);
    }

  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

checkTable();
