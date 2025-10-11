-- ========================================
-- 매출관리 (plan_sales_data) 테이블 생성
-- Supabase SQL Editor에 복사해서 실행하세요
-- ========================================

-- 1. 기존 테이블 삭제 (있을 경우)
DROP TABLE IF EXISTS plan_sales_data CASCADE;

-- 2. 테이블 생성
CREATE TABLE plan_sales_data (
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

-- 3. 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_plan_sales_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4. 트리거 생성
CREATE TRIGGER trigger_update_plan_sales_data_updated_at
  BEFORE UPDATE ON plan_sales_data
  FOR EACH ROW EXECUTE FUNCTION update_plan_sales_data_updated_at();

-- 5. 인덱스 생성
CREATE INDEX idx_plan_sales_data_code ON plan_sales_data(code);
CREATE INDEX idx_plan_sales_data_customer_name ON plan_sales_data(customer_name);
CREATE INDEX idx_plan_sales_data_business_unit ON plan_sales_data(business_unit);
CREATE INDEX idx_plan_sales_data_status ON plan_sales_data(status);
CREATE INDEX idx_plan_sales_data_registration_date ON plan_sales_data(registration_date);
CREATE INDEX idx_plan_sales_data_delivery_date ON plan_sales_data(delivery_date);

-- 6. RLS 비활성화 (개발 환경)
ALTER TABLE plan_sales_data DISABLE ROW LEVEL SECURITY;

-- 7. 샘플 데이터 삽입 (5개)
INSERT INTO plan_sales_data (
  registration_date, code, customer_name, sales_type, status, business_unit,
  model_code, item_code, item_name, quantity, unit_price, total_amount,
  team, registrant, delivery_date, notes, contract_date, assignee
) VALUES
  ('2024-08-05', 'SALES-24-001', '삼성전자', '신규', '진행', 'SI사업부', 'PRJ-2024-001', 'PROD-SEC-001', '보안솔루션 A', 10, 5000000, 50000000, '영업1팀', '김철수 팀장', '2024-12-31', '1차 계약 완료', '2024-08-01', NULL),
  ('2024-09-10', 'SALES-24-002', 'LG전자', '갱신', '대기', 'SM사업부', 'PRJ-2024-002', 'PROD-ITM-002', 'IT관리 시스템', 5, 3000000, 15000000, '영업2팀', '이영희 파트장', '2025-01-15', '견적 제출 완료', NULL, NULL),
  ('2024-10-20', 'SALES-24-003', '현대자동차', '추가', '완료', 'SI사업부', 'PRJ-2024-003', 'PROD-NET-003', '네트워크 장비', 20, 2000000, 40000000, '영업1팀', '박민수 프로', '2024-11-30', '납품 완료', '2024-10-15', '정담당'),
  ('2024-11-05', 'SALES-24-004', 'SK하이닉스', '신규', '홀딩', 'SM사업부', 'PRJ-2024-004', 'PROD-SRV-004', '서버 유지보수', 3, 8000000, 24000000, '영업2팀', '최영업 프로', '2025-02-28', '고객 검토 중', NULL, NULL),
  ('2024-12-01', 'SALES-24-005', '카카오', '갱신', '진행', 'SI사업부', 'PRJ-2024-005', 'PROD-CLD-005', '클라우드 솔루션', 15, 4000000, 60000000, '영업1팀', '강매출 파트장', '2025-03-31', '계약 협의 중', '2024-11-28', '윤담당');

-- 완료!
-- 이제 프론트엔드에서 useSupabaseSales 훅을 사용할 수 있습니다.
