require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkITEducationType() {
  console.log('=== IT교육관리 교육유형 확인 ===\n');

  const { data: educations, error } = await supabase
    .from('it_education_data')
    .select('*')
    .limit(5);

  if (error) {
    console.error('조회 에러:', error);
    return;
  }

  console.log('샘플 데이터 (5건):');
  educations.forEach((item, index) => {
    console.log(`\n--- 레코드 ${index + 1} ---`);
    console.log(`  id: ${item.id}`);
    console.log(`  code: ${item.code}`);
    console.log(`  education_type: ${item.education_type}`);
    console.log(`  status: ${item.status}`);
  });

  // 모든 데이터에서 고유 교육유형 확인
  console.log('\n=== 전체 데이터 교육유형 확인 ===\n');
  const { data: allEducations } = await supabase
    .from('it_education_data')
    .select('education_type');

  const uniqueTypes = [...new Set(allEducations.map(e => e.education_type))];
  console.log('고유 교육유형:', uniqueTypes);

  uniqueTypes.forEach(type => {
    const count = allEducations.filter(e => e.education_type === type).length;
    console.log(`  ${type}: ${count}건`);
  });

  // 마스터코드 매핑 확인
  console.log('\n=== 마스터코드 매핑 확인 (GROUP008) ===\n');
  const { data: masterCodes } = await supabase
    .from('admin_mastercode_data')
    .select('*')
    .eq('codetype', 'subcode')
    .like('subcode', 'GROUP008-%');

  masterCodes.forEach(code => {
    console.log(`  ${code.subcode}: ${code.subcode_name}`);
  });
}

checkITEducationType().then(() => process.exit(0));
