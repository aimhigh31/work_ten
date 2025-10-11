const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createTypeTable() {
  try {
    console.log('🚀 admin_mastercode3_with_type 테이블 생성 시작...');

    // 1. 먼저 기존 테이블이 있다면 삭제
    console.log('🗑️  기존 테이블 확인 중...');

    // 2. 새 테이블 데이터 직접 삽입
    console.log('📥 새 테이블에 데이터 삽입 중...');

    // 그룹 레코드들
    const groupRecords = [
      {
        record_type: 'group',
        group_code: 'USER_LEVEL',
        group_code_name: '사용자 레벨',
        group_code_description: '사용자 권한 레벨 관리',
        group_code_status: 'active',
        group_code_order: 1,
        is_active: true,
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        record_type: 'group',
        group_code: 'TASK_STATUS',
        group_code_name: '업무 상태',
        group_code_description: '업무 처리 상태 관리',
        group_code_status: 'active',
        group_code_order: 2,
        is_active: true,
        created_by: 'admin',
        updated_by: 'admin'
      },
      {
        record_type: 'group',
        group_code: 'PRIORITY',
        group_code_name: '우선순위',
        group_code_description: '업무 우선순위 관리',
        group_code_status: 'active',
        group_code_order: 3,
        is_active: true,
        created_by: 'admin',
        updated_by: 'admin'
      }
    ];

    // 서브코드 레코드들
    const subcodeRecords = [
      // USER_LEVEL 서브코드들
      {
        record_type: 'subcode',
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
        record_type: 'subcode',
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
        record_type: 'subcode',
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
      // TASK_STATUS 서브코드들
      {
        record_type: 'subcode',
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
        record_type: 'subcode',
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
      // PRIORITY 서브코드들
      {
        record_type: 'subcode',
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
        record_type: 'subcode',
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
      }
    ];

    // 모든 레코드 합치기
    const allRecords = [...groupRecords, ...subcodeRecords];

    console.log(`📝 총 ${allRecords.length}개 레코드 삽입 중...`);

    // 테이블이 존재하는지 확인
    const { data: existingData, error: checkError } = await supabase
      .from('admin_mastercode3_with_type')
      .select('id')
      .limit(1);

    if (checkError && checkError.code === 'PGRST205') {
      console.log('❌ admin_mastercode3_with_type 테이블이 존재하지 않습니다.');
      console.log('📝 Supabase 대시보드에서 수동으로 테이블을 생성해주세요.');
      console.log('');
      console.log('🛠️  테이블 생성 SQL:');
      console.log(`
CREATE TABLE admin_mastercode3_with_type (
  id SERIAL PRIMARY KEY,
  record_type VARCHAR(10) NOT NULL CHECK (record_type IN ('group', 'subcode')),
  group_code VARCHAR(50) NOT NULL,
  group_code_name VARCHAR(100) NOT NULL,
  group_code_description TEXT,
  group_code_status VARCHAR(20) DEFAULT 'active',
  group_code_order INTEGER NOT NULL DEFAULT 0,
  subcode VARCHAR(50),
  subcode_name VARCHAR(100),
  subcode_description TEXT,
  subcode_status VARCHAR(20) DEFAULT 'active',
  subcode_remark TEXT,
  subcode_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(50) DEFAULT 'admin',
  updated_by VARCHAR(50) DEFAULT 'admin'
);
`);
      return;
    }

    // 기존 데이터 삭제
    console.log('🗑️  기존 데이터 삭제 중...');
    await supabase
      .from('admin_mastercode3_with_type')
      .delete()
      .neq('id', 0); // 모든 레코드 삭제

    // 새 데이터 삽입
    const { data: insertedData, error: insertError } = await supabase
      .from('admin_mastercode3_with_type')
      .insert(allRecords)
      .select();

    if (insertError) {
      console.error('❌ 데이터 삽입 오류:', insertError);
      return;
    }

    console.log('✅ 데이터 삽입 완료!');

    // 결과 확인
    const { data: allData, error: fetchError } = await supabase
      .from('admin_mastercode3_with_type')
      .select('*')
      .order('group_code_order')
      .order('record_type', { ascending: false })
      .order('subcode_order');

    if (fetchError) {
      console.error('❌ 데이터 조회 오류:', fetchError);
      return;
    }

    console.log('\n📊 생성된 데이터:');
    let currentGroup = null;
    allData.forEach(row => {
      if (row.record_type === 'group') {
        currentGroup = row.group_code;
        console.log(`\n📁 그룹: ${row.group_code} - ${row.group_code_name} (순서: ${row.group_code_order})`);
      } else if (row.record_type === 'subcode') {
        console.log(`  ├─ [${row.id}] ${row.subcode} - ${row.subcode_name} (순서: ${row.subcode_order})`);
      }
    });

    const groupCount = allData.filter(row => row.record_type === 'group').length;
    const subcodeCount = allData.filter(row => row.record_type === 'subcode').length;

    console.log(`\n📋 요약:`);
    console.log(`  총 ${groupCount}개 그룹`);
    console.log(`  총 ${subcodeCount}개 서브코드`);
    console.log(`  총 ${allData.length}개 레코드`);

    console.log('\\n🎉 Type 필드 테이블 생성 완료!');

  } catch (error) {
    console.error('💥 오류 발생:', error);
  }
}

createTypeTable();