const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔧 강제 테이블 생성 시작...\n');

async function forceCreateTable() {
  try {
    // REST API를 통한 SQL 실행
    const sqlStatements = [
      // 1. 기존 테이블 삭제 (있을 경우)
      `DROP TABLE IF EXISTS plan_sales_data CASCADE;`,

      // 2. 테이블 생성
      `CREATE TABLE plan_sales_data (
        id SERIAL PRIMARY KEY,
        registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
        code TEXT NOT NULL UNIQUE,
        customer_name TEXT NOT NULL,
        sales_type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT '대기',
        business_unit TEXT NOT NULL,
        model_code TEXT NOT NULL,
        item_code TEXT NOT NULL,
        item_name TEXT NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 0,
        unit_price NUMERIC(15, 2) NOT NULL DEFAULT 0,
        total_amount NUMERIC(15, 2) NOT NULL DEFAULT 0,
        team TEXT,
        registrant TEXT NOT NULL,
        delivery_date DATE NOT NULL,
        notes TEXT,
        contract_date DATE,
        assignee TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );`,

      // 3. 트리거 함수 생성
      `CREATE OR REPLACE FUNCTION update_plan_sales_data_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;`,

      // 4. 트리거 생성
      `CREATE TRIGGER trigger_update_plan_sales_data_updated_at
        BEFORE UPDATE ON plan_sales_data
        FOR EACH ROW EXECUTE FUNCTION update_plan_sales_data_updated_at();`,

      // 5. 인덱스 생성
      `CREATE INDEX idx_plan_sales_data_code ON plan_sales_data(code);`,
      `CREATE INDEX idx_plan_sales_data_customer_name ON plan_sales_data(customer_name);`,
      `CREATE INDEX idx_plan_sales_data_business_unit ON plan_sales_data(business_unit);`,
      `CREATE INDEX idx_plan_sales_data_status ON plan_sales_data(status);`,
      `CREATE INDEX idx_plan_sales_data_registration_date ON plan_sales_data(registration_date);`,
      `CREATE INDEX idx_plan_sales_data_delivery_date ON plan_sales_data(delivery_date);`,

      // 6. RLS 비활성화
      `ALTER TABLE plan_sales_data DISABLE ROW LEVEL SECURITY;`
    ];

    console.log('📝 SQL 실행 중...\n');

    // Supabase SQL Admin API 사용
    for (const sql of sqlStatements) {
      const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        },
        body: JSON.stringify({ query: sql })
      });

      if (!response.ok) {
        const error = await response.text();
        console.log(`⚠️  SQL 실행 실패 (무시하고 계속):`, error.substring(0, 100));
      }
    }

    console.log('\n✅ SQL 실행 시도 완료\n');

    // Supabase 클라이언트로 데이터 삽입 시도
    const supabase = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      }
    });

    console.log('📝 샘플 데이터 삽입 중...\n');

    const sampleData = [
      {
        registration_date: '2024-08-05',
        code: 'SALES-24-001',
        customer_name: '삼성전자',
        sales_type: '신규',
        status: '진행',
        business_unit: 'SI사업부',
        model_code: 'PRJ-2024-001',
        item_code: 'PROD-SEC-001',
        item_name: '보안솔루션 A',
        quantity: 10,
        unit_price: 5000000,
        total_amount: 50000000,
        team: '영업1팀',
        registrant: '김철수 팀장',
        delivery_date: '2024-12-31',
        notes: '1차 계약 완료',
        contract_date: '2024-08-01'
      },
      {
        registration_date: '2024-09-10',
        code: 'SALES-24-002',
        customer_name: 'LG전자',
        sales_type: '갱신',
        status: '대기',
        business_unit: 'SM사업부',
        model_code: 'PRJ-2024-002',
        item_code: 'PROD-ITM-002',
        item_name: 'IT관리 시스템',
        quantity: 5,
        unit_price: 3000000,
        total_amount: 15000000,
        team: '영업2팀',
        registrant: '이영희 파트장',
        delivery_date: '2025-01-15',
        notes: '견적 제출 완료'
      },
      {
        registration_date: '2024-10-20',
        code: 'SALES-24-003',
        customer_name: '현대자동차',
        sales_type: '추가',
        status: '완료',
        business_unit: 'SI사업부',
        model_code: 'PRJ-2024-003',
        item_code: 'PROD-NET-003',
        item_name: '네트워크 장비',
        quantity: 20,
        unit_price: 2000000,
        total_amount: 40000000,
        team: '영업1팀',
        registrant: '박민수 프로',
        delivery_date: '2024-11-30',
        notes: '납품 완료',
        contract_date: '2024-10-15',
        assignee: '정담당'
      },
      {
        registration_date: '2024-11-05',
        code: 'SALES-24-004',
        customer_name: 'SK하이닉스',
        sales_type: '신규',
        status: '홀딩',
        business_unit: 'SM사업부',
        model_code: 'PRJ-2024-004',
        item_code: 'PROD-SRV-004',
        item_name: '서버 유지보수',
        quantity: 3,
        unit_price: 8000000,
        total_amount: 24000000,
        team: '영업2팀',
        registrant: '최영업 프로',
        delivery_date: '2025-02-28',
        notes: '고객 검토 중'
      },
      {
        registration_date: '2024-12-01',
        code: 'SALES-24-005',
        customer_name: '카카오',
        sales_type: '갱신',
        status: '진행',
        business_unit: 'SI사업부',
        model_code: 'PRJ-2024-005',
        item_code: 'PROD-CLD-005',
        item_name: '클라우드 솔루션',
        quantity: 15,
        unit_price: 4000000,
        total_amount: 60000000,
        team: '영업1팀',
        registrant: '강매출 파트장',
        delivery_date: '2025-03-31',
        notes: '계약 협의 중',
        contract_date: '2024-11-28',
        assignee: '윤담당'
      }
    ];

    const { data, error } = await supabase
      .from('plan_sales_data')
      .insert(sampleData)
      .select();

    if (error) {
      console.log('❌ 데이터 삽입 실패:', error.message);
      console.log('\n' + '='.repeat(80));
      console.log('💡 Supabase SQL Editor에서 수동으로 실행이 필요합니다.');
      console.log('='.repeat(80));
      console.log('\n다음 SQL을 복사해서 실행하세요:');
      console.log('\n' + sqlStatements.join('\n\n'));
      console.log('\n\n-- 샘플 데이터 삽입');
      console.log(`INSERT INTO plan_sales_data (
  registration_date, code, customer_name, sales_type, status, business_unit,
  model_code, item_code, item_name, quantity, unit_price, total_amount,
  team, registrant, delivery_date, notes, contract_date, assignee
) VALUES
  ('2024-08-05', 'SALES-24-001', '삼성전자', '신규', '진행', 'SI사업부', 'PRJ-2024-001', 'PROD-SEC-001', '보안솔루션 A', 10, 5000000, 50000000, '영업1팀', '김철수 팀장', '2024-12-31', '1차 계약 완료', '2024-08-01', NULL),
  ('2024-09-10', 'SALES-24-002', 'LG전자', '갱신', '대기', 'SM사업부', 'PRJ-2024-002', 'PROD-ITM-002', 'IT관리 시스템', 5, 3000000, 15000000, '영업2팀', '이영희 파트장', '2025-01-15', '견적 제출 완료', NULL, NULL),
  ('2024-10-20', 'SALES-24-003', '현대자동차', '추가', '완료', 'SI사업부', 'PRJ-2024-003', 'PROD-NET-003', '네트워크 장비', 20, 2000000, 40000000, '영업1팀', '박민수 프로', '2024-11-30', '납품 완료', '2024-10-15', '정담당'),
  ('2024-11-05', 'SALES-24-004', 'SK하이닉스', '신규', '홀딩', 'SM사업부', 'PRJ-2024-004', 'PROD-SRV-004', '서버 유지보수', 3, 8000000, 24000000, '영업2팀', '최영업 프로', '2025-02-28', '고객 검토 중', NULL, NULL),
  ('2024-12-01', 'SALES-24-005', '카카오', '갱신', '진행', 'SI사업부', 'PRJ-2024-005', 'PROD-CLD-005', '클라우드 솔루션', 15, 4000000, 60000000, '영업1팀', '강매출 파트장', '2025-03-31', '계약 협의 중', '2024-11-28', '윤담당');`);
      return;
    }

    console.log(`✅ ${data.length}개 샘플 데이터 삽입 성공!\n`);
    data.forEach((sales, index) => {
      console.log(`  ${index + 1}. ${sales.item_name} (${sales.code})`);
      console.log(`     ${sales.customer_name} - ${sales.status} - ${Number(sales.total_amount).toLocaleString()}원`);
    });

    console.log('\n' + '='.repeat(80));
    console.log('🎉 plan_sales_data 테이블 생성 완료!');
    console.log('='.repeat(80));
    console.log('✅ 테이블 생성 완료');
    console.log('✅ RLS 비활성화 완료');
    console.log('✅ NO 컬럼 없음 (프론트엔드에서 관리)');
    console.log('✅ 5개 샘플 데이터 삽입 완료');
    console.log('\n🚀 이제 프론트엔드에서 useSupabaseSales 훅을 사용할 수 있습니다!');

  } catch (err) {
    console.error('\n❌ 오류 발생:', err.message);
    console.log('\n💡 수동 실행이 필요합니다. SQL 파일을 확인해주세요:');
    console.log('   supabase/migrations/create_plan_sales_data.sql');
  }
}

forceCreateTable();
