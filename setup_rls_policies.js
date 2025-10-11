const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupRLSPolicies() {
  console.log('🔄 RLS 정책 설정 시작...');

  try {
    // RLS 활성화
    console.log('RLS 활성화 중...');
    await supabase.rpc('exec', {
      sql: 'ALTER TABLE it_education_data ENABLE ROW LEVEL SECURITY;'
    });

    // 모든 사용자가 읽기 가능한 정책
    console.log('읽기 정책 생성 중...');
    const readPolicySQL = `
      CREATE POLICY "it_education_data_select_policy"
      ON it_education_data
      FOR SELECT
      TO public
      USING (true);
    `;

    await supabase.rpc('exec', { sql: readPolicySQL });

    // 모든 사용자가 쓰기 가능한 정책 (개발용)
    console.log('쓰기 정책 생성 중...');
    const insertPolicySQL = `
      CREATE POLICY "it_education_data_insert_policy"
      ON it_education_data
      FOR INSERT
      TO public
      WITH CHECK (true);
    `;

    await supabase.rpc('exec', { sql: insertPolicySQL });

    // 업데이트 정책
    console.log('업데이트 정책 생성 중...');
    const updatePolicySQL = `
      CREATE POLICY "it_education_data_update_policy"
      ON it_education_data
      FOR UPDATE
      TO public
      USING (true)
      WITH CHECK (true);
    `;

    await supabase.rpc('exec', { sql: updatePolicySQL });

    // 삭제 정책
    console.log('삭제 정책 생성 중...');
    const deletePolicySQL = `
      CREATE POLICY "it_education_data_delete_policy"
      ON it_education_data
      FOR DELETE
      TO public
      USING (true);
    `;

    await supabase.rpc('exec', { sql: deletePolicySQL });

    console.log('✅ RLS 정책 설정 완료!');

  } catch (error) {
    if (error.message && error.message.includes('already exists')) {
      console.log('ℹ️ 정책이 이미 존재합니다:', error.message);
    } else {
      console.error('❌ RLS 정책 설정 실패:', error);
    }
  }
}

setupRLSPolicies();