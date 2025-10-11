const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function fixRegistrationDate() {
  console.log('🔧 registration_date 컬럼 타입 수정 시작...');

  try {
    // registration_date 컬럼을 DATE 타입으로 변경
    const alterSql = `
      ALTER TABLE it_software_data
      ALTER COLUMN registration_date TYPE DATE USING registration_date::DATE;
    `;

    console.log('📝 registration_date 컬럼 타입 변경 SQL 실행...');
    const { error: alterError } = await supabase.rpc('exec', { sql: alterSql });

    if (alterError) {
      console.error('❌ 컬럼 타입 변경 실패:', alterError);
      return;
    }

    console.log('✅ registration_date 컬럼 타입 변경 완료 (TIMESTAMP → DATE)');

    // 변경 후 데이터 확인
    const { data: updatedData, error: checkError } = await supabase
      .from('it_software_data')
      .select('id, software_name, registration_date, start_date, completed_date')
      .order('id', { ascending: true });

    if (checkError) {
      console.error('❌ 데이터 확인 실패:', checkError);
      return;
    }

    console.log('\n📝 변경 후 데이터:');
    updatedData?.forEach(item => {
      console.log(`ID: ${item.id} | ${item.software_name}`);
      console.log(`   등록일: ${item.registration_date} | 시작일: ${item.start_date} | 완료일: ${item.completed_date || 'N/A'}`);
    });

  } catch (err) {
    console.error('❌ 작업 중 오류:', err);
  }
}

fixRegistrationDate();