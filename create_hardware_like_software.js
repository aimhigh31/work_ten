const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createHardwareLikeSoftware() {
  console.log('🚀 it_software_data를 참고하여 it_hardware_data 테이블 생성...');

  try {
    // 1. 기존 테이블 삭제 (존재한다면)
    console.log('📝 기존 테이블 삭제...');
    await supabase.rpc('exec', {
      sql: "DROP TABLE IF EXISTS it_hardware_data CASCADE;"
    });

    // 2. it_software_data 구조 참조하여 새 테이블 생성
    console.log('📝 it_software_data 구조 확인...');
    const { data: softwareSchema, error: schemaError } = await supabase.rpc('exec', {
      sql: `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'it_software_data'
        ORDER BY ordinal_position;
      `
    });

    if (schemaError) {
      console.error('❌ 소프트웨어 테이블 스키마 확인 실패:', schemaError);
      return;
    }

    console.log('✅ 소프트웨어 테이블 스키마:', softwareSchema);

    // 3. 하드웨어 테이블 생성 (소프트웨어와 동일한 패턴)
    console.log('📝 하드웨어 테이블 생성...');
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

        -- 하드웨어 특화 필드
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

        -- 시스템 필드 (소프트웨어와 동일)
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100) DEFAULT 'user',
        updated_by VARCHAR(100) DEFAULT 'user'
      );
    `;

    const { data: createData, error: createError } = await supabase.rpc('exec', {
      sql: createTableSQL
    });

    if (createError) {
      console.error('❌ 테이블 생성 실패:', createError);
      return;
    }
    console.log('✅ 테이블 생성 완료');

    // 4. 권한 설정 (소프트웨어와 동일)
    console.log('📝 권한 설정...');
    await supabase.rpc('exec', {
      sql: `
        GRANT ALL ON it_hardware_data TO authenticated;
        GRANT ALL ON it_hardware_data TO anon;
        GRANT ALL ON it_hardware_data TO service_role;
        GRANT USAGE, SELECT ON SEQUENCE it_hardware_data_id_seq TO authenticated;
        GRANT USAGE, SELECT ON SEQUENCE it_hardware_data_id_seq TO anon;
        GRANT USAGE, SELECT ON SEQUENCE it_hardware_data_id_seq TO service_role;
      `
    });

    // 5. RLS 정책 설정 (소프트웨어와 동일)
    console.log('📝 RLS 정책 설정...');
    await supabase.rpc('exec', {
      sql: `
        ALTER TABLE it_hardware_data ENABLE ROW LEVEL SECURITY;

        CREATE POLICY "authenticated_all_access" ON it_hardware_data
        FOR ALL TO authenticated USING (true) WITH CHECK (true);

        CREATE POLICY "anon_select_access" ON it_hardware_data
        FOR SELECT TO anon USING (true);
      `
    });

    // 6. 샘플 데이터 삽입
    console.log('📝 샘플 데이터 삽입...');
    await supabase.rpc('exec', {
      sql: `
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
    });

    console.log('✅ 샘플 데이터 삽입 완료');

    // 7. 최종 확인
    console.log('📝 테이블 생성 확인...');
    const { data: checkData, error: checkError } = await supabase.rpc('exec', {
      sql: "SELECT COUNT(*) as count FROM it_hardware_data;"
    });

    if (checkError) {
      console.error('❌ 확인 실패:', checkError);
    } else {
      console.log('📊 생성된 데이터 개수:', checkData);
    }

    console.log('🎉 it_hardware_data 테이블 생성 완료!');

  } catch (error) {
    console.error('❌ 전체 프로세스 실패:', error);
  }
}

createHardwareLikeSoftware();