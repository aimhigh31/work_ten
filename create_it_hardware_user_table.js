const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createHardwareUserTable() {
  console.log('🔧 it_hardware_user 테이블 생성 시작...');

  try {
    // 먼저 테이블이 존재하는지 확인
    const { data: existingTable, error: checkError } = await supabase
      .from('it_hardware_user')
      .select('*')
      .limit(1);

    if (!checkError) {
      console.log('✅ it_hardware_user 테이블이 이미 존재합니다.');
      return;
    }

    console.log('⚠️ 테이블이 존재하지 않습니다. 생성합니다...');

    // PostgreSQL 직접 SQL 실행
    const { Pool } = require('pg');

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || `postgresql://postgres:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:5432/postgres`,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS public.it_hardware_user (
        id SERIAL PRIMARY KEY,
        hardware_id INTEGER NOT NULL,
        user_name VARCHAR(100) NOT NULL,
        department VARCHAR(100),
        start_date DATE NOT NULL,
        end_date DATE,
        reason TEXT,
        status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
        registration_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        created_by VARCHAR(50) DEFAULT 'system',
        updated_by VARCHAR(50) DEFAULT 'system',
        is_active BOOLEAN DEFAULT true
      );

      -- 인덱스 생성
      CREATE INDEX IF NOT EXISTS idx_it_hardware_user_hardware_id ON public.it_hardware_user(hardware_id);
      CREATE INDEX IF NOT EXISTS idx_it_hardware_user_status ON public.it_hardware_user(status);
      CREATE INDEX IF NOT EXISTS idx_it_hardware_user_is_active ON public.it_hardware_user(is_active);

      -- RLS 정책 활성화
      ALTER TABLE public.it_hardware_user ENABLE ROW LEVEL SECURITY;

      -- 모든 사용자가 읽기/쓰기 가능한 정책 (개발용)
      DROP POLICY IF EXISTS "Enable all operations for authenticated users" ON public.it_hardware_user;
      CREATE POLICY "Enable all operations for authenticated users"
      ON public.it_hardware_user FOR ALL
      TO authenticated
      USING (true)
      WITH CHECK (true);

      -- 익명 사용자도 접근 가능한 정책 (개발용)
      DROP POLICY IF EXISTS "Enable all operations for anonymous users" ON public.it_hardware_user;
      CREATE POLICY "Enable all operations for anonymous users"
      ON public.it_hardware_user FOR ALL
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
      DROP TRIGGER IF EXISTS update_it_hardware_user_updated_at ON public.it_hardware_user;
      CREATE TRIGGER update_it_hardware_user_updated_at
        BEFORE UPDATE ON public.it_hardware_user
        FOR EACH ROW
        EXECUTE FUNCTION update_updated_at_column();
    `;

    await pool.query(createTableSQL);

    console.log('✅ it_hardware_user 테이블 생성 완료');

    // 샘플 데이터 삽입
    const sampleDataSQL = `
      INSERT INTO public.it_hardware_user (
        hardware_id, user_name, department, start_date, end_date, reason, status
      ) VALUES
      (1, '김개발자', 'IT팀', '2024-01-15', '2024-06-30', '부서 이동', 'inactive'),
      (1, '이기획자', '기획팀', '2024-07-01', NULL, '신규 배정', 'active'),
      (2, '박디자이너', '디자인팀', '2024-08-01', '2024-08-31', '임시 사용', 'inactive'),
      (3, '최마케터', '마케팅팀', '2024-09-01', NULL, '신규 배정', 'active')
      ON CONFLICT DO NOTHING;
    `;

    await pool.query(sampleDataSQL);
    console.log('✅ 샘플 데이터 삽입 완료');

    await pool.end();

  } catch (error) {
    console.error('❌ 테이블 생성 실패:', error);
    throw error;
  }
}

// 실행
createHardwareUserTable()
  .then(() => {
    console.log('🎉 it_hardware_user 테이블 설정 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 실행 실패:', error);
    process.exit(1);
  });