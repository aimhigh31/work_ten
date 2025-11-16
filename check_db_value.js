const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkDBValue() {
  try {
    console.log('\n🔍 최신 변경로그 10개 조회 (IT-EDU-25-005 관련)...\n');

    const { data, error } = await supabase
      .from('common_log_data')
      .select('id, record_id, changed_field, change_location, description, created_at')
      .eq('record_id', 'IT-EDU-25-005')
      .order('id', { ascending: false })
      .limit(10);

    if (error) {
      console.error('❌ 조회 실패:', error);
      return;
    }

    console.log('📊 조회된 레코드:\n');
    data.forEach(record => {
      console.log(`ID ${record.id}: ${record.changed_field}`);
      console.log(`  변경위치: "${record.change_location}"`);
      console.log(`  설명: ${record.description.substring(0, 80)}...`);
      console.log(`  생성시간: ${record.created_at}`);
      console.log('');
    });

    console.log('\n🔍 특별히 ID 2089 확인...\n');
    const { data: row2089, error: error2089 } = await supabase
      .from('common_log_data')
      .select('*')
      .eq('id', 2089)
      .single();

    if (error2089) {
      console.error('❌ ID 2089 조회 실패:', error2089);
    } else if (row2089) {
      console.log('✅ ID 2089 전체 데이터:');
      console.log(JSON.stringify(row2089, null, 2));
    } else {
      console.log('⚠️ ID 2089가 존재하지 않습니다.');
    }

  } catch (err) {
    console.error('❌ 오류:', err);
  }
}

checkDBValue();
