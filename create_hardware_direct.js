const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createHardwareTableDirect() {
  console.log('🚀 it_hardware_data 테이블 직접 생성...');

  // 단계별 SQL 실행
  const sqls = [
    // 1. 테이블 생성
    `
    CREATE TABLE IF NOT EXISTS it_hardware_data (
      id SERIAL PRIMARY KEY,
      registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
      code VARCHAR(50) UNIQUE NOT NULL,
      team VARCHAR(100),
      department VARCHAR(100),
      work_content TEXT,
      status VARCHAR(50) DEFAULT '예비',
      assignee VARCHAR(100),
      start_date DATE,
      completed_date DATE,
      attachments TEXT[],
      asset_category VARCHAR(100),
      asset_name VARCHAR(200),
      model VARCHAR(200),
      manufacturer VARCHAR(200),
      vendor VARCHAR(200),
      detail_spec TEXT,
      purchase_date DATE,
      warranty_end_date DATE,
      serial_number VARCHAR(200),
      current_user VARCHAR(100),
      location VARCHAR(200),
      images TEXT[],
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      created_by VARCHAR(100) DEFAULT 'user',
      updated_by VARCHAR(100) DEFAULT 'user'
    );
    `,
    // 2. 샘플 데이터 삽입
    `
    INSERT INTO it_hardware_data (
      code, team, department, work_content, status, assignee, start_date,
      asset_category, asset_name, model, manufacturer, vendor, detail_spec,
      purchase_date, warranty_end_date, serial_number, current_user, location, registration_date
    ) VALUES
    ('HW-25-001', '개발팀', 'IT', 'Dell OptiPlex 3090', '사용', '김민수', '2025-01-15',
     '데스크톱', 'Dell OptiPlex 3090', 'OptiPlex 3090', 'Dell', 'Dell 코리아', 'Intel Core i5-11500, 8GB RAM, 256GB SSD',
     '2025-01-10', '2028-01-10', 'DL3090001', '김민수', 'IT실-A101', '2025-01-15'),
    ('HW-25-002', '디자인팀', 'IT', 'MacBook Pro 14인치', '사용', '이영희', '2025-01-10',
     '노트북', 'MacBook Pro 14인치', 'MacBook Pro 14 (M2)', 'Apple', 'Apple 코리아', 'Apple M2, 16GB RAM, 512GB SSD',
     '2025-01-08', '2026-01-08', 'MBA14002', '이영희', '디자인실-B201', '2025-01-10'),
    ('HW-25-003', 'IT팀', 'IT', 'HP ProLiant ML350', '사용', '박지훈', '2025-01-20',
     '서버', 'HP ProLiant ML350', 'ProLiant ML350 Gen10', 'HP', 'HP 코리아', 'Intel Xeon Silver 4214, 32GB RAM, 2TB HDD',
     '2025-01-18', '2028-01-18', 'HP350003', '박지훈', '서버실-C301', '2025-01-20')
    ON CONFLICT (code) DO NOTHING;
    `
  ];

  try {
    for (let i = 0; i < sqls.length; i++) {
      console.log(`📝 단계 ${i + 1} 실행 중...`);
      const { data, error } = await supabase.rpc('exec', { sql: sqls[i] });

      if (error) {
        console.error(`❌ 단계 ${i + 1} 실패:`, error);
        return;
      }
      console.log(`✅ 단계 ${i + 1} 완료`);
    }

    // 확인
    console.log('🔍 테이블 존재 여부 확인...');
    const { data: tableCheck, error: checkError } = await supabase.rpc('exec', {
      sql: "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'it_hardware_data';"
    });

    if (checkError) {
      console.error('❌ 테이블 확인 실패:', checkError);
    } else {
      console.log('📋 테이블 확인 결과:', tableCheck);
    }

    console.log('🎉 it_hardware_data 테이블 생성 및 데이터 삽입 완료!');

  } catch (error) {
    console.error('❌ 전체 프로세스 실패:', error);
  }
}

createHardwareTableDirect();