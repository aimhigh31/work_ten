const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Supabase 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkChecklistData() {
  try {
    const checklistId = 57;

    console.log(`🔍 체크리스트 ID ${checklistId} 조회 중...\n`);

    const { data, error } = await supabase
      .from('admin_checklist_data')
      .select('*')
      .eq('id', checklistId)
      .single();

    if (error) {
      console.error('❌ 조회 오류:', error);
      process.exit(1);
    }

    if (!data) {
      console.log(`⚠️ 체크리스트 ID ${checklistId}를 찾을 수 없습니다.`);
      return;
    }

    console.log('✅ 체크리스트 데이터 조회 성공!\n');
    console.log('📊 전체 데이터:');
    console.log(JSON.stringify(data, null, 2));

    if (data.guide) {
      console.log('\n📝 안내가이드 (guide 필드):');
      console.log('='.repeat(80));
      console.log(data.guide);
      console.log('='.repeat(80));
    } else {
      console.log('\n❌ guide 필드가 비어있습니다!');
    }

  } catch (err) {
    console.error('❌ 실행 중 오류:', err);
    process.exit(1);
  }
}

checkChecklistData();
