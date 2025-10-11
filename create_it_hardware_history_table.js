const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function createHardwareHistoryTable() {
  console.log('🔧 it_hardware_history 테이블 생성 시작...');

  const pool = new Pool({
    connectionString: process.env.DATABASE_URL || `postgresql://postgres:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:5432/postgres`,
    ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
  });

  try {
    // 먼저 테이블이 존재하는지 확인
    const checkTableQuery = `
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'it_hardware_history'
      );
    `;

    const { rows } = await pool.query(checkTableQuery);

    if (rows[0].exists) {
      console.log('✅ it_hardware_history 테이블이 이미 존재합니다.');
      return;
    }

    console.log('⚠️ 테이블이 존재하지 않습니다. 생성합니다...');

    // 테이블 생성 SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.it_hardware_history (
        id SERIAL PRIMARY KEY,                    -- 이력 항목 ID
        hardware_id INTEGER NOT NULL,            -- 외래키: it_hardware.id (or appropriate hardware table)
        registration_date DATE DEFAULT CURRENT_DATE,  -- 등록일
        type VARCHAR(20) NOT NULL DEFAULT 'purchase' CHECK (type IN ('purchase', 'repair', 'other')), -- 구매/수리 타입
        content TEXT,                            -- 내용
        vendor VARCHAR(200),                     -- 업체
        amount DECIMAL(15,2) DEFAULT 0,          -- 금액 (소수점 2자리)
        registrant VARCHAR(100),                 -- 등록자
        status VARCHAR(50) DEFAULT 'completed',  -- 상태
        start_date DATE,                         -- 시작일
        completion_date DATE,                    -- 완료일
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  -- 생성 시간
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),  -- 수정 시간
        created_by VARCHAR(50) DEFAULT 'system',             -- 생성자
        updated_by VARCHAR(50) DEFAULT 'system',             -- 수정자
        is_active BOOLEAN DEFAULT true,                      -- 활성 상태
        metadata JSONB                                       -- 추가 메타데이터 저장용
      );

      -- 인덱스 생성
      CREATE INDEX IF NOT EXISTS idx_it_hardware_history_hardware_id ON public.it_hardware_history(hardware_id);
      CREATE INDEX IF NOT EXISTS idx_it_hardware_history_type ON public.it_hardware_history(type);
      CREATE INDEX IF NOT EXISTS idx_it_hardware_history_registration_date ON public.it_hardware_history(registration_date);
      CREATE INDEX IF NOT EXISTS idx_it_hardware_history_is_active ON public.it_hardware_history(is_active);

      -- RLS 정책 활성화
      ALTER TABLE public.it_hardware_history ENABLE ROW LEVEL SECURITY;

      -- 모든 사용자가 읽기/쓰기 가능한 정책 (개발용)
      DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.it_hardware_history;
      CREATE POLICY "Enable all operations for authenticated users"
      ON public.it_hardware_history FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);

      -- 익명 사용자도 접근 가능한 정책 (개발용)
      DROP POLICY IF EXISTS "Enable all operations for anonymous users" ON public.it_hardware_history;
      CREATE POLICY "Enable all operations for anonymous users"
      ON public.it_hardware_history FOR ALL
      TO anon
      USING (true)
      WITH CHECK (true);

      -- 트리거 함수 생성 (updated_at 자동 업데이트)
      CREATE OR REPLACE FUNCTION update_updated_at_column()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      -- 트리거 생성
      DROP TRIGGER IF EXISTS update_it_hardware_history_updated_at ON public.it_hardware_history;
      CREATE TRIGGER update_it_hardware_history_updated_at
        BEFORE UPDATE ON public.it_hardware_history
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `;

    await pool.query(createTableSQL);
    console.log('✅ it_hardware_history 테이블 생성 완료');

    // 샘플 데이터 삽입
    const sampleDataSQL = `
      INSERT INTO public.it_hardware_history (
        hardware_id, registration_date, type, content, vendor, amount, registrant, status, start_date, completion_date
      ) VALUES
      (1, '2024-01-15', 'purchase', '노트북 구매', 'LG전자', 1500000.00, '김관리자', 'completed', '2024-01-15', '2024-01-15'),
      (1, '2024-06-20', 'repair', 'LCD 화면 교체', '컴퓨터수리센터', 300000.00, '박기술자', 'completed', '2024-06-20', '2024-06-25'),
      (1, '2024-09-10', 'repair', 'SSD 업그레이드', 'IT서비스', 250000.00, '이엔지니어', 'in_progress', '2024-09-10', NULL),
      (2, '2024-02-01', 'purchase', '데스크톱 구매', '삼성전자', 2000000.00, '김관리자', 'completed', '2024-02-01', '2024-02-01'),
      (2, '2024-08-15', 'repair', '메모리 증설', 'PC수리점', 150000.00, '최기술자', 'completed', '2024-08-15', '2024-08-16'),
      (3, '2024-03-10', 'purchase', '모니터 구매', 'Dell', 500000.00, '박관리자', 'completed', '2024-03-10', '2024-03-10')
      ON CONFLICT DO NOTHING;
    `;

    await pool.query(sampleDataSQL);
    console.log('✅ 샘플 데이터 삽입 완료');

    // 테이블 구조 확인
    const tableInfoQuery = `
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'it_hardware_history'
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;

    const result = await pool.query(tableInfoQuery);
    console.log('📊 생성된 테이블 구조:');
    console.table(result.rows);

    // 샘플 데이터 확인
    const sampleQuery = `
      SELECT
        id, hardware_id, registration_date, type, content, vendor, amount, registrant, status, start_date, completion_date
      FROM public.it_hardware_history
      ORDER BY id
      LIMIT 5;
    `;

    const sampleResult = await pool.query(sampleQuery);
    console.log('📄 샘플 데이터:');
    console.table(sampleResult.rows);

  } catch (error) {
    console.error('❌ 테이블 생성 실패:', error);
    throw error;
  } finally {
    await pool.end();
  }
}

// 실행
createHardwareHistoryTable()
  .then(() => {
    console.log('🎉 it_hardware_history 테이블 설정 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 실행 실패:', error);
    process.exit(1);
  });