const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function check() {
  // 커리큘럼 테이블 확인
  const { data: curriculum, error: currError } = await supabase
    .from('security_education_curriculum')
    .select('*');

  console.log('🔍 security_education_curriculum 테이블:');
  console.log('  데이터 개수:', curriculum ? curriculum.length : 0);
  if (curriculum && curriculum.length > 0) {
    console.log('  첫 번째 데이터:', curriculum[0]);
  }

  // 교육 데이터 테이블 확인
  const { data: education, error: eduError } = await supabase
    .from('security_education_data')
    .select('id, education_name')
    .order('id', { ascending: false })
    .limit(5);

  console.log('\n🔍 security_education_data 테이블 (최근 5개):');
  if (education && education.length > 0) {
    education.forEach(item => {
      console.log(`  ID ${item.id}: ${item.education_name}`);
    });
  }
}

check();