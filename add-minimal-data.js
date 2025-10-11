require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addMinimalData() {
  try {
    console.log('🔍 최소한의 데이터로 테스트...\n');

    // 필수 필드만 포함
    const minimalData = {
      no: 100,
      code: 'TEST001',
      department: 'DEP001',
      work_content: '테스트 체크리스트',
      team: '테스트팀',  // 한국어 팀명 테스트
      assignee: 'TEST'
    };

    console.log('➕ 최소 데이터 추가 시도...');
    const { data, error } = await supabase
      .from('admin_checklist_data')
      .insert([minimalData])
      .select();

    if (error) {
      console.error('❌ 추가 실패:', error.message);
      console.error('상세:', error);
    } else {
      console.log('✅ 추가 성공!');
      console.log('추가된 데이터:', data[0]);
    }

  } catch (error) {
    console.error('💥 오류:', error.message);
  }
}

addMinimalData();