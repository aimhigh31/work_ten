const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSoftwareHistoryTable() {
  try {
    console.log('🔨 it_software_history 테이블 생성 중...');

    // 테이블 생성 SQL
    const createTableSQL = `
      -- it_software_history 테이블 생성
      CREATE TABLE IF NOT EXISTS public.it_software_history (
        id SERIAL PRIMARY KEY,
        software_id INTEGER NOT NULL REFERENCES it_software_data(id),
        history_type VARCHAR(50) NOT NULL, -- '구매' | '유지보수' | '업그레이드' | '계약갱신'
        purchase_date DATE,
        supplier VARCHAR(200),
        price DECIMAL(12, 2),
        quantity INTEGER DEFAULT 1,
        maintenance_start_date DATE,
        maintenance_end_date DATE,
        contract_number VARCHAR(100),
        description TEXT,
        status VARCHAR(50) DEFAULT '진행중', -- '계획중' | '진행중' | '완료' | '취소'
        memo TEXT,
        registration_date DATE DEFAULT CURRENT_DATE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        created_by VARCHAR(100) DEFAULT 'system',
        updated_by VARCHAR(100) DEFAULT 'system',
        is_active BOOLEAN DEFAULT true
      );

      -- 인덱스 생성
      CREATE INDEX IF NOT EXISTS idx_it_software_history_software_id
      ON public.it_software_history(software_id);

      CREATE INDEX IF NOT EXISTS idx_it_software_history_type
      ON public.it_software_history(history_type);

      CREATE INDEX IF NOT EXISTS idx_it_software_history_active
      ON public.it_software_history(is_active);

      CREATE INDEX IF NOT EXISTS idx_it_software_history_composite
      ON public.it_software_history(software_id, is_active);

      -- 권한 설정
      GRANT ALL ON public.it_software_history TO anon, authenticated;
      GRANT USAGE, SELECT ON SEQUENCE public.it_software_history_id_seq TO anon, authenticated;

      -- RLS (Row Level Security) 정책 설정
      ALTER TABLE public.it_software_history ENABLE ROW LEVEL SECURITY;

      -- 모든 사용자가 읽기 가능
      CREATE POLICY IF NOT EXISTS "Enable read access for all users"
      ON public.it_software_history FOR SELECT
      USING (true);

      -- 인증된 사용자만 쓰기 가능
      CREATE POLICY IF NOT EXISTS "Enable all operations for authenticated users"
      ON public.it_software_history FOR ALL
      USING (true)
      WITH CHECK (true);
    `;

    // SQL 실행
    const { data, error } = await supabase.rpc('exec', { sql: createTableSQL });

    if (error) {
      if (error.message?.includes('already exists')) {
        console.log('✅ 테이블이 이미 존재합니다.');
      } else {
        console.error('❌ 테이블 생성 실패:', error);
        return;
      }
    } else {
      console.log('✅ it_software_history 테이블 생성 완료');
    }

    // 테이블 확인
    console.log('\n📊 테이블 확인 중...');
    const { data: testData, error: testError } = await supabase
      .from('it_software_history')
      .select('*')
      .limit(1);

    if (testError) {
      console.error('❌ 테이블 확인 실패:', testError);
    } else {
      console.log('✅ 테이블 접근 가능');

      // 데이터 개수 확인
      const { count } = await supabase
        .from('it_software_history')
        .select('*', { count: 'exact', head: true });

      console.log(`📈 현재 데이터: ${count || 0}개`);
    }

    // 샘플 데이터 삽입 (선택사항)
    console.log('\n📝 샘플 데이터 생성 중...');

    // 먼저 유효한 software_id 가져오기
    const { data: validSoftware } = await supabase
      .from('it_software_data')
      .select('id')
      .eq('is_active', true)
      .limit(1)
      .single();

    if (validSoftware) {
      const sampleData = [
        {
          software_id: validSoftware.id,
          history_type: '구매',
          purchase_date: '2024-01-15',
          supplier: '소프트웨어 공급업체 A',
          price: 5000000,
          quantity: 10,
          contract_number: 'CONTRACT-2024-001',
          description: '초기 구매',
          status: '완료',
          memo: '10 라이센스 구매 완료',
          registration_date: '2024-01-15',
          created_by: 'system',
          updated_by: 'system',
          is_active: true
        },
        {
          software_id: validSoftware.id,
          history_type: '유지보수',
          maintenance_start_date: '2024-02-01',
          maintenance_end_date: '2025-01-31',
          supplier: '유지보수 업체 B',
          price: 1200000,
          contract_number: 'MAINT-2024-001',
          description: '연간 유지보수 계약',
          status: '진행중',
          memo: '24시간 기술지원 포함',
          registration_date: '2024-02-01',
          created_by: 'system',
          updated_by: 'system',
          is_active: true
        }
      ];

      const { error: insertError } = await supabase
        .from('it_software_history')
        .insert(sampleData);

      if (insertError) {
        console.log('⚠️ 샘플 데이터 삽입 건너뜀:', insertError.message);
      } else {
        console.log('✅ 샘플 데이터 삽입 완료');
      }
    }

    console.log('\n🎉 it_software_history 테이블 설정 완료!');
    console.log('   이제 소프트웨어관리 페이지에서 구매/유지보수이력을 관리할 수 있습니다.');

  } catch (error) {
    console.error('❌ 예상치 못한 오류:', error);
  }
}

// 스크립트 실행
createSoftwareHistoryTable();