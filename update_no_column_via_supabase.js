const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateSchema() {
  try {
    console.log('🔄 plan_investment_data 테이블 스키마 변경 시도...\n');

    // 1. 먼저 현재 데이터의 no를 NULL로 업데이트 시도
    console.log('📝 1단계: 기존 데이터의 no를 NULL로 설정 시도...');

    // 모든 레코드 조회
    const { data: records, error: fetchError } = await supabase
      .from('plan_investment_data')
      .select('id')
      .eq('is_active', true);

    if (fetchError) {
      console.error('❌ 데이터 조회 오류:', fetchError);
      return;
    }

    console.log(`📊 총 ${records.length}개 레코드 발견`);

    // 각 레코드의 no를 NULL로 업데이트
    for (const record of records) {
      const { error: updateError } = await supabase
        .from('plan_investment_data')
        .update({ no: null })
        .eq('id', record.id);

      if (updateError) {
        console.error(`❌ ID ${record.id} 업데이트 오류:`, updateError.message);
      } else {
        console.log(`✅ ID ${record.id} 업데이트 성공`);
      }
    }

    console.log('\n✅ 1단계 완료: 모든 레코드의 no가 NULL로 설정되었습니다.');
    console.log('\n⚠️  2단계: ALTER TABLE은 Supabase SQL Editor에서 수동 실행 필요');
    console.log('📋 다음 SQL을 Supabase SQL Editor에서 실행해주세요:\n');
    console.log('ALTER TABLE plan_investment_data');
    console.log('ALTER COLUMN no DROP NOT NULL;\n');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

updateSchema();
