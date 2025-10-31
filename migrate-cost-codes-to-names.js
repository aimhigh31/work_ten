const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrateCostCodesToNames() {
  try {
    console.log('🔄 비용관리 데이터 마이그레이션 시작...\n');

    // 1. 마스터코드 데이터 가져오기
    const { data: masterCodes, error: masterError } = await supabase
      .from('admin_mastercode_data')
      .select('*')
      .eq('codetype', 'subcode');

    if (masterError) {
      console.error('❌ 마스터코드 조회 실패:', masterError);
      return;
    }

    console.log(`📋 마스터코드 로드 완료: ${masterCodes.length}개\n`);

    // GROUP별로 매핑 생성 (subcode가 이미 GROUP014-SUB005 형식임)
    const codeToNameMap = {};
    masterCodes.forEach(code => {
      codeToNameMap[code.subcode] = code.subcode_name;
    });

    // 매핑 샘플 출력
    console.log('📖 코드 매핑 샘플:');
    console.log('   GROUP002-SUB001:', codeToNameMap['GROUP002-SUB001']);
    console.log('   GROUP002-SUB002:', codeToNameMap['GROUP002-SUB002']);
    console.log('   GROUP002-SUB003:', codeToNameMap['GROUP002-SUB003']);
    console.log('   GROUP002-SUB004:', codeToNameMap['GROUP002-SUB004']);
    console.log('');

    // 2. 비용관리 데이터 가져오기
    const { data: costs, error: costError } = await supabase
      .from('main_cost_data')
      .select('*')
      .order('id', { ascending: false });

    if (costError) {
      console.error('❌ 비용관리 조회 실패:', costError);
      return;
    }

    console.log(`📊 비용관리 데이터 로드 완료: ${costs.length}개\n`);
    console.log('─'.repeat(80));

    let updateCount = 0;
    let errorCount = 0;
    let skippedCount = 0;

    // 3. 각 비용 데이터 변환 및 업데이트
    for (const cost of costs) {
      console.log(`\n🔍 [ID: ${cost.id}] 검사 중...`);
      console.log(`   상태: ${cost.status}`);

      const updates = {};
      let needsUpdate = false;

      // status 변환
      if (cost.status && cost.status.includes('GROUP002-')) {
        const newValue = codeToNameMap[cost.status];
        if (newValue) {
          updates.status = newValue;
          needsUpdate = true;
          console.log(`✏️  [ID: ${cost.id}] 상태: ${cost.status} → ${newValue}`);
        }
      }

      // 업데이트 실행
      if (needsUpdate) {
        console.log(`   ✅ 업데이트 필요: ${Object.keys(updates).join(', ')}`);
        const { error: updateError } = await supabase
          .from('main_cost_data')
          .update(updates)
          .eq('id', cost.id);

        if (updateError) {
          console.error(`   ❌ 업데이트 실패:`, updateError);
          errorCount++;
        } else {
          console.log(`   ✅ 업데이트 성공`);
          updateCount++;
        }
      } else {
        console.log(`   ⏭️  변환 불필요 (이미 서브코드명 형식)`);
        skippedCount++;
      }
    }

    console.log('\n' + '─'.repeat(80));
    console.log(`\n✅ 마이그레이션 완료!`);
    console.log(`   - 성공: ${updateCount}개`);
    console.log(`   - 실패: ${errorCount}개`);
    console.log(`   - 건너뜀: ${skippedCount}개`);
    console.log(`   - 총 처리: ${costs.length}개\n`);

  } catch (err) {
    console.error('❌ 예외 발생:', err);
  }
}

migrateCostCodesToNames();
