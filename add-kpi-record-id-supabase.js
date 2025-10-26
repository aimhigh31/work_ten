const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

(async () => {
  try {
    console.log('🔧 main_task_data 테이블에 kpi_record_id 컬럼 추가 중...');

    // Supabase의 RPC를 통한 SQL 실행
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE main_task_data
        ADD COLUMN IF NOT EXISTS kpi_record_id int4;
      `
    });

    if (error) {
      console.error('❌ RPC 실행 실패:', error);
      console.log('\n📋 대신 Supabase Dashboard에서 다음 SQL을 실행해주세요:');
      console.log('---');
      console.log('ALTER TABLE main_task_data');
      console.log('ADD COLUMN IF NOT EXISTS kpi_record_id int4;');
      console.log('---');
    } else {
      console.log('✅ kpi_record_id 컬럼 추가 완료');
    }

    // 컬럼 확인
    const { data: sample } = await supabase
      .from('main_task_data')
      .select('*')
      .limit(1);

    if (sample && sample.length > 0) {
      console.log('\n현재 테이블 컬럼 목록:');
      console.log(Object.keys(sample[0]));
    }

  } catch (err) {
    console.error('❌ 에러:', err);
    console.log('\n📋 Supabase Dashboard에서 다음 SQL을 실행해주세요:');
    console.log('---');
    console.log('ALTER TABLE main_task_data');
    console.log('ADD COLUMN IF NOT EXISTS kpi_record_id int4;');
    console.log('---');
  }
})();
