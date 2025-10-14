const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkTableStructure() {
  console.log('📊 main_education_data 테이블 구조 확인\n');

  // 1. 전체 데이터 조회
  const { data, error } = await supabase
    .from('main_education_data')
    .select('*')
    .limit(5);

  if (error) {
    console.log('❌ 데이터 조회 실패:', error);
    return;
  }

  if (!data || data.length === 0) {
    console.log('⚠️ 데이터가 없습니다.');
    return;
  }

  console.log('✅ 데이터 개수:', data.length);
  console.log('\n📋 첫 번째 레코드:');
  console.log(JSON.stringify(data[0], null, 2));

  console.log('\n🔑 컬럼 목록:');
  const columns = Object.keys(data[0]);
  columns.forEach((col, index) => {
    const value = data[0][col];
    const type = typeof value;
    console.log(`${index + 1}. ${col} (${type}): ${value}`);
  });

  // 2. no 컬럼 확인
  console.log('\n🔍 "no" 컬럼 확인:');
  if (columns.includes('no')) {
    console.log('✅ "no" 컬럼 존재함');
    console.log('타입:', typeof data[0].no);
    console.log('값:', data[0].no);
  } else {
    console.log('❌ "no" 컬럼이 없습니다!');
    console.log('비슷한 컬럼:', columns.filter(c => c.toLowerCase().includes('no')));
  }

  // 3. no 컬럼으로 정렬 테스트
  console.log('\n🧪 no 컬럼 정렬 테스트:');
  const { data: sortedData, error: sortError } = await supabase
    .from('main_education_data')
    .select('no')
    .order('no', { ascending: false })
    .limit(1);

  if (sortError) {
    console.log('❌ 정렬 실패:', sortError.message);
    console.log('상세:', sortError);
  } else {
    console.log('✅ 정렬 성공:', sortedData);
  }
}

checkTableStructure();
