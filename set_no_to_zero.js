const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setNoToZero() {
  try {
    console.log('🔄 기존 데이터의 no를 0으로 설정 중...\n');

    // 모든 레코드 조회
    const { data: records, error: fetchError } = await supabase
      .from('plan_investment_data')
      .select('id, no')
      .eq('is_active', true);

    if (fetchError) {
      console.error('❌ 데이터 조회 오류:', fetchError);
      return;
    }

    console.log(`📊 총 ${records.length}개 레코드 발견`);

    // 각 레코드의 no를 0으로 업데이트
    let successCount = 0;
    let errorCount = 0;

    for (const record of records) {
      const { error: updateError } = await supabase
        .from('plan_investment_data')
        .update({ no: 0 })
        .eq('id', record.id);

      if (updateError) {
        console.error(`❌ ID ${record.id} 업데이트 오류:`, updateError.message);
        errorCount++;
      } else {
        console.log(`✅ ID ${record.id}: no ${record.no} → 0`);
        successCount++;
      }
    }

    console.log(`\n✅ 완료: ${successCount}개 성공, ${errorCount}개 실패`);
    console.log('📝 이제 프론트엔드에서 no를 역순정렬로 관리합니다.');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

setNoToZero();
