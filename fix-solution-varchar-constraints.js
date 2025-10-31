// it_solution_data 테이블 varchar 제약 수정 스크립트
require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixVarcharConstraints() {
  try {
    console.log('🔧 it_solution_data 테이블 varchar 제약 수정 시작...\n');

    // SQL 쿼리: varchar(10) -> varchar(50)으로 변경
    const sqlQueries = [
      {
        name: 'status 컬럼 확장',
        sql: 'ALTER TABLE it_solution_data ALTER COLUMN status TYPE varchar(50);'
      },
      {
        name: 'solution_type 컬럼 확장',
        sql: 'ALTER TABLE it_solution_data ALTER COLUMN solution_type TYPE varchar(50);'
      },
      {
        name: 'development_type 컬럼 확장',
        sql: 'ALTER TABLE it_solution_data ALTER COLUMN development_type TYPE varchar(50);'
      },
      {
        name: 'code 컬럼 확장',
        sql: 'ALTER TABLE it_solution_data ALTER COLUMN code TYPE varchar(50);'
      },
      {
        name: 'team 컬럼 확장',
        sql: 'ALTER TABLE it_solution_data ALTER COLUMN team TYPE varchar(50);'
      }
    ];

    // 각 쿼리 실행
    for (const query of sqlQueries) {
      console.log(`📝 ${query.name} 실행 중...`);
      const { data, error } = await supabase.rpc('exec_sql', { sql_query: query.sql });

      if (error) {
        console.error(`❌ ${query.name} 실패:`, error.message);
        console.log('💡 대안: Supabase 대시보드에서 직접 실행해야 할 수 있습니다.');
      } else {
        console.log(`✅ ${query.name} 성공`);
      }
    }

    console.log('\n✅ varchar 제약 수정 완료!');
    console.log('📊 변경 사항:');
    console.log('  - status: varchar(10) → varchar(50)');
    console.log('  - solution_type: varchar(10) → varchar(50)');
    console.log('  - development_type: varchar(10) → varchar(50)');
    console.log('  - code: varchar(10) → varchar(50)');
    console.log('  - team: varchar(10) → varchar(50)');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.log('\n💡 Supabase SQL Editor에서 직접 실행하세요:');
    console.log(`
-- it_solution_data 테이블 varchar 제약 수정
ALTER TABLE it_solution_data ALTER COLUMN status TYPE varchar(50);
ALTER TABLE it_solution_data ALTER COLUMN solution_type TYPE varchar(50);
ALTER TABLE it_solution_data ALTER COLUMN development_type TYPE varchar(50);
ALTER TABLE it_solution_data ALTER COLUMN code TYPE varchar(50);
ALTER TABLE it_solution_data ALTER COLUMN team TYPE varchar(50);
    `);
  }
}

fixVarcharConstraints();
