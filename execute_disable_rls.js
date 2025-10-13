const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://exxumujwufzqnovhzvif.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eHVtdWp3dWZ6cW5vdmh6dmlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjAwOSwiZXhwIjoyMDczMjMyMDA5fQ.VcS_o4yWlpj074ht78r1w-Ho8Ze6uFySLj7YWb32DgE';

async function disableRLS() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    console.log('🔗 Supabase 연결 중...');

    // SQL 파일 읽기
    const sqlFilePath = path.join(__dirname, 'disable_rls.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');

    console.log('🔓 RLS 비활성화 중...');

    // SQL 실행 (첫 번째 줄만 - ALTER TABLE)
    const mainQuery = sqlContent.split('\n')[1]; // "ALTER TABLE common_log_data DISABLE ROW LEVEL SECURITY;"

    const { error } = await supabase.rpc('exec', { sql: mainQuery });

    if (error) {
      console.error('❌ RLS 비활성화 실패:', error);
    } else {
      console.log('✅ RLS가 비활성화되었습니다!');
      console.log('✅ 이제 모든 사용자가 common_log_data에 접근할 수 있습니다.');
    }

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error('상세:', error);
  }
}

disableRLS();
