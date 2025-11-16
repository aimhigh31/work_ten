const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function updateChangeLogLocationField() {
  try {
    console.log('\n🔍 하드웨어 변경로그에서 "위치" 필드 조회 중...\n');

    // 1. 하드웨어 변경로그 조회 (위치 필드)
    const { data: changeLogs, error: logError } = await supabase
      .from('common_log_data')
      .select('id, record_id, changed_field, description')
      .eq('page', 'it_hardware')
      .eq('changed_field', '위치')
      .order('id', { ascending: false });

    if (logError) {
      console.error('❌ 변경로그 조회 실패:', logError);
      return;
    }

    console.log(`📊 "위치" 변경로그: ${changeLogs.length}개\n`);

    if (changeLogs.length === 0) {
      console.log('✅ 업데이트가 필요한 항목이 없습니다.');
      return;
    }

    // 2. 각 로그 업데이트
    let successCount = 0;
    let failCount = 0;

    for (const log of changeLogs) {
      // description에서 "위치가"를 "자산위치가"로 변경
      const newDescription = log.description.replace(/위치가/g, '자산위치가');

      const { error: updateError } = await supabase
        .from('common_log_data')
        .update({
          changed_field: '자산위치',
          description: newDescription
        })
        .eq('id', log.id);

      if (updateError) {
        console.error(`❌ ID ${log.id} 업데이트 실패:`, updateError);
        failCount++;
      } else {
        console.log(`✅ ID ${log.id}: ${log.record_id}`);
        console.log(`   Changed field: 위치 → 자산위치`);
        console.log(`   Description: ${log.description}`);
        console.log(`              → ${newDescription}`);
        successCount++;
      }
    }

    console.log('\n📊 업데이트 완료:');
    console.log(`  성공: ${successCount}개`);
    console.log(`  실패: ${failCount}개`);

  } catch (err) {
    console.error('❌ 오류:', err);
  }
}

updateChangeLogLocationField();
