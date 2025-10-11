require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.log('❌ Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMastercodeSchema() {
  console.log('🔍 admin_mastercode_data 테이블 스키마 확인 중...');

  try {
    // 기존 데이터 하나를 조회해서 컬럼 구조 파악
    const { data, error } = await supabase
      .from('admin_mastercode_data')
      .select('*')
      .limit(1);

    if (error) {
      console.error('❌ 스키마 확인 실패:', error);
      return;
    }

    if (data && data.length > 0) {
      console.log('📊 테이블 컬럼들:');
      Object.keys(data[0]).forEach((column, index) => {
        console.log(`  ${index + 1}. ${column}: ${typeof data[0][column]} = ${data[0][column]}`);
      });
    }

  } catch (err) {
    console.error('❌ 오류:', err);
  }
}

checkMastercodeSchema().then(() => {
  console.log('✅ 완료');
}).catch((err) => {
  console.error('❌ 오류:', err);
});