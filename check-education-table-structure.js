const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkTableStructure() {
  console.log('🔍 main_education_data 테이블 구조 확인 중...\n');

  const { data, error } = await supabase
    .from('main_education_data')
    .select('*')
    .eq('is_active', true)
    .limit(1);

  if (error) {
    console.error('❌ 오류:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('✅ 테이블 컬럼 목록:');
    console.log(Object.keys(data[0]).join(', '));
    console.log('\n샘플 데이터:');
    console.log(JSON.stringify(data[0], null, 2));
  }
}

checkTableStructure();
