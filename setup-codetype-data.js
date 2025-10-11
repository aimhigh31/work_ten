const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function setupCodetypeData() {
  try {
    console.log('🚀 codetype을 활용한 마스터코드 데이터 설정 시작...');

    // 1. 기존 잘못된 데이터 삭제
    console.log('🗑️  기존 데이터 정리 중...');
    await supabase
      .from('admin_mastercode3_flat')
      .delete()
      .neq('id', 0);

    console.log('✅ 기존 데이터 삭제 완료');

    // 2. 새로운 데이터 구조 생성
    const newData = [
      // USER_LEVEL 그룹
      {
        codetype: 'group',
        group_code: 'USER_LEVEL',
        group_code_name: '사용자 레벨',
        group_code_description: '사용자 권한 레벨 관리',
        group_code_status: 'active',
        group_code_order: 1,
        subcode: '',
        subcode_name: '',
        subcode_description: '',
        subcode_status: 'active',
        subcode_remark: '',
        subcode_order: 0,
        is_active: true,
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        codetype: 'subcode',
        group_code: 'USER_LEVEL',
        group_code_name: '사용자 레벨',
        group_code_description: '사용자 권한 레벨 관리',
        group_code_status: 'active',
        group_code_order: 1,
        subcode: 'L1',
        subcode_name: '사원',
        subcode_description: '일반 사원 레벨',
        subcode_status: 'active',
        subcode_remark: '기본 권한',
        subcode_order: 1,
        is_active: true,
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        codetype: 'subcode',
        group_code: 'USER_LEVEL',
        group_code_name: '사용자 레벨',
        group_code_description: '사용자 권한 레벨 관리',
        group_code_status: 'active',
        group_code_order: 1,
        subcode: 'L2',
        subcode_name: '주임',
        subcode_description: '주임 레벨',
        subcode_status: 'active',
        subcode_remark: '중간 권한',
        subcode_order: 2,
        is_active: true,
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        codetype: 'subcode',
        group_code: 'USER_LEVEL',
        group_code_name: '사용자 레벨',
        group_code_description: '사용자 권한 레벨 관리',
        group_code_status: 'active',
        group_code_order: 1,
        subcode: 'L3',
        subcode_name: '대리',
        subcode_description: '대리 레벨',
        subcode_status: 'active',
        subcode_remark: '관리 권한',
        subcode_order: 3,
        is_active: true,
        created_by: 'admin',
        updated_by: 'admin'
      },

      // TASK_STATUS 그룹
      {
        codetype: 'group',
        group_code: 'TASK_STATUS',
        group_code_name: '업무 상태',
        group_code_description: '업무 처리 상태 관리',
        group_code_status: 'active',
        group_code_order: 2,
        subcode: '',
        subcode_name: '',
        subcode_description: '',
        subcode_status: 'active',
        subcode_remark: '',
        subcode_order: 0,
        is_active: true,
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        codetype: 'subcode',
        group_code: 'TASK_STATUS',
        group_code_name: '업무 상태',
        group_code_description: '업무 처리 상태 관리',
        group_code_status: 'active',
        group_code_order: 2,
        subcode: 'PENDING',
        subcode_name: '대기중',
        subcode_description: '업무 대기 상태',
        subcode_status: 'active',
        subcode_remark: '시작 전',
        subcode_order: 1,
        is_active: true,
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        codetype: 'subcode',
        group_code: 'TASK_STATUS',
        group_code_name: '업무 상태',
        group_code_description: '업무 처리 상태 관리',
        group_code_status: 'active',
        group_code_order: 2,
        subcode: 'IN_PROGRESS',
        subcode_name: '진행중',
        subcode_description: '업무 진행 상태',
        subcode_status: 'active',
        subcode_remark: '처리 중',
        subcode_order: 2,
        is_active: true,
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        codetype: 'subcode',
        group_code: 'TASK_STATUS',
        group_code_name: '업무 상태',
        group_code_description: '업무 처리 상태 관리',
        group_code_status: 'active',
        group_code_order: 2,
        subcode: 'COMPLETED',
        subcode_name: '완료',
        subcode_description: '업무 완료 상태',
        subcode_status: 'active',
        subcode_remark: '완료됨',
        subcode_order: 3,
        is_active: true,
        created_by: 'admin',
        updated_by: 'admin'
      },

      // PRIORITY 그룹
      {
        codetype: 'group',
        group_code: 'PRIORITY',
        group_code_name: '우선순위',
        group_code_description: '업무 우선순위 관리',
        group_code_status: 'active',
        group_code_order: 3,
        subcode: '',
        subcode_name: '',
        subcode_description: '',
        subcode_status: 'active',
        subcode_remark: '',
        subcode_order: 0,
        is_active: true,
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        codetype: 'subcode',
        group_code: 'PRIORITY',
        group_code_name: '우선순위',
        group_code_description: '업무 우선순위 관리',
        group_code_status: 'active',
        group_code_order: 3,
        subcode: 'LOW',
        subcode_name: '낮음',
        subcode_description: '낮은 우선순위',
        subcode_status: 'active',
        subcode_remark: '여유 있음',
        subcode_order: 1,
        is_active: true,
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        codetype: 'subcode',
        group_code: 'PRIORITY',
        group_code_name: '우선순위',
        group_code_description: '업무 우선순위 관리',
        group_code_status: 'active',
        group_code_order: 3,
        subcode: 'HIGH',
        subcode_name: '높음',
        subcode_description: '높은 우선순위',
        subcode_status: 'active',
        subcode_remark: '중요함',
        subcode_order: 2,
        is_active: true,
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        codetype: 'subcode',
        group_code: 'PRIORITY',
        group_code_name: '우선순위',
        group_code_description: '업무 우선순위 관리',
        group_code_status: 'active',
        group_code_order: 3,
        subcode: 'URGENT',
        subcode_name: '긴급',
        subcode_description: '긴급 우선순위',
        subcode_status: 'active',
        subcode_remark: '긴급함',
        subcode_order: 3,
        is_active: true,
        created_by: 'admin',
        updated_by: 'admin'
      }
    ];

    // 3. 새 데이터 삽입
    console.log(`📥 ${newData.length}개 레코드 삽입 중...`);
    const { data: insertedData, error: insertError } = await supabase
      .from('admin_mastercode3_flat')
      .insert(newData)
      .select();

    if (insertError) {
      console.error('❌ 데이터 삽입 오류:', insertError);
      return;
    }

    console.log('✅ 데이터 삽입 완료!');

    // 4. 결과 확인
    const { data: finalData } = await supabase
      .from('admin_mastercode3_flat')
      .select('*')
      .order('group_code_order')
      .order('codetype', { ascending: false }) // group이 먼저
      .order('subcode_order');

    console.log('\n📊 설정된 데이터 구조:');
    let currentGroup = null;

    finalData.forEach(row => {
      if (row.codetype === 'group') {
        currentGroup = row.group_code;
        console.log(`\n📁 그룹: ${row.group_code} - ${row.group_code_name} (순서: ${row.group_code_order})`);
        console.log(`   └─ [${row.id}] codetype='group'`);
      } else if (row.codetype === 'subcode') {
        console.log(`   ├─ [${row.id}] ${row.subcode} - ${row.subcode_name} (순서: ${row.subcode_order}) codetype='subcode'`);
      }
    });

    const groupCount = finalData.filter(row => row.codetype === 'group').length;
    const subcodeCount = finalData.filter(row => row.codetype === 'subcode').length;

    console.log(`\n📋 최종 통계:`);
    console.log(`  총 ${groupCount}개 그룹 (codetype='group')`);
    console.log(`  총 ${subcodeCount}개 서브코드 (codetype='subcode')`);
    console.log(`  총 ${finalData.length}개 레코드`);

    console.log('\n🎉 codetype 기반 데이터 설정 완료!');
    console.log('\n💡 이제 다음과 같이 구분됩니다:');
    console.log('  - 그룹 레코드: codetype = "group"');
    console.log('  - 서브코드 레코드: codetype = "subcode"');

  } catch (error) {
    console.error('💥 설정 실패:', error);
  }
}

setupCodetypeData();