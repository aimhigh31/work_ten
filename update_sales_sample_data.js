const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

console.log('🔄 매출 샘플 데이터 업데이트 시작...\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function updateSampleData() {
  try {
    // 기존 데이터 삭제
    console.log('🗑️  기존 샘플 데이터 삭제...');
    const { error: deleteError } = await supabase
      .from('plan_sales_data')
      .delete()
      .in('code', ['SALES-24-001', 'SALES-24-002', 'SALES-24-003', 'SALES-24-004', 'SALES-24-005']);

    if (deleteError) {
      console.error('❌ 삭제 실패:', deleteError.message);
    } else {
      console.log('✅ 기존 데이터 삭제 완료\n');
    }

    // 마스터코드에 맞는 새로운 샘플 데이터 삽입
    console.log('📝 마스터코드에 맞는 새 샘플 데이터 삽입...');

    const newSampleData = [
      {
        registration_date: '2024-08-05',
        code: 'SALES-24-001',
        customer_name: '삼성전자',
        sales_type: '개발',
        status: '진행',
        business_unit: '전기차배터리',
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
        contract_date: '2024-08-01',
        assignee: null
      },
      {
        registration_date: '2024-09-10',
        code: 'SALES-24-002',
        customer_name: 'LG전자',
        sales_type: '양산',
        status: '대기',
        business_unit: '수소연료전지',
        model_code: 'PRJ-2024-002',
        item_code: 'PROD-ITM-002',
        item_name: 'IT관리 시스템',
        quantity: 5,
        unit_price: 3000000,
        total_amount: 15000000,
        team: '영업2팀',
        registrant: '이영희 파트장',
        delivery_date: '2025-01-15',
        notes: '견적 제출 완료',
        contract_date: null,
        assignee: null
      },
      {
        registration_date: '2024-10-20',
        code: 'SALES-24-003',
        customer_name: '현대차',
        sales_type: '상품',
        status: '완료',
        business_unit: '폴더블',
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
        customer_name: '현대제철',
        sales_type: '설비',
        status: '홀딩',
        business_unit: '전기차배터리',
        model_code: 'PRJ-2024-004',
        item_code: 'PROD-SRV-004',
        item_name: '서버 유지보수',
        quantity: 3,
        unit_price: 8000000,
        total_amount: 24000000,
        team: '영업2팀',
        registrant: '최영업 프로',
        delivery_date: '2025-02-28',
        notes: '고객 검토 중',
        contract_date: null,
        assignee: null
      },
      {
        registration_date: '2024-12-01',
        code: 'SALES-24-005',
        customer_name: '삼성전자',
        sales_type: '기타33',
        status: '진행',
        business_unit: '기타2',
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

    const { data, error: insertError } = await supabase
      .from('plan_sales_data')
      .insert(newSampleData)
      .select();

    if (insertError) {
      console.error('❌ 삽입 실패:', insertError.message);
      return;
    }

    console.log(`✅ ${data.length}개 새 샘플 데이터 삽입 완료!\n`);

    // 최종 확인
    console.log('📊 업데이트된 데이터 확인...\n');
    const { data: finalData, error: checkError } = await supabase
      .from('plan_sales_data')
      .select('*')
      .order('registration_date', { ascending: false });

    if (checkError) {
      console.error('❌ 확인 실패:', checkError.message);
      return;
    }

    console.log('='.repeat(80));
    console.log(`🎉 총 ${finalData.length}개 매출 데이터`);
    console.log('='.repeat(80));

    finalData.forEach((sales, index) => {
      console.log(`${index + 1}. ${sales.item_name} (${sales.code})`);
      console.log(`   사업부: ${sales.business_unit} | 고객: ${sales.customer_name} | 판매유형: ${sales.sales_type}`);
      console.log(`   상태: ${sales.status} | 금액: ${Number(sales.total_amount).toLocaleString()}원`);
      console.log('');
    });

    console.log('='.repeat(80));
    console.log('✅ 마스터코드 호환 샘플 데이터 업데이트 완료!');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
    console.error('상세:', error);
  }
}

updateSampleData();
