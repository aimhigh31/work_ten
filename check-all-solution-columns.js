const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAllSolutionColumns() {
  console.log('🔍 솔루션관리 테이블의 모든 varchar 컬럼 확인 중...\n');

  // 샘플 데이터 조회
  const { data: sampleData, error: dataError } = await supabase
    .from('it_solution_data')
    .select('*')
    .limit(1);

  if (dataError) {
    console.error('❌ 데이터 조회 실패:', dataError);
    return;
  }

  console.log('📊 솔루션관리 테이블의 컬럼들:\n');

  if (sampleData && sampleData.length > 0) {
    const row = sampleData[0];
    const columns = Object.keys(row);

    columns.forEach((col, idx) => {
      const value = row[col];
      const type = typeof value;
      let info = '';

      if (type === 'string' && value) {
        const charLength = value.length;
        const byteLength = Buffer.from(value).length;
        info = `(${charLength}글자, ${byteLength}바이트)`;

        if (byteLength > 10) {
          info += ' ⚠️ varchar(10) 초과!';
        }
      }

      console.log(`${idx + 1}. ${col}: ${type === 'string' ? `"${value}"` : value} ${info}`);
    });
  }

  console.log('\n\n💡 varchar(10) 제약이 있는 컬럼 찾기:');
  console.log('위에서 ⚠️ 표시된 컬럼들이 varchar(10) 제약 때문에 저장 실패할 가능성이 높습니다.');
}

checkAllSolutionColumns();
