const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function diagnoseChecklistFilter() {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );

  console.log('========================================');
  console.log('체크리스트 상태 필터 진단');
  console.log('========================================\n');

  // 1. 체크리스트 데이터의 실제 status 값 조회
  console.log('1. 체크리스트 데이터의 status 값:\n');
  const { data: checklistData, error: checklistError } = await supabase
    .from('admin_checklist_data')
    .select('status')
    .order('id', { ascending: true });

  if (checklistError) {
    console.error('❌ 체크리스트 데이터 조회 오류:', checklistError);
  } else if (checklistData) {
    const uniqueStatuses = [...new Set(checklistData.map(item => item.status))];
    console.log('고유한 status 값 목록:');
    uniqueStatuses.forEach(status => {
      const count = checklistData.filter(item => item.status === status).length;
      console.log(`  - "${status}" (${count}건)`);
    });
    console.log(`\n전체 데이터 수: ${checklistData.length}건`);
  }

  console.log('\n========================================\n');

  // 2. GROUP002 마스터 코드의 subcode_name 값 조회
  console.log('2. GROUP002 마스터 코드 (상태 옵션):\n');
  const { data: masterCodes, error: masterError } = await supabase
    .from('admin_mastercode_data')
    .select('*')
    .eq('group_code', 'GROUP002')
    .order('id', { ascending: true });

  if (masterError) {
    console.error('❌ 마스터 코드 조회 오류:', masterError);
  } else if (masterCodes) {
    console.log('마스터 코드 목록:');
    masterCodes.forEach(code => {
      console.log(`  - ID: ${code.id}, subcode_name: "${code.subcode_name}", active: ${code.is_active}`);
      console.log(`    전체 데이터:`, code);
    });
    console.log(`\n전체 코드 수: ${masterCodes.length}건`);
  }

  console.log('\n========================================\n');

  // 3. 불일치 분석
  if (checklistData && masterCodes) {
    console.log('3. 불일치 분석:\n');

    const statusValues = [...new Set(checklistData.map(item => item.status))];
    const masterCodeNames = masterCodes
      .filter(code => code.is_active)
      .map(code => code.subcode_name);

    const notInMasterCodes = statusValues.filter(status => !masterCodeNames.includes(status));
    const notInData = masterCodeNames.filter(name => !statusValues.includes(name));

    if (notInMasterCodes.length > 0) {
      console.log('⚠️  데이터에는 있지만 마스터 코드에는 없는 값:');
      notInMasterCodes.forEach(status => {
        console.log(`  - "${status}"`);
      });
    } else {
      console.log('✅ 모든 데이터 status 값이 마스터 코드에 존재합니다.');
    }

    console.log('');

    if (notInData.length > 0) {
      console.log('ℹ️  마스터 코드에는 있지만 데이터에는 사용되지 않은 값:');
      notInData.forEach(name => {
        console.log(`  - "${name}"`);
      });
    } else {
      console.log('✅ 모든 마스터 코드가 데이터에서 사용되고 있습니다.');
    }
  }

  console.log('\n========================================');
}

diagnoseChecklistFilter();
