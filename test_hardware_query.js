const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function testHardwareQuery() {
  console.log('🔍 하드웨어 데이터 조회 테스트...');

  try {
    // 직접 SQL로 조회
    console.log('📝 SQL 직접 조회 시도...');
    const { data: sqlData, error: sqlError } = await supabase.rpc('exec', {
      sql: "SELECT * FROM it_hardware_data WHERE is_active = true LIMIT 3;"
    });

    if (sqlError) {
      console.error('❌ SQL 직접 조회 실패:', sqlError);
    } else {
      console.log('✅ SQL 직접 조회 성공:', sqlData);
    }

    // REST API로 조회
    console.log('📝 REST API 조회 시도...');
    const { data: restData, error: restError } = await supabase
      .from('it_hardware_data')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(3);

    if (restError) {
      console.error('❌ REST API 조회 실패:', restError);
      console.error('❌ 에러 상세:', {
        message: restError?.message,
        details: restError?.details,
        hint: restError?.hint,
        code: restError?.code
      });
    } else {
      console.log('✅ REST API 조회 성공:', restData);
    }

  } catch (error) {
    console.error('❌ 전체 테스트 실패:', error);
  }
}

testHardwareQuery();