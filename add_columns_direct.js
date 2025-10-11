const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addColumnsDirectly() {
  console.log('🔄 it_education_data 테이블 컬럼 직접 추가...');

  try {
    // 개별 컬럼 추가 명령어들
    const columnAddCommands = [
      "ALTER TABLE it_education_data ADD COLUMN IF NOT EXISTS achievements TEXT;",
      "ALTER TABLE it_education_data ADD COLUMN IF NOT EXISTS improvements TEXT;",
      "ALTER TABLE it_education_data ADD COLUMN IF NOT EXISTS education_feedback TEXT;",
      "ALTER TABLE it_education_data ADD COLUMN IF NOT EXISTS report_notes TEXT;"
    ];

    for (const command of columnAddCommands) {
      console.log(`실행 중: ${command}`);

      const { error } = await supabase.rpc('exec', {
        sql: command
      });

      if (error) {
        console.error(`❌ 실행 실패: ${command}`, error);
      } else {
        console.log(`✅ 실행 성공: ${command}`);
      }
    }

    console.log('📊 테이블 구조 확인 중...');

    // 테이블 구조 확인을 위해 기본 select 시도
    const { data, error: selectError } = await supabase
      .from('it_education_data')
      .select('id, education_name')
      .limit(1);

    if (selectError) {
      console.error('❌ 기본 조회 실패:', selectError);
    } else {
      console.log('✅ 기본 테이블 조회 성공');
    }

  } catch (err) {
    console.error('❌ 컬럼 추가 중 오류:', err);
  }
}

addColumnsDirectly();