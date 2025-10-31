require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrateEducationCodes() {
  console.log('=== 개인교육관리 마스터코드 → 서브코드명 마이그레이션 시작 ===\n');

  // 1. 마스터코드 매핑 데이터 로드
  const { data: masterCodes, error: mcError } = await supabase
    .from('admin_mastercode_data')
    .select('*')
    .eq('codetype', 'subcode');

  if (mcError) {
    console.error('마스터코드 조회 에러:', mcError);
    return;
  }

  // 마스터코드 → 서브코드명 매핑 생성
  const codeToNameMap = {};
  masterCodes.forEach(code => {
    codeToNameMap[code.subcode] = code.subcode_name;
  });

  console.log('마스터코드 매핑:');
  console.log(codeToNameMap);
  console.log('');

  // 2. 개인교육관리 데이터 조회
  const { data: educations, error: eduError } = await supabase
    .from('main_education_data')
    .select('*');

  if (eduError) {
    console.error('개인교육관리 조회 에러:', eduError);
    return;
  }

  console.log(`총 ${educations.length}건의 개인교육 데이터 처리 시작...\n`);

  // 3. 각 레코드 업데이트
  let updatedCount = 0;
  let skippedCount = 0;

  for (const education of educations) {
    const updates = {};

    // education_category 변환
    if (education.education_category && education.education_category.includes('GROUP029-')) {
      const newValue = codeToNameMap[education.education_category];
      if (newValue) {
        updates.education_category = newValue;
      }
    }

    // education_type 변환
    if (education.education_type && education.education_type.includes('GROUP008-')) {
      const newValue = codeToNameMap[education.education_type];
      if (newValue) {
        updates.education_type = newValue;
      }
    }

    // status 변환
    if (education.status && education.status.includes('GROUP002-')) {
      const newValue = codeToNameMap[education.status];
      if (newValue) {
        updates.status = newValue;
      }
    }

    // 업데이트가 필요한 경우에만 실행
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('main_education_data')
        .update(updates)
        .eq('id', education.id);

      if (updateError) {
        console.error(`✗ ID ${education.id} (${education.code}) 업데이트 실패:`, updateError);
      } else {
        updatedCount++;
        console.log(`✓ ID ${education.id} (${education.code}):`);
        Object.keys(updates).forEach(key => {
          console.log(`    ${key}: ${education[key]} → ${updates[key]}`);
        });
      }
    } else {
      skippedCount++;
    }
  }

  console.log(`\n=== 마이그레이션 완료 ===`);
  console.log(`  업데이트: ${updatedCount}건`);
  console.log(`  스킵: ${skippedCount}건`);

  // 4. 최종 상태 확인
  console.log('\n=== 최종 상태 확인 ===\n');

  const { data: finalData } = await supabase
    .from('main_education_data')
    .select('education_category, education_type, status');

  const uniqueCategories = [...new Set(finalData.map(d => d.education_category))];
  const uniqueTypes = [...new Set(finalData.map(d => d.education_type))];
  const uniqueStatuses = [...new Set(finalData.map(d => d.status))];

  console.log('교육 카테고리 고유값:', uniqueCategories);
  console.log('교육 유형 고유값:', uniqueTypes);
  console.log('상태 고유값:', uniqueStatuses);

  // GROUP 패턴이 남아있는지 확인
  const hasGroupPattern = finalData.some(d =>
    (d.education_category && d.education_category.includes('GROUP')) ||
    (d.education_type && d.education_type.includes('GROUP')) ||
    (d.status && d.status.includes('GROUP'))
  );

  if (hasGroupPattern) {
    console.log('\n⚠️  일부 데이터에 GROUP 패턴이 남아있습니다!');
  } else {
    console.log('\n✅ 모든 GROUP 패턴이 서브코드명으로 변환되었습니다!');
  }
}

migrateEducationCodes().then(() => process.exit(0));
