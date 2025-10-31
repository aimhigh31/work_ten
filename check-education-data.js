const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function checkEducationData() {
  console.log('🔍 개인교육관리 데이터 확인 중...\n');

  const { data, error } = await supabase
    .from('main_education_data')
    .select('id, no, code, title, assignee_name, created_by, updated_by')
    .eq('is_active', true)
    .order('id', { ascending: false })
    .limit(10);

  if (error) {
    console.error('❌ 오류:', error);
    return;
  }

  console.log('✅ 조회 결과:\n');
  data.forEach(item => {
    console.log(`ID: ${item.id}, NO: ${item.no}`);
    console.log(`  코드: ${item.code}`);
    console.log(`  제목: ${item.title}`);
    console.log(`  담당자(assignee_name): "${item.assignee_name}"`);
    console.log(`  작성자(created_by): "${item.created_by}"`);
    console.log(`  수정자(updated_by): "${item.updated_by}"`);
    console.log('  ---');
  });

  console.log(`\n총 ${data.length}개 데이터 조회됨`);
}

checkEducationData();
