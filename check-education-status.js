require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkEducation() {
  console.log('=== 개인교육관리 데이터 확인 ===\n');

  const { data: educations, error } = await supabase
    .from('main_education_data')
    .select('*')
    .limit(5);

  if (error) {
    console.error('조회 에러:', error);
    return;
  }

  console.log('샘플 데이터 (5건):');
  educations.forEach((item, index) => {
    console.log(`\n--- 레코드 ${index + 1} ---`);
    Object.keys(item).forEach(key => {
      if (item[key] && typeof item[key] === 'string' && item[key].includes('GROUP')) {
        console.log(`  ${key}: ${item[key]} <<<< 마스터코드 발견!`);
      } else {
        console.log(`  ${key}: ${item[key]}`);
      }
    });
  });

  // 모든 데이터에서 GROUP 패턴 필드 찾기
  console.log('\n=== 전체 데이터에서 마스터코드 필드 분석 ===\n');
  const { data: allEducations } = await supabase
    .from('main_education_data')
    .select('*');

  const groupFields = {};
  allEducations.forEach(item => {
    Object.keys(item).forEach(key => {
      if (item[key] && typeof item[key] === 'string' && item[key].includes('GROUP')) {
        if (!groupFields[key]) {
          groupFields[key] = new Set();
        }
        groupFields[key].add(item[key]);
      }
    });
  });

  console.log('마스터코드 형식으로 저장된 필드:');
  Object.keys(groupFields).forEach(field => {
    console.log(`\n  ${field}:`);
    [...groupFields[field]].forEach(value => {
      console.log(`    - ${value}`);
    });
  });

  // 마스터코드 매핑 확인
  console.log('\n=== 마스터코드 매핑 확인 ===\n');
  const allGroupCodes = new Set();
  Object.values(groupFields).forEach(codeSet => {
    codeSet.forEach(code => allGroupCodes.add(code));
  });

  for (const code of allGroupCodes) {
    const { data: masterCode } = await supabase
      .from('admin_mastercode_data')
      .select('*')
      .eq('codetype', 'subcode')
      .eq('subcode', code)
      .single();

    if (masterCode) {
      console.log(`  ${code} → ${masterCode.subcode_name}`);
    } else {
      console.log(`  ${code} → (매핑 없음)`);
    }
  }
}

checkEducation().then(() => process.exit(0));
