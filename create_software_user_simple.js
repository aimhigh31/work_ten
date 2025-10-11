const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTableDirectly() {
  console.log('🔧 it_software_user 테이블 생성 시도...');

  try {
    // 1. 먼저 테이블이 이미 존재하는지 확인
    const { data: existingData, error: checkError } = await supabase
      .from('it_software_user')
      .select('id')
      .limit(1);

    if (!checkError) {
      console.log('✅ it_software_user 테이블이 이미 존재합니다.');
      return;
    }

    console.log('📋 테이블이 존재하지 않음. 샘플 데이터로 테이블 구조를 생성합니다...');

    // 2. 샘플 데이터를 insert하여 테이블 자동 생성 시도
    const sampleData = {
      software_id: 999999, // 존재하지 않는 임시 ID
      user_name: 'sample_user',
      department: 'sample_dept',
      usage_status: '사용중',
      registration_date: '2025-01-01',
      created_by: 'system',
      updated_by: 'system',
      is_active: false // 샘플이므로 비활성
    };

    const { data, error } = await supabase
      .from('it_software_user')
      .insert(sampleData)
      .select();

    if (error) {
      console.error('❌ 테이블 생성 실패:', error);
      console.log('\n💡 Supabase Dashboard에서 수동으로 테이블을 생성하세요:');
      console.log('🌐 https://supabase.com/dashboard/project/' + supabaseUrl.split('//')[1].split('.')[0] + '/editor');
      console.log('\n📋 테이블 이름: it_software_user');
      console.log('📋 필요한 컬럼들:');
      console.log('- id: int8 (Primary Key, Auto-increment)');
      console.log('- software_id: int8 (NOT NULL)');
      console.log('- user_name: text (NOT NULL)');
      console.log('- department: text');
      console.log('- exclusive_id: text');
      console.log('- reason: text');
      console.log('- usage_status: text (default: "사용중")');
      console.log('- start_date: date');
      console.log('- end_date: date');
      console.log('- registration_date: date (default: today)');
      console.log('- created_by: text (default: "user")');
      console.log('- updated_by: text (default: "user")');
      console.log('- is_active: bool (default: true)');
      console.log('- created_at: timestamptz (default: now())');
      console.log('- updated_at: timestamptz (default: now())');
      return;
    }

    console.log('✅ it_software_user 테이블 생성 성공!');

    // 3. 샘플 데이터 삭제
    await supabase
      .from('it_software_user')
      .delete()
      .eq('user_name', 'sample_user');

    console.log('🧹 샘플 데이터 정리 완료');

  } catch (err) {
    console.error('❌ 오류:', err);
  }
}

createTableDirectly();