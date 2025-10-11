const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function restoreHierarchicalStructure() {
  try {
    console.log('🔄 계층 구조로 원복 시작...\n');

    // 1. 기존 플랫 구조 테이블 삭제
    console.log('1. 기존 플랫 구조 테이블 삭제 중...');
    const { error: dropError } = await supabase.rpc('exec_sql', {
      sql: 'DROP TABLE IF EXISTS admin_mastercode_data CASCADE'
    });

    if (dropError && !dropError.message.includes('does not exist')) {
      console.log('⚠️ 플랫 구조 테이블이 이미 삭제되었거나 존재하지 않습니다.');
    } else {
      console.log('✅ admin_mastercode_data 테이블 삭제 완료');
    }

    // 2. 기존 계층 구조 테이블이 있다면 삭제
    console.log('\n2. 기존 계층 구조 테이블 정리 중...');
    await supabase.from('admin_subcode').delete().neq('id', 0).then(() => {
      console.log('✅ admin_subcode 테이블 데이터 정리');
    }).catch(() => {});

    await supabase.from('admin_mastercode').delete().neq('id', 0).then(() => {
      console.log('✅ admin_mastercode 테이블 데이터 정리');
    }).catch(() => {});

    // 3. 마스터코드 데이터 삽입
    console.log('\n3. 마스터코드 데이터 삽입 중...');

    const masterCodes = [
      {
        code_group: 'USER_LEVEL',
        code_group_name: '사용자 레벨',
        code_group_description: '사용자 권한 레벨 관리',
        display_order: 1
      },
      {
        code_group: 'TASK_STATUS',
        code_group_name: '업무 상태',
        code_group_description: '업무 진행 상태 코드',
        display_order: 2
      },
      {
        code_group: 'PRIORITY',
        code_group_name: '우선순위',
        code_group_description: '업무 우선순위 레벨',
        display_order: 3
      },
      {
        code_group: 'DEPT_TYPE',
        code_group_name: '부서 유형',
        code_group_description: '부서 분류 코드',
        display_order: 4
      },
      {
        code_group: 'DOC_TYPE',
        code_group_name: '문서 유형',
        code_group_description: '문서 분류 코드',
        display_order: 5
      }
    ];

    const { data: insertedMasters, error: masterError } = await supabase
      .from('admin_mastercode')
      .insert(masterCodes)
      .select();

    if (masterError) {
      console.error('❌ 마스터코드 삽입 오류:', masterError);
      throw masterError;
    }

    console.log(`✅ 마스터코드 ${insertedMasters.length}개 삽입 완료`);

    // 4. 서브코드 데이터 삽입
    console.log('\n4. 서브코드 데이터 삽입 중...');

    const subCodesByGroup = {
      'USER_LEVEL': [
        { sub_code: 'L1', sub_code_name: '사원', code_value1: '#4CAF50' },
        { sub_code: 'L2', sub_code_name: '대리', code_value1: '#2196F3' },
        { sub_code: 'L3', sub_code_name: '과장', code_value1: '#FF9800' },
        { sub_code: 'L4', sub_code_name: '부장', code_value1: '#F44336' },
        { sub_code: 'L5', sub_code_name: '임원', code_value1: '#9C27B0' }
      ],
      'TASK_STATUS': [
        { sub_code: 'PENDING', sub_code_name: '대기중', code_value1: '#9E9E9E' },
        { sub_code: 'IN_PROGRESS', sub_code_name: '진행중', code_value1: '#2196F3' },
        { sub_code: 'COMPLETED', sub_code_name: '완료', code_value1: '#4CAF50' },
        { sub_code: 'CANCELLED', sub_code_name: '취소', code_value1: '#F44336' }
      ],
      'PRIORITY': [
        { sub_code: 'LOW', sub_code_name: '낮음', code_value1: '#4CAF50' },
        { sub_code: 'MEDIUM', sub_code_name: '보통', code_value1: '#FF9800' },
        { sub_code: 'HIGH', sub_code_name: '높음', code_value1: '#F44336' },
        { sub_code: 'URGENT', sub_code_name: '긴급', code_value1: '#D32F2F' }
      ],
      'DEPT_TYPE': [
        { sub_code: 'DEV', sub_code_name: '개발팀' },
        { sub_code: 'DESIGN', sub_code_name: '디자인팀' },
        { sub_code: 'SALES', sub_code_name: '영업팀' },
        { sub_code: 'HR', sub_code_name: '인사팀' }
      ],
      'DOC_TYPE': [
        { sub_code: 'REPORT', sub_code_name: '보고서' },
        { sub_code: 'PROPOSAL', sub_code_name: '제안서' },
        { sub_code: 'CONTRACT', sub_code_name: '계약서' },
        { sub_code: 'MANUAL', sub_code_name: '매뉴얼' }
      ]
    };

    let totalSubCodes = 0;

    for (const master of insertedMasters) {
      const subCodes = subCodesByGroup[master.code_group];
      if (subCodes) {
        const subCodesWithMasterId = subCodes.map((sc, index) => ({
          ...sc,
          mastercode_id: master.id,
          display_order: index + 1
        }));

        const { data: insertedSubs, error: subError } = await supabase
          .from('admin_subcode')
          .insert(subCodesWithMasterId)
          .select();

        if (subError) {
          console.error(`❌ ${master.code_group} 서브코드 삽입 오류:`, subError);
        } else {
          totalSubCodes += insertedSubs.length;
          console.log(`  ✅ ${master.code_group}: ${insertedSubs.length}개 서브코드 삽입`);
        }
      }
    }

    console.log(`\n✅ 총 ${totalSubCodes}개 서브코드 삽입 완료`);

    // 5. 결과 확인
    console.log('\n5. 데이터 확인 중...');

    const { count: masterCount } = await supabase
      .from('admin_mastercode')
      .select('*', { count: 'exact', head: true });

    const { count: subCount } = await supabase
      .from('admin_subcode')
      .select('*', { count: 'exact', head: true });

    console.log(`✅ 마스터코드: ${masterCount}개`);
    console.log(`✅ 서브코드: ${subCount}개`);

    console.log('\n✨ 계층 구조로 원복 완료!');
    console.log('📌 다음 단계: 서비스 레이어와 UI 컴포넌트를 계층 구조에 맞게 수정해야 합니다.');

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  }
}

restoreHierarchicalStructure();