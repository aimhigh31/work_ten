require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrateITEducationType() {
  console.log('=== IT교육관리 교육유형 마이그레이션 시작 ===\n');

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

  console.log('GROUP008 마스터코드 매핑:');
  Object.keys(codeToNameMap).filter(k => k.includes('GROUP008-')).forEach(key => {
    console.log(`  ${key} → ${codeToNameMap[key]}`);
  });
  console.log('');

  // 2. IT교육 데이터 조회
  const { data: educations, error: eduError } = await supabase
    .from('it_education_data')
    .select('*');

  if (eduError) {
    console.error('IT교육 조회 에러:', eduError);
    return;
  }

  console.log(`총 ${educations.length}건의 IT교육 데이터 처리 시작...\n`);

  // 3. 각 레코드 업데이트
  let updatedCount = 0;
  let skippedCount = 0;

  for (const education of educations) {
    const updates = {};

    // education_type이 GROUP008-로 시작하는 경우 변환
    if (education.education_type && education.education_type.includes('GROUP008-')) {
      const newValue = codeToNameMap[education.education_type];
      if (newValue) {
        updates.education_type = newValue;
      }
    }

    // status가 GROUP002-로 시작하는 경우 변환
    if (education.status && education.status.includes('GROUP002-')) {
      const newValue = codeToNameMap[education.status];
      if (newValue) {
        updates.status = newValue;
      }
    }

    // 업데이트가 필요한 경우에만 실행
    if (Object.keys(updates).length > 0) {
      const { error: updateError } = await supabase
        .from('it_education_data')
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
    .from('it_education_data')
    .select('education_type, status');

  const uniqueTypes = [...new Set(finalData.map(d => d.education_type))];
  const uniqueStatuses = [...new Set(finalData.map(d => d.status))];

  console.log('고유 교육유형:', uniqueTypes);
  uniqueTypes.forEach(type => {
    const count = finalData.filter(d => d.education_type === type).length;
    console.log(`  ${type}: ${count}건`);
  });

  console.log('\n고유 상태:', uniqueStatuses);

  // GROUP 패턴이 남아있는지 확인
  const hasGroupPattern = finalData.some(d =>
    (d.education_type && d.education_type.includes('GROUP')) ||
    (d.status && d.status.includes('GROUP'))
  );

  if (hasGroupPattern) {
    console.log('\n⚠️  일부 데이터에 GROUP 패턴이 남아있습니다!');
  } else {
    console.log('\n✅ 모든 GROUP 패턴이 서브코드명으로 변환되었습니다!');
  }
}

migrateITEducationType().then(() => process.exit(0));
