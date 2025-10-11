const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkLatestData() {
  console.log('🔍 최신 교육실적보고 데이터 확인...');

  try {
    // 최신 업데이트된 데이터 확인 (updated_at 기준)
    const { data, error } = await supabase
      .from('it_education_data')
      .select('id, education_name, achievements, improvements, education_feedback, report_notes, updated_at')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
      .limit(3);

    if (error) {
      console.error('❌ 데이터 조회 실패:', error);
      return;
    }

    console.log('\n📊 최신 교육실적보고 데이터 (최근 업데이트 순):');
    data.forEach((row, index) => {
      console.log(`\n${index + 1}. ID: ${row.id} - "${row.education_name}"`);
      console.log(`   업데이트 시간: ${row.updated_at}`);
      console.log(`   성과: ${row.achievements || 'NULL'}`);
      console.log(`   개선사항: ${row.improvements || 'NULL'}`);
      console.log(`   교육소감: ${row.education_feedback || 'NULL'}`);
      console.log(`   비고: ${row.report_notes || 'NULL'}`);

      // 실제 값의 길이도 확인
      console.log(`   성과 길이: ${(row.achievements || '').length}자`);
      console.log(`   개선사항 길이: ${(row.improvements || '').length}자`);
      console.log(`   교육소감 길이: ${(row.education_feedback || '').length}자`);
      console.log(`   비고 길이: ${(row.report_notes || '').length}자`);
    });

  } catch (err) {
    console.error('❌ 데이터 확인 중 오류:', err);
  }
}

checkLatestData();