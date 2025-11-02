const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkVOCCodes() {
  console.log('\n=== VOC 테이블 코드 확인 ===');

  const { data, error } = await supabase
    .from('it_voc_data')
    .select('*')
    .limit(3);

  if (error) {
    console.error('❌ it_voc_data 오류:', error);
  } else {
    console.log('✅ it_voc_data 데이터:');
    console.log(`총 ${data?.length || 0}개의 데이터\n`);

    if (data && data.length > 0) {
      console.log('컬럼:', Object.keys(data[0]));
      console.log('\n샘플 데이터:');
      console.log(JSON.stringify(data[0], null, 2));
    }
  }
}

checkVOCCodes();
