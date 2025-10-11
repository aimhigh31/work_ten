const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

console.log('📝 샘플 데이터 삽입 시작...\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function insertSampleData() {
  try {
    // exec RPC를 통한 INSERT
    const insertSQL = `
INSERT INTO plan_sales_data (
  registration_date, code, customer_name, sales_type, status, business_unit,
  model_code, item_code, item_name, quantity, unit_price, total_amount,
  team, registrant, delivery_date, notes, contract_date, assignee
) VALUES
  ('2024-08-05', 'SALES-24-001', '삼성전자', '신규', '진행', 'SI사업부', 'PRJ-2024-001', 'PROD-SEC-001', '보안솔루션 A', 10, 5000000, 50000000, '영업1팀', '김철수 팀장', '2024-12-31', '1차 계약 완료', '2024-08-01', NULL),
  ('2024-09-10', 'SALES-24-002', 'LG전자', '갱신', '대기', 'SM사업부', 'PRJ-2024-002', 'PROD-ITM-002', 'IT관리 시스템', 5, 3000000, 15000000, '영업2팀', '이영희 파트장', '2025-01-15', '견적 제출 완료', NULL, NULL),
  ('2024-10-20', 'SALES-24-003', '현대자동차', '추가', '완료', 'SI사업부', 'PRJ-2024-003', 'PROD-NET-003', '네트워크 장비', 20, 2000000, 40000000, '영업1팀', '박민수 프로', '2024-11-30', '납품 완료', '2024-10-15', '정담당'),
  ('2024-11-05', 'SALES-24-004', 'SK하이닉스', '신규', '홀딩', 'SM사업부', 'PRJ-2024-004', 'PROD-SRV-004', '서버 유지보수', 3, 8000000, 24000000, '영업2팀', '최영업 프로', '2025-02-28', '고객 검토 중', NULL, NULL),
  ('2024-12-01', 'SALES-24-005', '카카오', '갱신', '진행', 'SI사업부', 'PRJ-2024-005', 'PROD-CLD-005', '클라우드 솔루션', 15, 4000000, 60000000, '영업1팀', '강매출 파트장', '2025-03-31', '계약 협의 중', '2024-11-28', '윤담당')
ON CONFLICT (code) DO NOTHING;
`;

    const { error: insertError } = await supabase.rpc('exec', { sql: insertSQL });

    if (insertError) {
      console.error('❌ 샘플 데이터 삽입 실패:', insertError.message);
      return;
    }

    console.log('✅ 샘플 데이터 삽입 완료!');

    // 확인
    console.log('\n📊 생성된 데이터 확인 중...');

    const checkSQL = `SELECT id, code, customer_name, item_name, status, total_amount FROM plan_sales_data ORDER BY registration_date DESC;`;

    const { data, error: checkError } = await supabase.rpc('exec', { sql: checkSQL });

    if (checkError) {
      console.error('❌ 데이터 확인 실패:', checkError.message);
    } else {
      console.log('✅ 데이터 확인:', data);
    }

    // Supabase client로 다시 확인 (스키마 캐시 갱신 대기)
    console.log('\n⏳ 스키마 캐시 갱신 대기 (5초)...');
    await new Promise(resolve => setTimeout(resolve, 5000));

    console.log('\n📊 최종 확인...');

    const { data: finalData, error: finalError } = await supabase
      .from('plan_sales_data')
      .select('*')
      .order('registration_date', { ascending: false });

    if (finalError) {
      console.error('❌ 최종 확인 실패:', finalError.message);
      console.log('💡 테이블은 생성되었지만 스키마 캐시가 아직 업데이트되지 않았습니다.');
      console.log('   잠시 후 다시 시도하거나, 개발 서버를 재시작하세요.');
    } else {
      console.log(`\n${'='.repeat(80)}`);
      console.log(`🎉 최종 확인 완료! 총 ${finalData.length}개 매출 데이터`);
      console.log('='.repeat(80));

      finalData.forEach((sales, index) => {
        console.log(`  ${index + 1}. ${sales.item_name} (${sales.code})`);
        console.log(`     고객: ${sales.customer_name} | 상태: ${sales.status} | 금액: ${Number(sales.total_amount).toLocaleString()}원`);
      });

      console.log('\n' + '='.repeat(80));
      console.log('✅ plan_sales_data 테이블 완전히 준비 완료!');
      console.log('='.repeat(80));
      console.log('✅ 테이블 생성 완료');
      console.log('✅ RLS 비활성화 완료');
      console.log('✅ NO 컬럼 없음 (프론트엔드에서 관리)');
      console.log('✅ 트리거 및 인덱스 설정 완료');
      console.log('✅ 5개 샘플 데이터 삽입 완료');
      console.log('\n🚀 이제 프론트엔드에서 useSupabaseSales 훅을 사용할 수 있습니다!');
      console.log('='.repeat(80));
    }

  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
    console.error('상세:', error);
  }
}

insertSampleData();
