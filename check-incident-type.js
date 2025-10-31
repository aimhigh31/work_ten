require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkIncidentType() {
  console.log('=== 보안사고관리 사고유형 확인 ===\n');

  const { data: incidents, error } = await supabase
    .from('security_accident_data')
    .select('*')
    .limit(5);

  if (error) {
    console.error('조회 에러:', error);
    return;
  }

  console.log('샘플 데이터 (5건):');
  incidents.forEach((item, index) => {
    console.log(`\n--- 레코드 ${index + 1} ---`);
    console.log(`  id: ${item.id}`);
    console.log(`  code: ${item.code}`);
    console.log(`  incident_type: ${item.incident_type}`);
    console.log(`  status: ${item.status}`);
  });

  // 모든 데이터에서 고유 사고유형 확인
  console.log('\n=== 전체 데이터 사고유형 확인 ===\n');
  const { data: allIncidents } = await supabase
    .from('security_accident_data')
    .select('incident_type');

  const uniqueTypes = [...new Set(allIncidents.map(i => i.incident_type))];
  console.log('고유 사고유형:', uniqueTypes);

  uniqueTypes.forEach(type => {
    const count = allIncidents.filter(i => i.incident_type === type).length;
    console.log(`  ${type}: ${count}건`);
  });

  // 마스터코드 매핑 확인
  console.log('\n=== 마스터코드 매핑 확인 (GROUP009) ===\n');
  const { data: masterCodes } = await supabase
    .from('admin_mastercode_data')
    .select('*')
    .eq('codetype', 'subcode')
    .like('subcode', 'GROUP009-%');

  masterCodes.forEach(code => {
    console.log(`  ${code.subcode}: ${code.subcode_name}`);
  });
}

checkIncidentType().then(() => process.exit(0));
