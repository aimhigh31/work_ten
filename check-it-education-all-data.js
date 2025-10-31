require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkAllData() {
  console.log('=== IT교육관리 전체 데이터 확인 ===\n');

  const { data: educations, error } = await supabase
    .from('it_education_data')
    .select('*')
    .order('id', { ascending: false });

  if (error) {
    console.error('조회 에러:', error);
    return;
  }

  console.log(`총 ${educations.length}건의 데이터`);
  console.log('');

  educations.forEach((item) => {
    console.log(`ID: ${item.id}, 코드: ${item.code}, 교육명: ${item.education_name}`);
    console.log(`  교육유형: ${item.education_type}`);
    console.log(`  상태: ${item.status}`);
    console.log(`  교육일: ${item.execution_date || item.start_date}`);
    console.log('');
  });

  // GROUP 패턴이 있는지 확인
  const hasGroupPattern = educations.some(e =>
    (e.education_type && e.education_type.includes('GROUP')) ||
    (e.status && e.status.includes('GROUP'))
  );

  if (hasGroupPattern) {
    console.log('⚠️  GROUP 패턴이 발견된 데이터:');
    educations.forEach(e => {
      if ((e.education_type && e.education_type.includes('GROUP')) ||
          (e.status && e.status.includes('GROUP'))) {
        console.log(`  ID: ${e.id}, 교육유형: ${e.education_type}, 상태: ${e.status}`);
      }
    });
  } else {
    console.log('✅ GROUP 패턴이 없습니다.');
  }
}

checkAllData().then(() => process.exit(0));
