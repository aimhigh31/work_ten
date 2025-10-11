const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function updateNoColumn() {
  try {
    console.log('🔄 plan_investment_data 테이블의 no 컬럼을 NULL 허용으로 변경 중...');

    // PostgreSQL 직접 SQL 실행
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        -- no 컬럼을 NULL 허용으로 변경
        ALTER TABLE plan_investment_data
        ALTER COLUMN no DROP NOT NULL;

        -- 기존 데이터의 no를 NULL로 설정
        UPDATE plan_investment_data
        SET no = NULL
        WHERE is_active = true;
      `
    });

    if (error) {
      console.error('❌ SQL 실행 오류:', error);

      // RPC 함수가 없을 경우 대체 방법 사용
      console.log('📝 대체 방법: SQL 스크립트 파일 생성');
      const fs = require('fs');
      const sqlContent = `
-- plan_investment_data 테이블의 no 컬럼을 NULL 허용으로 변경
ALTER TABLE plan_investment_data
ALTER COLUMN no DROP NOT NULL;

-- 기존 데이터의 no를 NULL로 설정
UPDATE plan_investment_data
SET no = NULL
WHERE is_active = true;
`;

      fs.writeFileSync('update_investment_no_column.sql', sqlContent);
      console.log('✅ update_investment_no_column.sql 파일이 생성되었습니다.');
      console.log('📋 Supabase SQL Editor에서 직접 실행해주세요.');
      return;
    }

    console.log('✅ no 컬럼이 NULL 허용으로 변경되었습니다.');
    console.log('✅ 기존 데이터의 no가 NULL로 설정되었습니다.');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

updateNoColumn();
