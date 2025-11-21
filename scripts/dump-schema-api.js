const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function dumpSchemaViaAPI() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  try {
    console.log('✅ Supabase 클라이언트 생성 성공');

    let schemaSQL = '-- 개발 DB 스키마 덤프\n';
    schemaSQL += '-- 생성일: ' + new Date().toISOString() + '\n';
    schemaSQL += '-- 프로젝트: ' + process.env.SUPABASE_PROJECT_REF + '\n\n';

    // 테이블 목록 조회
    const { data: tables, error } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .eq('table_type', 'BASE TABLE');

    if (error) {
      console.log('ℹ️ API를 통한 스키마 조회가 제한되어 있습니다.');
      console.log('👉 Supabase Dashboard를 사용하는 것을 권장합니다.\n');
      console.log('📍 다음 단계를 따라주세요:');
      console.log('1. https://supabase.com/dashboard/project/exxumujwufzqnovhzvif 접속');
      console.log('2. SQL Editor 메뉴로 이동');
      console.log('3. 다음 SQL 실행:\n');

      const sql = `
-- 모든 테이블 목록 조회
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_type = 'BASE TABLE'
ORDER BY table_name;

-- 각 테이블의 구조를 보려면 (예시: admin_mastercode_data)
SELECT
  column_name,
  data_type,
  character_maximum_length,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'admin_mastercode_data'
ORDER BY ordinal_position;
`;

      console.log(sql);
      console.log('\n4. 결과를 복사해서 schema.sql 파일로 저장');

      return;
    }

    console.log('📋 테이블 개수:', tables.length);
    console.log('테이블 목록:', tables.map(t => t.table_name).join(', '));

  } catch (error) {
    console.error('❌ 에러:', error.message);
  }
}

dumpSchemaViaAPI();
