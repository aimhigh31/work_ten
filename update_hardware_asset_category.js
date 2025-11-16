const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function updateHardwareAssetCategory() {
  try {
    console.log('\n🔍 GROUP018 자산분류 마스터코드 조회 중...\n');

    // 1. GROUP018 자산분류 마스터코드 조회
    const { data: masterCodes, error: masterError } = await supabase
      .from('admin_mastercode_data')
      .select('subcode, subcode_name')
      .eq('group_code', 'GROUP018')
      .eq('codetype', 'subcode')
      .eq('is_active', true);

    if (masterError) {
      console.error('❌ 마스터코드 조회 실패:', masterError);
      return;
    }

    console.log('✅ 마스터코드 조회 성공:');
    masterCodes.forEach(code => {
      console.log(`  ${code.subcode} → ${code.subcode_name}`);
    });

    // 2. 서브코드 → 서브코드명 매핑 생성
    const subcodeMap = {};
    masterCodes.forEach(code => {
      subcodeMap[code.subcode] = code.subcode_name;
    });

    console.log('\n🔍 하드웨어 데이터에서 서브코드 사용 확인 중...\n');

    // 3. 하드웨어 데이터 조회
    const { data: hardwareList, error: hardwareError } = await supabase
      .from('it_hardware_data')
      .select('id, code, asset_name, asset_category')
      .order('id', { ascending: false });

    if (hardwareError) {
      console.error('❌ 하드웨어 데이터 조회 실패:', hardwareError);
      return;
    }

    // 4. 서브코드로 저장된 항목 찾기
    const itemsToUpdate = hardwareList.filter(item =>
      item.asset_category && item.asset_category.startsWith('GROUP')
    );

    console.log(`📊 전체 하드웨어: ${hardwareList.length}개`);
    console.log(`🔧 업데이트 필요: ${itemsToUpdate.length}개\n`);

    if (itemsToUpdate.length === 0) {
      console.log('✅ 업데이트가 필요한 항목이 없습니다.');
      return;
    }

    // 5. 각 항목 업데이트
    let successCount = 0;
    let failCount = 0;

    for (const item of itemsToUpdate) {
      const newCategoryName = subcodeMap[item.asset_category];

      if (!newCategoryName) {
        console.log(`⚠️ ID ${item.id}: ${item.asset_category} - 매핑되는 서브코드명 없음`);
        failCount++;
        continue;
      }

      const { error: updateError } = await supabase
        .from('it_hardware_data')
        .update({ asset_category: newCategoryName })
        .eq('id', item.id);

      if (updateError) {
        console.error(`❌ ID ${item.id} 업데이트 실패:`, updateError);
        failCount++;
      } else {
        console.log(`✅ ID ${item.id}: ${item.code} (${item.asset_name}) - ${item.asset_category} → ${newCategoryName}`);
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

updateHardwareAssetCategory();
