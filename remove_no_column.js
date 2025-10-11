const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function removeNoColumn() {
  console.log('🗑️ it_software_data 테이블에서 no 컬럼 제거 시작...');

  try {
    // no 컬럼 제거 SQL
    const dropColumnSql = `
      ALTER TABLE it_software_data
      DROP COLUMN IF EXISTS no;
    `;

    console.log('📝 no 컬럼 제거 SQL 실행...');
    const { error } = await supabase.rpc('exec', { sql: dropColumnSql });

    if (error) {
      console.error('❌ no 컬럼 제거 실패:', error);
      return;
    }

    console.log('✅ no 컬럼 제거 완료');

    // 제거 후 테이블 구조 확인
    const checkTableSql = `
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns
      WHERE table_name = 'it_software_data'
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;

    const { data: columns, error: checkError } = await supabase.rpc('exec', { sql: checkTableSql });

    if (checkError) {
      console.error('❌ 테이블 구조 확인 실패:', checkError);
      return;
    }

    console.log('\n📋 수정된 테이블 구조:');
    if (columns && Array.isArray(columns)) {
      columns.forEach(col => {
        console.log(`  - ${col.column_name}: ${col.data_type} (${col.is_nullable === 'YES' ? 'nullable' : 'not null'})`);
      });
    }

    // 데이터 확인
    const { data: sampleData, error: dataError } = await supabase
      .from('it_software_data')
      .select('id, code, software_name')
      .limit(3);

    if (dataError) {
      console.error('❌ 데이터 확인 실패:', dataError);
    } else {
      console.log('\n📝 샘플 데이터 확인:');
      sampleData?.forEach(item => {
        console.log(`  ID: ${item.id} | 코드: ${item.code} | 소프트웨어: ${item.software_name}`);
      });
    }

  } catch (err) {
    console.error('❌ 작업 중 오류:', err);
  }
}

removeNoColumn();