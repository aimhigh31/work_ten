require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function addTeamColumn() {
  try {
    console.log('🔧 security_education_data 테이블에 team 컬럼 추가 중...\n');

    // RPC를 통해 SQL 실행 (PostgreSQL 직접 접근)
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        ALTER TABLE security_education_data
        ADD COLUMN IF NOT EXISTS team TEXT;
      `
    });

    if (error) {
      // RPC 함수가 없을 수 있으므로 직접 쿼리 시도
      console.log('⚠️  RPC 방식 실패, 직접 업데이트 시도...');

      // 임시로 team 값을 null로 설정한 레코드 업데이트 시도
      // (이 방법은 컬럼이 없으면 실패하고, 있으면 성공)
      const { error: updateError } = await supabase
        .from('security_education_data')
        .update({ team: null })
        .eq('id', 999999); // 존재하지 않는 ID로 테스트

      if (updateError && updateError.message.includes('column "team" of relation')) {
        console.log('❌ team 컬럼이 아직 없습니다.');
        console.log('\n📋 Supabase Dashboard에서 직접 실행해야 할 SQL:');
        console.log('================================================');
        console.log('ALTER TABLE security_education_data');
        console.log('ADD COLUMN team TEXT;');
        console.log('================================================\n');
        console.log('👉 https://supabase.com/dashboard 에서 SQL Editor를 사용하세요.');
        return;
      } else {
        console.log('✅ team 컬럼이 이미 존재합니다.');
        return;
      }
    }

    console.log('✅ team 컬럼이 성공적으로 추가되었습니다.');

    // 확인
    const { data: checkData, error: checkError } = await supabase
      .from('security_education_data')
      .select('*')
      .limit(1);

    if (!checkError && checkData && checkData.length > 0) {
      const columns = Object.keys(checkData[0]);
      if (columns.includes('team')) {
        console.log('✅ 확인 완료: team 컬럼이 존재합니다.');
      }
    }
  } catch (error) {
    console.error('❌ 예외 발생:', error);
    console.log('\n📋 Supabase Dashboard에서 직접 실행해야 할 SQL:');
    console.log('================================================');
    console.log('ALTER TABLE security_education_data');
    console.log('ADD COLUMN team TEXT;');
    console.log('================================================\n');
    console.log('👉 https://supabase.com/dashboard 에서 SQL Editor를 사용하세요.');
  }
}

addTeamColumn();
