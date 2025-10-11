const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createHardwareTableFinal() {
  console.log('🚀 it_hardware_data 테이블 최종 생성...');

  try {
    // 테이블 생성 SQL
    const createTableSQL = `
      CREATE TABLE it_hardware_data (
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
    `;

    console.log('📝 테이블 생성 중...');
    const { data: createData, error: createError } = await supabase.rpc('exec', { sql: createTableSQL });

    if (createError) {
      console.error('❌ 테이블 생성 실패:', createError);
      return;
    }
    console.log('✅ 테이블 생성 완료');

    // 샘플 데이터 삽입
    const insertSQL = `
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
       '2025-01-18', '2028-01-18', 'HP350003', '박지훈', '서버실-C301', '2025-01-20');
    `;

    console.log('📝 샘플 데이터 삽입 중...');
    const { data: insertData, error: insertError } = await supabase.rpc('exec', { sql: insertSQL });

    if (insertError) {
      console.error('❌ 샘플 데이터 삽입 실패:', insertError);
      return;
    }
    console.log('✅ 샘플 데이터 삽입 완료');

    // 확인
    const checkSQL = 'SELECT COUNT(*) as count, code, asset_name FROM it_hardware_data GROUP BY code, asset_name LIMIT 5;';
    const { data: checkData, error: checkError } = await supabase.rpc('exec', { sql: checkSQL });

    if (checkError) {
      console.error('❌ 데이터 확인 실패:', checkError);
    } else {
      console.log('📊 생성된 데이터 확인:', checkData);
    }

    console.log('🎉 it_hardware_data 테이블 생성 및 데이터 설정 완료!');

  } catch (error) {
    console.error('❌ 전체 프로세스 실패:', error);
  }
}

createHardwareTableFinal();