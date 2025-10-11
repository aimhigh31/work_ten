const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function createHardwareTable() {
  console.log('🚀 it_hardware_data 테이블 생성 시작...');

  const createTableSQL = `
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
      attachments TEXT[], -- 첨부파일 배열

      -- 하드웨어 특화 필드
      asset_category VARCHAR(100), -- 자산 분류 (데스크톱, 노트북, 서버 등)
      asset_name VARCHAR(200), -- 자산명
      model VARCHAR(200), -- 모델명
      manufacturer VARCHAR(200), -- 제조사
      vendor VARCHAR(200), -- 공급업체
      detail_spec TEXT, -- 상세 스펙
      purchase_date DATE, -- 구매일
      warranty_end_date DATE, -- 보증 종료일
      serial_number VARCHAR(200), -- 시리얼 번호
      current_user VARCHAR(100), -- 현재 사용자
      location VARCHAR(200), -- 위치/장소
      images TEXT[], -- 이미지 파일 배열

      -- 시스템 필드
      is_active BOOLEAN DEFAULT true,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
      created_by VARCHAR(100) DEFAULT 'user',
      updated_by VARCHAR(100) DEFAULT 'user'
    );

    -- 인덱스 생성
    CREATE INDEX IF NOT EXISTS idx_hardware_code ON it_hardware_data(code);
    CREATE INDEX IF NOT EXISTS idx_hardware_status ON it_hardware_data(status);
    CREATE INDEX IF NOT EXISTS idx_hardware_assignee ON it_hardware_data(assignee);
    CREATE INDEX IF NOT EXISTS idx_hardware_current_user ON it_hardware_data(current_user);
    CREATE INDEX IF NOT EXISTS idx_hardware_category ON it_hardware_data(asset_category);
    CREATE INDEX IF NOT EXISTS idx_hardware_active ON it_hardware_data(is_active);

    -- 코드 시퀀스 생성을 위한 함수
    CREATE OR REPLACE FUNCTION generate_hardware_code()
    RETURNS TEXT AS $$
    DECLARE
        current_year TEXT;
        sequence_num INTEGER;
        formatted_seq TEXT;
    BEGIN
        -- 현재 연도 구하기 (YY 형식)
        current_year := to_char(CURRENT_DATE, 'YY');

        -- 해당 연도의 최대 시퀀스 번호 구하기
        SELECT COALESCE(MAX(CAST(SUBSTRING(code FROM 'HW-' || current_year || '-(\\\d+)') AS INTEGER)), 0) + 1
        INTO sequence_num
        FROM it_hardware_data
        WHERE code LIKE 'HW-' || current_year || '-%';

        -- 3자리 포맷으로 변환
        formatted_seq := LPAD(sequence_num::TEXT, 3, '0');

        RETURN 'HW-' || current_year || '-' || formatted_seq;
    END;
    $$ LANGUAGE plpgsql;

    -- 업데이트 시간 자동 업데이트 트리거
    CREATE OR REPLACE FUNCTION update_hardware_updated_at()
    RETURNS TRIGGER AS $$
    BEGIN
        NEW.updated_at = CURRENT_TIMESTAMP;
        RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- 트리거 생성
    DROP TRIGGER IF EXISTS trigger_update_hardware_updated_at ON it_hardware_data;
    CREATE TRIGGER trigger_update_hardware_updated_at
        BEFORE UPDATE ON it_hardware_data
        FOR EACH ROW
        EXECUTE FUNCTION update_hardware_updated_at();
  `;

  try {
    const { data, error } = await supabase.rpc('exec', { sql: createTableSQL });

    if (error) {
      console.error('❌ 테이블 생성 실패:', error);
      process.exit(1);
    }

    console.log('✅ it_hardware_data 테이블 생성 완료');

    // 샘플 데이터 삽입
    console.log('📝 샘플 데이터 삽입 시작...');

    const sampleData = [
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
        registration_date: '2025-01-15'
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
        registration_date: '2025-01-10'
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
        registration_date: '2025-01-20'
      }
    ];

    for (const data of sampleData) {
      const { error: insertError } = await supabase
        .from('it_hardware_data')
        .insert(data);

      if (insertError) {
        console.error('❌ 샘플 데이터 삽입 실패:', insertError);
      } else {
        console.log(`✅ 샘플 데이터 삽입 성공: ${data.code}`);
      }
    }

    console.log('🎉 it_hardware_data 테이블 및 데이터 설정 완료!');

  } catch (error) {
    console.error('❌ 전체 프로세스 실패:', error);
    process.exit(1);
  }
}

createHardwareTable();