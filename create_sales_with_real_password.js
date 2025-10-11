const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Supabase URL에서 프로젝트 ID 추출
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const projectId = supabaseUrl ? supabaseUrl.match(/https:\/\/([^.]+)/)?.[1] : null;

// DATABASE_URL에서 비밀번호 추출
const databaseUrl = process.env.DATABASE_URL;
const passwordMatch = databaseUrl ? databaseUrl.match(/:([^@]+)@/) : null;
let password = passwordMatch ? passwordMatch[1] : null;

// URL 디코딩 (%25 -> %)
if (password) {
  password = decodeURIComponent(password);
}

console.log('🔑 프로젝트 ID:', projectId);
console.log('🔑 비밀번호 확인:', password ? '✅ 있음' : '❌ 없음');

if (!projectId || !password) {
  console.error('❌ 필요한 정보를 찾을 수 없습니다.');
  process.exit(1);
}

const client = new Client({
  host: `aws-0-ap-northeast-2.pooler.supabase.com`,
  port: 6543,
  database: 'postgres',
  user: `postgres.${projectId}`,
  password: password,
  ssl: { rejectUnauthorized: false }
});

async function createSalesTable() {
  try {
    console.log('\n🔌 Supabase Pooler에 연결 중...');
    await client.connect();
    console.log('✅ 연결 성공!\n');

    console.log('📝 1단계: plan_sales_data 테이블 생성 중...');

    // 테이블 생성
    await client.query(`
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
    `);

    console.log('✅ plan_sales_data 테이블 생성 완료!');

    // 트리거 함수 생성
    console.log('\n📝 2단계: 업데이트 트리거 생성 중...');
    await client.query(`
      CREATE OR REPLACE FUNCTION update_plan_sales_data_updated_at()
      RETURNS TRIGGER AS $$
      BEGIN
        NEW.updated_at = NOW();
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `);

    await client.query(`
      DROP TRIGGER IF EXISTS trigger_update_plan_sales_data_updated_at ON plan_sales_data;
    `);

    await client.query(`
      CREATE TRIGGER trigger_update_plan_sales_data_updated_at
        BEFORE UPDATE ON plan_sales_data
        FOR EACH ROW EXECUTE FUNCTION update_plan_sales_data_updated_at();
    `);

    console.log('✅ 업데이트 트리거 생성 완료!');

    // 인덱스 생성
    console.log('\n📝 3단계: 인덱스 생성 중...');
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_plan_sales_data_code ON plan_sales_data(code);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_plan_sales_data_customer_name ON plan_sales_data(customer_name);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_plan_sales_data_business_unit ON plan_sales_data(business_unit);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_plan_sales_data_status ON plan_sales_data(status);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_plan_sales_data_registration_date ON plan_sales_data(registration_date);
    `);
    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_plan_sales_data_delivery_date ON plan_sales_data(delivery_date);
    `);

    console.log('✅ 인덱스 6개 생성 완료!');

    // RLS 비활성화 (개발 환경)
    console.log('\n📝 4단계: RLS 비활성화 중...');
    await client.query(`
      ALTER TABLE plan_sales_data DISABLE ROW LEVEL SECURITY;
    `);

    console.log('✅ RLS 비활성화 완료!');

    // 샘플 데이터 삽입
    console.log('\n📝 5단계: 샘플 데이터 삽입 중...');

    await client.query(`
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
    `);

    console.log('✅ 샘플 데이터 5개 삽입 완료!');

    // 최종 확인
    console.log('\n📝 6단계: 생성된 데이터 확인 중...');
    const result = await client.query(`
      SELECT id, code, customer_name, item_name, status, total_amount
      FROM plan_sales_data
      ORDER BY registration_date DESC;
    `);

    console.log(`\n${'='.repeat(80)}`);
    console.log(`🎉 plan_sales_data 테이블 생성 완료! 총 ${result.rows.length}개 매출 데이터`);
    console.log('='.repeat(80));

    result.rows.forEach((sales, index) => {
      console.log(`  ${index + 1}. ${sales.item_name} (${sales.code})`);
      console.log(`     고객: ${sales.customer_name} | 상태: ${sales.status} | 금액: ${Number(sales.total_amount).toLocaleString()}원`);
    });

    console.log('\n' + '='.repeat(80));
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
  } finally {
    await client.end();
  }
}

createSalesTable();
