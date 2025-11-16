const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function updateChangeLogStatus() {
  try {
    console.log('\n🔍 GROUP002 상태 마스터코드 조회 중...\n');

    // 1. GROUP002 상태 마스터코드 조회
    const { data: masterCodes, error: masterError } = await supabase
      .from('admin_mastercode_data')
      .select('subcode, subcode_name')
      .eq('group_code', 'GROUP002')
      .eq('codetype', 'subcode')
      .eq('is_active', true);

    if (masterError) {
      console.error('❌ 마스터코드 조회 실패:', masterError);
      return;
    }

    // 2. 서브코드 → 서브코드명 매핑 생성
    const subcodeMap = {};
    masterCodes.forEach(code => {
      subcodeMap[code.subcode] = code.subcode_name;
    });

    console.log('✅ 마스터코드 매핑:');
    Object.entries(subcodeMap).forEach(([subcode, name]) => {
      console.log(`  ${subcode} → ${name}`);
    });

    console.log('\n🔍 하드웨어 변경로그에서 상태 변경 조회 중...\n');

    // 3. 하드웨어 변경로그 조회 (상태 필드)
    const { data: changeLogs, error: logError } = await supabase
      .from('common_log_data')
      .select('id, record_id, changed_field, before_value, after_value, description')
      .eq('page', 'it_hardware')
      .eq('changed_field', '상태')
      .order('id', { ascending: false });

    if (logError) {
      console.error('❌ 변경로그 조회 실패:', logError);
      return;
    }

    console.log(`📊 상태 변경로그: ${changeLogs.length}개\n`);

    // 4. 서브코드가 포함된 로그만 필터링
    const logsToUpdate = changeLogs.filter(log =>
      (log.before_value && log.before_value.startsWith('GROUP')) ||
      (log.after_value && log.after_value.startsWith('GROUP'))
    );

    console.log(`🔧 업데이트 필요: ${logsToUpdate.length}개\n`);

    if (logsToUpdate.length === 0) {
      console.log('✅ 업데이트가 필요한 항목이 없습니다.');
      return;
    }

    // 5. 각 로그 업데이트
    let successCount = 0;
    let failCount = 0;

    for (const log of logsToUpdate) {
      const newBeforeValue = subcodeMap[log.before_value] || log.before_value;
      const newAfterValue = subcodeMap[log.after_value] || log.after_value;

      // description도 업데이트
      let newDescription = log.description;
      Object.entries(subcodeMap).forEach(([subcode, name]) => {
        newDescription = newDescription.replace(new RegExp(subcode, 'g'), name);
      });

      const { error: updateError } = await supabase
        .from('common_log_data')
        .update({
          before_value: newBeforeValue,
          after_value: newAfterValue,
          description: newDescription
        })
        .eq('id', log.id);

      if (updateError) {
        console.error(`❌ ID ${log.id} 업데이트 실패:`, updateError);
        failCount++;
      } else {
        console.log(`✅ ID ${log.id}: ${log.record_id}`);
        console.log(`   Before: ${log.before_value} → ${newBeforeValue}`);
        console.log(`   After: ${log.after_value} → ${newAfterValue}`);
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

updateChangeLogStatus();
