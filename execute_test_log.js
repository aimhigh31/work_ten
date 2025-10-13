const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://exxumujwufzqnovhzvif.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eHVtdWp3dWZ6cW5vdmh6dmlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjAwOSwiZXhwIjoyMDczMjMyMDA5fQ.VcS_o4yWlpj074ht78r1w-Ho8Ze6uFySLj7YWb32DgE';

async function executeSqlFile() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    console.log('🔗 Supabase API 연결 중...');

    // SQL 파일 읽기
    const sqlFilePath = path.join(__dirname, 'add_test_log.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('📝 테스트 변경로그 추가 중...');

    // SQL을 개별 쿼리로 분리하여 실행
    const queries = sqlContent
      .split(';')
      .map(q => q.trim())
      .filter(q => q.length > 0 && !q.startsWith('--'));

    for (let i = 0; i < queries.length; i++) {
      const query = queries[i];
      if (query) {
        console.log(`실행 중 (${i + 1}/${queries.length})...`);
        const { error } = await supabase.rpc('exec', { sql: query });

        if (error) {
          console.error(`❌ 쿼리 ${i + 1} 실행 실패:`, error);
        } else {
          console.log(`✅ 쿼리 ${i + 1} 완료`);
        }
      }
    }

    console.log('✅ 테스트 변경로그가 추가되었습니다!');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error('상세:', error);
  }
}

executeSqlFile();
