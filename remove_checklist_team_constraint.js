const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function removeTeamConstraint() {
  try {
    console.log('🔧 admin_checklist_data 테이블의 chk_team 제약조건 제거 시작...');

    // 제약조건 제거 SQL
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: `
        ALTER TABLE admin_checklist_data
        DROP CONSTRAINT IF EXISTS chk_team;
      `
    });

    if (error) {
      console.error('❌ 제약조건 제거 실패:', error);

      // RPC가 없을 경우를 대비한 대안
      console.log('⚠️ RPC 함수가 없습니다. Supabase 대시보드에서 직접 SQL을 실행하세요:');
      console.log(`
      ALTER TABLE admin_checklist_data
      DROP CONSTRAINT IF EXISTS chk_team;
      `);
      return;
    }

    console.log('✅ chk_team 제약조건이 성공적으로 제거되었습니다!');
    console.log('📋 결과:', data);

  } catch (err) {
    console.error('💥 오류 발생:', err);
  }
}

removeTeamConstraint();
