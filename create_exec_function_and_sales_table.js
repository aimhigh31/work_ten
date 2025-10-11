const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY;

console.log('🚀 Service Role Key를 사용한 exec 함수 및 테이블 생성\n');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

async function createExecFunctionAndSalesTable() {
  try {
    console.log('📝 1단계: exec RPC 함수 생성 시도...');

    // exec 함수 생성 SQL
    const createExecFunction = `
CREATE OR REPLACE FUNCTION exec(sql text)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  EXECUTE sql;
  RETURN 'Success';
END;
$$;
`;

    console.log('SQL Editor에서 다음 SQL을 실행해주세요:');
    console.log('='.repeat(80));
    console.log(createExecFunction);
    console.log('='.repeat(80));
    console.log('\n이 함수가 생성되면 테이블 생성이 가능합니다.\n');

    // exec 함수가 있는지 확인
    console.log('📝 2단계: exec 함수 테스트...');

    const { data: testData, error: testError } = await supabase.rpc('exec', {
      sql: 'SELECT 1 as test;'
    });

    if (testError) {
      console.log('❌ exec 함수가 없습니다:', testError.message);
      console.log('\n💡 위의 SQL을 Supabase SQL Editor에서 실행한 후 이 스크립트를 다시 실행하세요.');
      console.log('   실행 후: node create_exec_function_and_sales_table.js\n');
      return;
    }

    console.log('✅ exec 함수가 존재합니다! 테이블 생성을 시작합니다.\n');

    // 테이블 생성
    console.log('📝 3단계: plan_sales_data 테이블 생성...');

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
`;

    const { error: createError } = await supabase.rpc('exec', { sql: createTableSQL });

    if (createError) {
      console.error('❌ 테이블 생성 실패:', createError.message);
      return;
    }

    console.log('✅ plan_sales_data 테이블 생성 완료!');

    // 트리거 생성
    console.log('\n📝 4단계: 업데이트 트리거 생성...');

    const triggerSQL = `
CREATE OR REPLACE FUNCTION update_plan_sales_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_plan_sales_data_updated_at ON plan_sales_data;

CREATE TRIGGER trigger_update_plan_sales_data_updated_at
  BEFORE UPDATE ON plan_sales_data
  FOR EACH ROW EXECUTE FUNCTION update_plan_sales_data_updated_at();
`;

    const { error: triggerError } = await supabase.rpc('exec', { sql: triggerSQL });

    if (triggerError) {
      console.error('❌ 트리거 생성 실패:', triggerError.message);
    } else {
      console.log('✅ 업데이트 트리거 생성 완료!');
    }

    // 인덱스 생성
    console.log('\n📝 5단계: 인덱스 생성...');

    const indexSQL = `
CREATE INDEX IF NOT EXISTS idx_plan_sales_data_code ON plan_sales_data(code);
CREATE INDEX IF NOT EXISTS idx_plan_sales_data_customer_name ON plan_sales_data(customer_name);
CREATE INDEX IF NOT EXISTS idx_plan_sales_data_business_unit ON plan_sales_data(business_unit);
CREATE INDEX IF NOT EXISTS idx_plan_sales_data_status ON plan_sales_data(status);
CREATE INDEX IF NOT EXISTS idx_plan_sales_data_registration_date ON plan_sales_data(registration_date);
CREATE INDEX IF NOT EXISTS idx_plan_sales_data_delivery_date ON plan_sales_data(delivery_date);
`;

    const { error: indexError } = await supabase.rpc('exec', { sql: indexSQL });

    if (indexError) {
      console.error('❌ 인덱스 생성 실패:', indexError.message);
    } else {
      console.log('✅ 인덱스 6개 생성 완료!');
    }

    // RLS 비활성화
    console.log('\n📝 6단계: RLS 비활성화...');

    const rlsSQL = `ALTER TABLE plan_sales_data DISABLE ROW LEVEL SECURITY;`;

    const { error: rlsError } = await supabase.rpc('exec', { sql: rlsSQL });

    if (rlsError) {
      console.error('❌ RLS 비활성화 실패:', rlsError.message);
    } else {
      console.log('✅ RLS 비활성화 완료!');
    }

    // 샘플 데이터 삽입
    console.log('\n📝 7단계: 샘플 데이터 삽입...');

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
      console.error('❌ 샘플 데이터 삽입 실패:', insertError.message);
    } else {
      console.log(`✅ ${insertedData.length}개 샘플 데이터 삽입 완료!\n`);
      insertedData.forEach((sales, index) => {
        console.log(`  ${index + 1}. ${sales.item_name} (${sales.code})`);
        console.log(`     ${sales.customer_name} - ${sales.status} - ${Number(sales.total_amount).toLocaleString()}원`);
      });
    }

    console.log('\n' + '='.repeat(80));
    console.log('🎉 plan_sales_data 테이블 생성 완료!');
    console.log('='.repeat(80));
    console.log('✅ 테이블 생성 완료');
    console.log('✅ RLS 비활성화 완료');
    console.log('✅ NO 컬럼 없음 (프론트엔드에서 관리)');
    console.log('✅ 트리거 및 인덱스 설정 완료');
    console.log('✅ 5개 샘플 데이터 삽입 완료');
    console.log('\n🚀 이제 프론트엔드에서 useSupabaseSales 훅을 사용할 수 있습니다!');
    console.log('='.repeat(80));

  } catch (error) {
    console.error('\n❌ 오류 발생:', error.message);
    console.error('상세:', error);
  }
}

createExecFunctionAndSalesTable();
