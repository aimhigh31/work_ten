const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function addHardwareToSoftwareTable() {
  console.log('🚀 it_software_data에 하드웨어 샘플 데이터 추가...');

  try {
    // 기존 하드웨어 데이터가 있다면 삭제
    console.log('📝 기존 하드웨어 데이터 정리...');
    const { data: deleteData, error: deleteError } = await supabase
      .from('it_software_data')
      .delete()
      .like('code', 'HW-%');

    if (deleteError) {
      console.error('❌ 기존 데이터 삭제 실패:', deleteError);
    } else {
      console.log('✅ 기존 하드웨어 데이터 정리 완료');
    }

    // 하드웨어 샘플 데이터 추가
    console.log('📝 하드웨어 샘플 데이터 추가...');
    const hardwareData = [
      {
        code: 'HW-25-001',
        team: '개발팀',
        department: 'IT',
        work_content: 'Dell OptiPlex 3090',
        status: '사용',
        assignee: '김민수',
        start_date: '2025-01-15',
        asset_category: '데스크톱',
        asset_name: 'Dell OptiPlex 3090',
        model: 'OptiPlex 3090',
        manufacturer: 'Dell',
        vendor: 'Dell 코리아',
        detail_spec: 'Intel Core i5-11500, 8GB RAM, 256GB SSD',
        purchase_date: '2025-01-10',
        warranty_end_date: '2028-01-10',
        serial_number: 'DL3090001',
        current_user: '김민수',
        location: 'IT실-A101',
        registration_date: '2025-01-15',
        is_active: true
      },
      {
        code: 'HW-25-002',
        team: '디자인팀',
        department: 'IT',
        work_content: 'MacBook Pro 14인치',
        status: '사용',
        assignee: '이영희',
        start_date: '2025-01-10',
        asset_category: '노트북',
        asset_name: 'MacBook Pro 14인치',
        model: 'MacBook Pro 14 (M2)',
        manufacturer: 'Apple',
        vendor: 'Apple 코리아',
        detail_spec: 'Apple M2, 16GB RAM, 512GB SSD',
        purchase_date: '2025-01-08',
        warranty_end_date: '2026-01-08',
        serial_number: 'MBA14002',
        current_user: '이영희',
        location: '디자인실-B201',
        registration_date: '2025-01-10',
        is_active: true
      },
      {
        code: 'HW-25-003',
        team: 'IT팀',
        department: 'IT',
        work_content: 'HP ProLiant ML350',
        status: '사용',
        assignee: '박지훈',
        start_date: '2025-01-20',
        asset_category: '서버',
        asset_name: 'HP ProLiant ML350',
        model: 'ProLiant ML350 Gen10',
        manufacturer: 'HP',
        vendor: 'HP 코리아',
        detail_spec: 'Intel Xeon Silver 4214, 32GB RAM, 2TB HDD',
        purchase_date: '2025-01-18',
        warranty_end_date: '2028-01-18',
        serial_number: 'HP350003',
        current_user: '박지훈',
        location: '서버실-C301',
        registration_date: '2025-01-20',
        is_active: true
      }
    ];

    const { data, error } = await supabase
      .from('it_software_data')
      .insert(hardwareData);

    if (error) {
      console.error('❌ 하드웨어 데이터 추가 실패:', error);
    } else {
      console.log('✅ 하드웨어 데이터 추가 성공:', data);
    }

    // 확인
    console.log('📝 추가된 하드웨어 데이터 확인...');
    const { data: checkData, error: checkError } = await supabase
      .from('it_software_data')
      .select('*')
      .like('code', 'HW-%');

    if (checkError) {
      console.error('❌ 확인 실패:', checkError);
    } else {
      console.log('📊 추가된 하드웨어 데이터:', checkData?.length + '개');
      console.log('📋 데이터 목록:', checkData?.map(d => ({ code: d.code, asset_name: d.asset_name })));
    }

    console.log('🎉 하드웨어 데이터 추가 완료!');

  } catch (error) {
    console.error('❌ 전체 프로세스 실패:', error);
  }
}

addHardwareToSoftwareTable();