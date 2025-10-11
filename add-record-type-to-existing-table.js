const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function addRecordTypeToExistingTable() {
  try {
    console.log('🚀 기존 admin_mastercode3_flat 테이블에 record_type 필드 추가 및 마이그레이션 시작...');

    // 1. 현재 테이블 구조 확인
    console.log('📊 현재 테이블 데이터 분석 중...');
    const { data: currentData, error: fetchError } = await supabase
      .from('admin_mastercode3_flat')
      .select('*')
      .order('group_code_order')
      .order('subcode_order');

    if (fetchError) {
      console.error('❌ 데이터 조회 오류:', fetchError);
      return;
    }

    console.log(`📝 총 ${currentData.length}개 레코드 발견`);

    // 2. 그룹별로 분석
    const groupMap = new Map();
    currentData.forEach(row => {
      if (!groupMap.has(row.group_code)) {
        groupMap.set(row.group_code, {
          group_info: {
            group_code: row.group_code,
            group_code_name: row.group_code_name,
            group_code_description: row.group_code_description,
            group_code_status: row.group_code_status,
            group_code_order: row.group_code_order,
            created_at: row.created_at,
            updated_at: row.updated_at,
            created_by: row.created_by,
            updated_by: row.updated_by,
            is_active: row.is_active
          },
          subcodes: []
        });
      }

      // 서브코드 정보 추가
      groupMap.get(row.group_code).subcodes.push({
        id: row.id,
        subcode: row.subcode,
        subcode_name: row.subcode_name,
        subcode_description: row.subcode_description,
        subcode_status: row.subcode_status,
        subcode_remark: row.subcode_remark,
        subcode_order: row.subcode_order,
        ...row
      });
    });

    console.log(`🏗️  ${groupMap.size}개 그룹 분석 완료`);

    // 3. record_type 컬럼이 이미 있는지 확인
    console.log('🔍 record_type 컬럼 존재 여부 확인 중...');

    // 첫 번째 레코드에 record_type이 있는지 확인
    const hasRecordType = currentData.length > 0 && 'record_type' in currentData[0];

    if (hasRecordType) {
      console.log('✅ record_type 컬럼이 이미 존재합니다!');

      // 기존 데이터 상태 확인
      const groupRecords = currentData.filter(row => row.record_type === 'group');
      const subcodeRecords = currentData.filter(row => row.record_type === 'subcode');

      console.log(`📊 현재 상태:`)
      console.log(`  - 그룹 레코드: ${groupRecords.length}개`);
      console.log(`  - 서브코드 레코드: ${subcodeRecords.length}개`);
      console.log(`  - 전체 레코드: ${currentData.length}개`);

      if (groupRecords.length === 0) {
        console.log('⚠️  그룹 레코드가 없습니다. 그룹 레코드를 추가해야 합니다.');
        await addGroupRecords(groupMap);
      } else {
        console.log('✅ 테이블 구조가 이미 Type 필드를 지원합니다!');
      }

    } else {
      console.log('🔧 record_type 컬럼이 없습니다. 데이터 마이그레이션을 진행합니다...');

      // 4. 기존 데이터를 새로운 구조로 변환
      const newRecords = [];

      // 각 그룹에 대해 그룹 레코드와 서브코드 레코드 생성
      for (const [groupCode, groupData] of groupMap) {
        // 그룹 레코드 추가
        newRecords.push({
          record_type: 'group',
          ...groupData.group_info,
          subcode: null,
          subcode_name: null,
          subcode_description: null,
          subcode_status: null,
          subcode_remark: null,
          subcode_order: null
        });

        // 서브코드 레코드들 추가
        groupData.subcodes.forEach(subcode => {
          newRecords.push({
            record_type: 'subcode',
            group_code: groupData.group_info.group_code,
            group_code_name: groupData.group_info.group_code_name,
            group_code_description: groupData.group_info.group_code_description,
            group_code_status: groupData.group_info.group_code_status,
            group_code_order: groupData.group_info.group_code_order,
            subcode: subcode.subcode,
            subcode_name: subcode.subcode_name,
            subcode_description: subcode.subcode_description,
            subcode_status: subcode.subcode_status,
            subcode_remark: subcode.subcode_remark,
            subcode_order: subcode.subcode_order,
            is_active: subcode.is_active,
            created_at: subcode.created_at,
            updated_at: subcode.updated_at,
            created_by: subcode.created_by,
            updated_by: subcode.updated_by
          });
        });
      }

      console.log(`📦 ${newRecords.length}개의 새 레코드 생성 (그룹: ${groupMap.size}개, 서브코드: ${newRecords.length - groupMap.size}개)`);

      // 5. 기존 데이터 백업 (선택사항)
      console.log('💾 기존 데이터 삭제 중...');
      await supabase
        .from('admin_mastercode3_flat')
        .delete()
        .neq('id', 0);

      // 6. 새 데이터 삽입
      console.log('📥 새 구조로 데이터 삽입 중...');
      const { data: insertedData, error: insertError } = await supabase
        .from('admin_mastercode3_flat')
        .insert(newRecords)
        .select();

      if (insertError) {
        console.error('❌ 데이터 삽입 오류:', insertError);
        return;
      }

      console.log('✅ 데이터 마이그레이션 완료!');
    }

    // 7. 최종 결과 확인
    const { data: finalData, error: finalError } = await supabase
      .from('admin_mastercode3_flat')
      .select('*')
      .order('group_code_order')
      .order('record_type', { ascending: false }) // group이 먼저
      .order('subcode_order');

    if (finalError) {
      console.error('❌ 최종 데이터 조회 오류:', finalError);
      return;
    }

    console.log('\n📊 마이그레이션 후 데이터 구조:');
    let currentGroup = null;
    finalData.forEach(row => {
      if (row.record_type === 'group') {
        currentGroup = row.group_code;
        console.log(`\n📁 그룹: ${row.group_code} - ${row.group_code_name} (순서: ${row.group_code_order})`);
      } else if (row.record_type === 'subcode') {
        console.log(`  ├─ [${row.id}] ${row.subcode} - ${row.subcode_name} (순서: ${row.subcode_order})`);
      }
    });

    const finalGroupCount = finalData.filter(row => row.record_type === 'group').length;
    const finalSubcodeCount = finalData.filter(row => row.record_type === 'subcode').length;

    console.log(`\n📋 최종 통계:`);
    console.log(`  총 ${finalGroupCount}개 그룹`);
    console.log(`  총 ${finalSubcodeCount}개 서브코드`);
    console.log(`  총 ${finalData.length}개 레코드`);

    console.log('\n🎉 Type 필드 마이그레이션 완료!');
    console.log('\n💡 이제 다음과 같은 장점을 얻을 수 있습니다:');
    console.log('  - record_type으로 그룹과 서브코드 명확히 구분');
    console.log('  - 그룹 정보 중복 최소화');
    console.log('  - 더 효율적인 CRUD 작업');
    console.log('  - 데이터 일관성 향상');

  } catch (error) {
    console.error('💥 마이그레이션 실패:', error);
  }
}

async function addGroupRecords(groupMap) {
  console.log('📥 그룹 레코드 추가 중...');

  const groupRecords = [];
  for (const [groupCode, groupData] of groupMap) {
    groupRecords.push({
      record_type: 'group',
      ...groupData.group_info,
      subcode: null,
      subcode_name: null,
      subcode_description: null,
      subcode_status: null,
      subcode_remark: null,
      subcode_order: null
    });
  }

  const { data: insertedGroups, error: groupError } = await supabase
    .from('admin_mastercode3_flat')
    .insert(groupRecords)
    .select();

  if (groupError) {
    console.error('❌ 그룹 레코드 추가 오류:', groupError);
    return;
  }

  console.log(`✅ ${insertedGroups.length}개 그룹 레코드 추가 완료!`);
}

addRecordTypeToExistingTable();