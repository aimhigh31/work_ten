const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Service role key를 사용하여 관리자 권한으로 접근
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createHardwareTableDirect() {
  console.log('🚀 it_hardware_data 테이블 직접 생성 (관리자 권한)...');

  try {
    // 1. 기존 테이블 완전 삭제
    console.log('📝 기존 테이블 완전 삭제...');
    const dropResult = await supabase.rpc('exec', {
      sql: `
        DROP TABLE IF EXISTS it_hardware_data CASCADE;
        DROP SEQUENCE IF EXISTS it_hardware_data_id_seq CASCADE;
      `
    });

    if (dropResult.error) {
      console.log('⚠️ 기존 테이블 삭제:', dropResult.error.message);
    } else {
      console.log('✅ 기존 테이블 삭제 완료');
    }

    // 2. 새 테이블 생성
    console.log('📝 새 테이블 생성...');
    const createResult = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE it_hardware_data (
          id BIGSERIAL PRIMARY KEY,
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

          -- 시스템 필드
          is_active BOOLEAN DEFAULT true,
          created_at TIMESTAMPTZ DEFAULT NOW(),
          updated_at TIMESTAMPTZ DEFAULT NOW(),
          created_by VARCHAR(100) DEFAULT 'user',
          updated_by VARCHAR(100) DEFAULT 'user'
        );
      `
    });

    if (createResult.error) {
      console.error('❌ 테이블 생성 실패:', createResult.error);
      return;
    }
    console.log('✅ 테이블 생성 완료');

    // 3. 권한 설정
    console.log('📝 권한 설정...');
    const permissionResult = await supabase.rpc('exec', {
      sql: `
        -- 모든 역할에 테이블 권한 부여
        GRANT ALL ON TABLE it_hardware_data TO authenticated;
        GRANT ALL ON TABLE it_hardware_data TO anon;
        GRANT ALL ON TABLE it_hardware_data TO service_role;
        GRANT ALL ON TABLE it_hardware_data TO postgres;

        -- 시퀀스 권한 부여
        GRANT ALL ON SEQUENCE it_hardware_data_id_seq TO authenticated;
        GRANT ALL ON SEQUENCE it_hardware_data_id_seq TO anon;
        GRANT ALL ON SEQUENCE it_hardware_data_id_seq TO service_role;
        GRANT ALL ON SEQUENCE it_hardware_data_id_seq TO postgres;
      `
    });

    if (permissionResult.error) {
      console.error('❌ 권한 설정 실패:', permissionResult.error);
    } else {
      console.log('✅ 권한 설정 완료');
    }

    // 4. RLS 정책 설정
    console.log('📝 RLS 정책 설정...');
    const rlsResult = await supabase.rpc('exec', {
      sql: `
        -- RLS 활성화
        ALTER TABLE it_hardware_data ENABLE ROW LEVEL SECURITY;

        -- 정책 삭제 (존재한다면)
        DROP POLICY IF EXISTS "authenticated_all_access" ON it_hardware_data;
        DROP POLICY IF EXISTS "anon_select_access" ON it_hardware_data;
        DROP POLICY IF EXISTS "public_access" ON it_hardware_data;

        -- 새 정책 생성
        CREATE POLICY "public_access" ON it_hardware_data
        FOR ALL USING (true) WITH CHECK (true);
      `
    });

    if (rlsResult.error) {
      console.error('❌ RLS 정책 설정 실패:', rlsResult.error);
    } else {
      console.log('✅ RLS 정책 설정 완료');
    }

    // 5. 샘플 데이터 삽입
    console.log('📝 샘플 데이터 삽입...');
    const insertResult = await supabase.rpc('exec', {
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

    if (insertResult.error) {
      console.error('❌ 샘플 데이터 삽입 실패:', insertResult.error);
    } else {
      console.log('✅ 샘플 데이터 삽입 완료');
    }

    // 6. 테이블 존재 확인
    console.log('📝 테이블 존재 확인...');
    const checkResult = await supabase.rpc('exec', {
      sql: `
        SELECT
          table_name,
          table_schema,
          (SELECT COUNT(*) FROM it_hardware_data) as row_count
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'it_hardware_data';
      `
    });

    if (checkResult.error) {
      console.error('❌ 테이블 확인 실패:', checkResult.error);
    } else {
      console.log('📊 테이블 확인 결과:', checkResult.data);
    }

    // 7. REST API 테스트
    console.log('📝 REST API 테스트...');
    // 잠깐 기다린 후 테스트 (스키마 캐시 업데이트 대기)
    await new Promise(resolve => setTimeout(resolve, 2000));

    const { data: testData, error: testError } = await supabase
      .from('it_hardware_data')
      .select('*')
      .limit(1);

    if (testError) {
      console.error('❌ REST API 테스트 실패:', testError);
    } else {
      console.log('✅ REST API 테스트 성공:', testData?.length + '개 데이터 조회');
    }

    console.log('🎉 it_hardware_data 테이블 생성 및 설정 완료!');

  } catch (error) {
    console.error('❌ 전체 프로세스 실패:', error);
  }
}

createHardwareTableDirect();