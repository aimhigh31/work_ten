const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = 'https://exxumujwufzqnovhzvif.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImV4eHVtdWp3dWZ6cW5vdmh6dmlmIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NzY1NjAwOSwiZXhwIjoyMDczMjMyMDA5fQ.VcS_o4yWlpj074ht78r1w-Ho8Ze6uFySLj7YWb32DgE';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addMissingRoles() {
  console.log('📝 GROUP004에 누락된 직책 추가 중...\n');

  try {
    // 1. GROUP004 그룹 정보 가져오기
    const { data: group, error: groupError } = await supabase
      .from('admin_mastercode_data')
      .select('*')
      .eq('group_code', 'GROUP004')
      .eq('codetype', 'group')
      .single();

    if (groupError) {
      console.error('❌ GROUP004 그룹 조회 실패:', groupError);
      return;
    }

    console.log('✅ GROUP004 그룹 정보:', group);

    // 2. 현재 GROUP004의 서브코드들 확인
    const { data: existingSubs, error: subsError } = await supabase
      .from('admin_mastercode_data')
      .select('*')
      .eq('group_code', 'GROUP004')
      .eq('codetype', 'subcode')
      .order('subcode_order');

    if (subsError) {
      console.error('❌ GROUP004 서브코드 조회 실패:', subsError);
      return;
    }

    console.log(`\n📋 현재 GROUP004 서브코드 (${existingSubs?.length || 0}개):`);
    existingSubs?.forEach(sub => {
      console.log(`  - ${sub.subcode}: ${sub.subcode_name} (order: ${sub.subcode_order})`);
    });

    // 3. 추가할 데이터 (프로, 파트장)
    const newRoles = [
      {
        codetype: 'subcode',
        group_code: group.group_code,
        group_code_name: group.group_code_name,
        group_code_description: group.group_code_description,
        group_code_status: group.group_code_status,
        group_code_order: group.group_code_order,
        subcode: 'GROUP004-SUB001',
        subcode_name: '프로',
        subcode_description: '',
        subcode_status: 'active',
        subcode_remark: '',
        subcode_order: 1,
        is_active: true,
        created_by: 'system',
        updated_by: 'system'
      },
      {
        codetype: 'subcode',
        group_code: group.group_code,
        group_code_name: group.group_code_name,
        group_code_description: group.group_code_description,
        group_code_status: group.group_code_status,
        group_code_order: group.group_code_order,
        subcode: 'GROUP004-SUB002',
        subcode_name: '파트장',
        subcode_description: '',
        subcode_status: 'active',
        subcode_remark: '',
        subcode_order: 2,
        is_active: true,
        created_by: 'system',
        updated_by: 'system'
      }
    ];

    console.log('\n➕ 추가할 직책:');
    newRoles.forEach(role => {
      console.log(`  - ${role.subcode}: ${role.subcode_name}`);
    });

    // 4. 데이터 삽입 (중복 체크)
    for (const newRole of newRoles) {
      // 중복 체크
      const existing = existingSubs?.find(sub => sub.subcode_name === newRole.subcode_name);
      if (existing) {
        console.log(`⚠️  "${newRole.subcode_name}"는 이미 존재합니다 (건너뜀)`);
        continue;
      }

      const { data, error } = await supabase
        .from('admin_mastercode_data')
        .insert([newRole])
        .select()
        .single();

      if (error) {
        console.error(`❌ "${newRole.subcode_name}" 추가 실패:`, error);
      } else {
        console.log(`✅ "${newRole.subcode_name}" 추가 성공 (ID: ${data.id})`);
      }
    }

    // 5. 최종 결과 확인
    const { data: finalSubs } = await supabase
      .from('admin_mastercode_data')
      .select('*')
      .eq('group_code', 'GROUP004')
      .eq('codetype', 'subcode')
      .order('subcode_order');

    console.log(`\n✅ 최종 GROUP004 서브코드 (${finalSubs?.length || 0}개):`);
    finalSubs?.forEach(sub => {
      console.log(`  - ${sub.subcode}: ${sub.subcode_name} (order: ${sub.subcode_order})`);
    });

  } catch (error) {
    console.error('❌ 처리 중 오류 발생:', error);
  }
}

addMissingRoles().catch(console.error);
