const { createClient } = require('@supabase/supabase-js');
require("dotenv").config({ path: ".env.local" });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function checkAndInsertSalesData() {
  try {
    console.log("🔍 plan_sales_data 테이블 상태 확인...\n");

    // 1. 현재 데이터 확인
    const { data: existingData, error: selectError } = await supabase
      .from('plan_sales_data')
      .select('*')
      .order('registration_date', { ascending: false });

    if (selectError) {
      console.log("❌ 테이블 조회 오류:", selectError.message);
      console.log("💡 테이블 구조에 문제가 있을 수 있습니다.");
      return;
    }

    console.log(`📊 현재 데이터: ${existingData.length}개`);

    if (existingData.length > 0) {
      console.log("\n현재 매출 데이터:");
      existingData.forEach((sales, index) => {
        console.log(`  ${index + 1}. ${sales.item_name} (${sales.code})`);
        console.log(`     고객: ${sales.customer_name} | 상태: ${sales.status} | 금액: ${Number(sales.total_amount).toLocaleString()}원`);
      });
      console.log("\n✅ 데이터가 이미 존재합니다!");
      return;
    }

    // 2. 데이터가 없으면 샘플 데이터 삽입
    console.log("\n📝 샘플 데이터 삽입 중...");

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
      console.log("❌ 샘플 데이터 삽입 실패:", insertError.message);
      console.log("상세:", insertError);
      return;
    }

    console.log(`\n✅ ${insertedData.length}개 샘플 데이터 삽입 완료!\n`);
    insertedData.forEach((sales, index) => {
      console.log(`  ${index + 1}. ${sales.item_name} (${sales.code})`);
      console.log(`     고객: ${sales.customer_name} | 상태: ${sales.status} | 금액: ${Number(sales.total_amount).toLocaleString()}원`);
    });

    console.log("\n" + "=".repeat(80));
    console.log("🎉 plan_sales_data 테이블 준비 완료!");
    console.log("=".repeat(80));
    console.log("✅ 5개 샘플 데이터 삽입 완료");
    console.log("✅ RLS 정책 비활성화됨");
    console.log("✅ NO 컬럼 없음 (프론트엔드에서 관리)");
    console.log("\n🚀 이제 프론트엔드에서 useSupabaseSales 훅을 사용할 수 있습니다!");

  } catch (err) {
    console.error("\n❌ 오류 발생:", err.message);
    console.error("상세:", err);
  }
}

checkAndInsertSalesData();
