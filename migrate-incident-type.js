require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function migrateIncidentType() {
  console.log('=== 보안사고관리 사고유형 마이그레이션 시작 ===\n');

  // 1. 마스터코드 매핑 데이터 로드
  const { data: masterCodes, error: mcError } = await supabase
    .from('admin_mastercode_data')
    .select('*')
    .eq('codetype', 'subcode')
    .like('subcode', 'GROUP009-%');

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
  Object.keys(codeToNameMap).forEach(key => {
    console.log(`  ${key} → ${codeToNameMap[key]}`);
  });
  console.log('');

  // 2. 보안사고 데이터 조회
  const { data: incidents, error: incError } = await supabase
    .from('security_accident_data')
    .select('*');

  if (incError) {
    console.error('보안사고 조회 에러:', incError);
    return;
  }

  console.log(`총 ${incidents.length}건의 보안사고 데이터 처리 시작...\n`);

  // 3. 각 레코드 업데이트
  let updatedCount = 0;
  let skippedCount = 0;

  for (const incident of incidents) {
    // incident_type이 GROUP009-로 시작하는 경우만 변환
    if (incident.incident_type && incident.incident_type.includes('GROUP009-')) {
      const newValue = codeToNameMap[incident.incident_type];
      if (newValue) {
        const { error: updateError } = await supabase
          .from('security_accident_data')
          .update({ incident_type: newValue })
          .eq('id', incident.id);

        if (updateError) {
          console.error(`✗ ID ${incident.id} (${incident.code}) 업데이트 실패:`, updateError);
        } else {
          updatedCount++;
          console.log(`✓ ID ${incident.id} (${incident.code}): ${incident.incident_type} → ${newValue}`);
        }
      } else {
        console.warn(`⚠ ID ${incident.id} (${incident.code}): 매핑 없음 (${incident.incident_type})`);
        skippedCount++;
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
    .from('security_accident_data')
    .select('incident_type');

  const uniqueTypes = [...new Set(finalData.map(d => d.incident_type))];
  console.log('고유 사고유형:', uniqueTypes);

  uniqueTypes.forEach(type => {
    const count = finalData.filter(d => d.incident_type === type).length;
    console.log(`  ${type}: ${count}건`);
  });

  // GROUP 패턴이 남아있는지 확인
  const hasGroupPattern = finalData.some(d => d.incident_type && d.incident_type.includes('GROUP'));

  if (hasGroupPattern) {
    console.log('\n⚠️  일부 데이터에 GROUP 패턴이 남아있습니다!');
  } else {
    console.log('\n✅ 모든 GROUP 패턴이 서브코드명으로 변환되었습니다!');
  }
}

migrateIncidentType().then(() => process.exit(0));
