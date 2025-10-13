const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? '설정됨' : '없음');
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', supabaseKey ? '설정됨' : '없음');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function executeSql() {
  try {
    console.log('📂 SQL 파일 읽기...');
    const sqlPath = path.join(__dirname, 'add_title_field.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('🔧 SQL 실행 중...');
    console.log('SQL:', sql);

    const { data, error } = await supabase.rpc('exec_sql', { sql_query: sql });

    if (error) {
      console.error('❌ SQL 실행 실패:', error);
      process.exit(1);
    }

    console.log('✅ title 컬럼 추가 완료!');
    console.log('데이터:', data);

    // 테이블 구조 확인
    console.log('\n📋 테이블 구조 확인...');
    const { data: columns, error: columnError } = await supabase
      .from('common_log_data')
      .select('*')
      .limit(1);

    if (columnError) {
      console.error('❌ 테이블 조회 실패:', columnError);
    } else {
      console.log('✅ 테이블 구조:', columns ? Object.keys(columns[0] || {}) : []);
    }

  } catch (err) {
    console.error('❌ 오류 발생:', err);
    process.exit(1);
  }
}

executeSql();
