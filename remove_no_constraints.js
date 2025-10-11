const { createClient } = require('@supabase/supabase-js');
const https = require('https');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

// 프로젝트 ID 추출
const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)[1];

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'public' }
});

async function removeConstraints() {
  try {
    console.log('🔄 plan_investment_data 테이블의 no 컬럼 제약조건 제거 시도...\n');

    // Supabase postgrest를 통해 SQL 함수 호출 시도
    const sqlStatements = [
      'ALTER TABLE plan_investment_data DROP CONSTRAINT IF EXISTS plan_investment_data_no_key;',
      'ALTER TABLE plan_investment_data ALTER COLUMN no DROP NOT NULL;',
      'UPDATE plan_investment_data SET no = 0 WHERE is_active = true;'
    ];

    console.log('📋 실행할 SQL:');
    sqlStatements.forEach((sql, i) => {
      console.log(`${i + 1}. ${sql}`);
    });

    console.log('\n⚠️  DDL 명령어는 Supabase REST API로 직접 실행할 수 없습니다.');
    console.log('📝 다음 방법 중 하나를 선택해주세요:\n');
    console.log('방법 1: Supabase Dashboard SQL Editor 사용');
    console.log('  1. https://supabase.com/dashboard/project/' + projectId + '/sql/new 접속');
    console.log('  2. 아래 SQL을 복사하여 붙여넣기');
    console.log('  3. Run 버튼 클릭\n');

    console.log('-- 실행할 SQL --');
    console.log(sqlStatements.join('\n'));
    console.log('-- SQL 끝 --\n');

    console.log('방법 2: PostgreSQL 직접 연결');
    console.log('  1. .env.local에 SUPABASE_DB_PASSWORD 추가');
    console.log('  2. node update_investment_no_column_direct.js 실행\n');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
  }
}

removeConstraints();
