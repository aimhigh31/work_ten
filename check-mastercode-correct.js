const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://exxumujwufzqnovhzvif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eHVtdWp3dWZ6cW5vdmh6dmlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjAwOSwiZXhwIjoyMDczMjMyMDA5fQ.VcS_o4yWlpj074ht78r1w-Ho8Ze6uFySLj7YWb32DgE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkMasterCodeData() {
  console.log('📊 마스터코드 데이터 확인 (올바른 테이블명)\n');

  // 1. 테이블 전체 구조 확인
  const { data: allData, error: allError } = await supabase
    .from('admin_mastercode_data')
    .select('*')
    .limit(30);

  if (allError) {
    console.error('❌ 조회 실패:', allError);
    return;
  }

  console.log(`📄 전체 데이터 (${allData?.length}개):`);
  allData?.forEach((item, idx) => {
    console.log(`  ${idx + 1}. ${JSON.stringify(item)}`);
  });
  console.log('\n');

  // 2. 그룹별 분류
  const groups = new Map();
  allData?.forEach(item => {
    const group = item.group_code || item.category || '기타';
    if (!groups.has(group)) {
      groups.set(group, []);
    }
    groups.get(group).push(item);
  });

  console.log('📋 그룹별 분류:');
  for (const [group, items] of groups) {
    console.log(`\n  ${group} (${items.length}개):`);
    items.forEach(item => {
      console.log(`    - code: ${item.code || item.id} | name: ${item.name || item.code_name} | value: ${item.code_value || item.value}`);
    });
  }

  // 3. 현재 DB에 저장된 값과 비교
  console.log('\n\n🔍 현재 사용자 프로필에 저장된 값:');
  console.log('  Position: CL1, CL2, CL3, CL4');
  console.log('  Role: 프로, 파트장');
  console.log('\n이 값들이 마스터코드 테이블에 존재하는지 확인이 필요합니다.');
}

checkMasterCodeData().catch(console.error);
