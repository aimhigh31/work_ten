const { createClient } = require('@supabase/supabase-js');
require("dotenv").config({ path: ".env.local" });

// Supabase 클라이언트 생성
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error("❌ Supabase 환경변수가 설정되지 않았습니다.");
  console.error("NEXT_PUBLIC_SUPABASE_URL:", supabaseUrl ? "✓" : "✗");
  console.error("NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY:", supabaseServiceKey ? "✓" : "✗");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function createSalesDataTable() {
  try {
    console.log("🚀 plan_sales_data 테이블 생성 시작...");
    console.log("📍 Supabase URL:", supabaseUrl);

    // 1. 테이블 생성 SQL
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS plan_sales_data (
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
      );

      -- 인덱스 생성
      CREATE INDEX IF NOT EXISTS idx_plan_sales_data_code ON plan_sales_data(code);
      CREATE INDEX IF NOT EXISTS idx_plan_sales_data_customer_name ON plan_sales_data(customer_name);
      CREATE INDEX IF NOT EXISTS idx_plan_sales_data_business_unit ON plan_sales_data(business_unit);
      CREATE INDEX IF NOT EXISTS idx_plan_sales_data_status ON plan_sales_data(status);
      CREATE INDEX IF NOT EXISTS idx_plan_sales_data_registration_date ON plan_sales_data(registration_date);
      CREATE INDEX IF NOT EXISTS idx_plan_sales_data_delivery_date ON plan_sales_data(delivery_date);

      -- 업데이트 트리거 생성
      CREATE OR REPLACE FUNCTION update_plan_sales_data_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ language 'plpgsql';

      DROP TRIGGER IF EXISTS trigger_update_plan_sales_data_updated_at ON plan_sales_data;
      CREATE TRIGGER trigger_update_plan_sales_data_updated_at
        BEFORE UPDATE ON plan_sales_data
        FOR EACH ROW EXECUTE FUNCTION update_plan_sales_data_updated_at();

      -- RLS 비활성화 (개발 중)
      ALTER TABLE plan_sales_data DISABLE ROW LEVEL SECURITY;
    `;

    const { error: createError } = await supabase.rpc('exec_sql', { sql: createTableSQL });

    if (createError) {
      console.log("⚠️  exec_sql RPC가 없거나 오류 발생:", createError.message);
      console.log("📝 대신 직접 INSERT를 통해 샘플 데이터만 추가합니다...");
    } else {
      console.log("✅ plan_sales_data 테이블 생성 완료");
    }

    // 2. 기존 데이터 확인
    const { data: existingData, error: countError } = await supabase
      .from('plan_sales_data')
      .select('*', { count: 'exact', head: true });

    if (countError) {
      console.log("⚠️  테이블 확인 중 오류:", countError.message);
      console.log("💡 테이블이 아직 생성되지 않았을 수 있습니다. SQL 스크립트를 직접 실행해주세요:");
      console.log("\n" + "=".repeat(80));
      console.log("다음 SQL을 Supabase SQL Editor에서 실행하세요:");
      console.log("=".repeat(80));
      console.log(createTableSQL);
      console.log("=".repeat(80) + "\n");
      return;
    }

    const existingCount = existingData?.length || 0;

    if (existingCount === 0) {
      console.log("📝 샘플 매출 데이터 생성 중...");

      // 샘플 데이터 삽입
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

      const { data: insertedData, error: insertError } = await supabase
        .from('plan_sales_data')
        .insert(sampleData)
        .select();

      if (insertError) {
        console.error("❌ 샘플 데이터 삽입 오류:", insertError.message);
        return;
      }

      console.log(`✅ ${insertedData.length}개 샘플 매출 데이터 생성 완료`);
      insertedData.forEach((sales) => {
        console.log(`  - ${sales.item_name} (${sales.code}) - ${sales.customer_name} - ${sales.status}`);
      });
    } else {
      console.log(`📊 기존 매출 데이터 ${existingCount}개 발견, 샘플 데이터 삽입 생략`);
    }

    // 3. 최종 확인
    const { data: finalData, error: finalError } = await supabase
      .from('plan_sales_data')
      .select('id, code, customer_name, item_name, status, total_amount')
      .order('registration_date', { ascending: false });

    if (finalError) {
      console.error("❌ 최종 확인 오류:", finalError.message);
      return;
    }

    console.log(`\n🎉 plan_sales_data 테이블 설정 완료! 총 ${finalData.length}개 매출 데이터:`);
    finalData.forEach((sales, index) => {
      console.log(`  ${index + 1}. ${sales.item_name} (${sales.code}) - ${sales.customer_name} - ${sales.status} - ${sales.total_amount.toLocaleString()}원`);
    });

  } catch (err) {
    console.error("❌ 오류 발생:", err);
    console.error("상세 오류:", err.message);
  }
}

createSalesDataTable();
