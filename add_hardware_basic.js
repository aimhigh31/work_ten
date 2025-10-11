const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function addBasicHardwareData() {
  console.log('🚀 it_software_data에 기본 하드웨어 데이터 추가...');

  try {
    // 1. 먼저 it_software_data 스키마 확인
    console.log('📝 it_software_data 스키마 확인...');
    const { data: schema, error: schemaError } = await supabase.rpc('exec', {
      sql: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'it_software_data'
        ORDER BY ordinal_position;
      `
    });

    if (schemaError) {
      console.error('❌ 스키마 확인 실패:', schemaError);
      return;
    }

    console.log('✅ 스키마 확인 완료');

    // 2. 기존 하드웨어 데이터 정리
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

    // 3. 기본 필드만 사용한 하드웨어 샘플 데이터 추가
    console.log('📝 기본 하드웨어 데이터 추가...');
    const basicHardwareData = [
      {
        code: 'HW-25-001',
        team: '개발팀',
        department: 'IT',
        work_content: 'Dell OptiPlex 3090 - Intel Core i5-11500, 8GB RAM, 256GB SSD',
        status: '사용',
        assignee: '김민수',
        start_date: '2025-01-15',
        registration_date: '2025-01-15',
        is_active: true
      },
      {
        code: 'HW-25-002',
        team: '디자인팀',
        department: 'IT',
        work_content: 'MacBook Pro 14인치 - Apple M2, 16GB RAM, 512GB SSD',
        status: '사용',
        assignee: '이영희',
        start_date: '2025-01-10',
        registration_date: '2025-01-10',
        is_active: true
      },
      {
        code: 'HW-25-003',
        team: 'IT팀',
        department: 'IT',
        work_content: 'HP ProLiant ML350 - Intel Xeon Silver 4214, 32GB RAM, 2TB HDD',
        status: '사용',
        assignee: '박지훈',
        start_date: '2025-01-20',
        registration_date: '2025-01-20',
        is_active: true
      }
    ];

    const { data, error } = await supabase
      .from('it_software_data')
      .insert(basicHardwareData);

    if (error) {
      console.error('❌ 하드웨어 데이터 추가 실패:', error);
      return;
    } else {
      console.log('✅ 하드웨어 데이터 추가 성공');
    }

    // 4. 확인
    console.log('📝 추가된 하드웨어 데이터 확인...');
    const { data: checkData, error: checkError } = await supabase
      .from('it_software_data')
      .select('*')
      .like('code', 'HW-%');

    if (checkError) {
      console.error('❌ 확인 실패:', checkError);
    } else {
      console.log('📊 추가된 하드웨어 데이터:', checkData?.length + '개');
      console.log('📋 데이터 목록:', checkData?.map(d => ({
        code: d.code,
        work_content: d.work_content,
        assignee: d.assignee
      })));
    }

    console.log('🎉 기본 하드웨어 데이터 추가 완료!');

  } catch (error) {
    console.error('❌ 전체 프로세스 실패:', error);
  }
}

addBasicHardwareData();