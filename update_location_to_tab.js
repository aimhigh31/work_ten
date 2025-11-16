const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function updateLocationToTab() {
  try {
    console.log('\n🔍 "교육실적보고"를 "교육실적보고탭"으로 업데이트...\n');

    const { data: updateData, error: updateError } = await supabase
      .from('common_log_data')
      .update({ change_location: '교육실적보고탭' })
      .eq('change_location', '교육실적보고')
      .eq('page', 'it_education')
      .select('id, record_id, changed_field, change_location');

    if (updateError) {
      console.error('❌ 업데이트 실패:', updateError);
    } else {
      console.log(`\n✅ ${updateData.length}개 레코드 업데이트 완료:\n`);
      updateData.forEach(record => {
        console.log(`  ID ${record.id}: ${record.record_id} - ${record.changed_field} → ${record.change_location}`);
      });
    }
  } catch (err) {
    console.error('❌ 오류:', err);
  }
}

updateLocationToTab();
