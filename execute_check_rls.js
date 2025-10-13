const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://exxumujwufzqnovhzvif.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eHVtdWp3dWZ6cW5vdmh6dmlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjAwOSwiZXhwIjoyMDczMjMyMDA5fQ.VcS_o4yWlpj074ht78r1w-Ho8Ze6uFySLj7YWb32DgE';

async function checkRLS() {
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    console.log('🔍 RLS 정책 확인 중...');

    // RLS 활성화 여부 확인
    const { data: tableInfo, error: tableError } = await supabase
      .rpc('exec', {
        sql: `SELECT tablename, rowsecurity FROM pg_tables WHERE tablename = 'common_log_data'`
      });

    if (tableError) {
      console.error('❌ 테이블 정보 조회 실패:', tableError);
    } else {
      console.log('📊 테이블 정보:', tableInfo);
    }

    // RLS 정책 조회
    const { data: policies, error: policyError } = await supabase
      .rpc('exec', {
        sql: `SELECT schemaname, tablename, policyname, permissive, roles, cmd FROM pg_policies WHERE tablename = 'common_log_data'`
      });

    if (policyError) {
      console.error('❌ 정책 조회 실패:', policyError);
    } else {
      console.log('🔐 RLS 정책:', JSON.stringify(policies, null, 2));
    }

    console.log('\n📝 RLS 비활성화 스크립트 생성...');

  } catch (error) {
    console.error('❌ 오류:', error);
  }
}

checkRLS();
