-- 매출관리 테이블 생성
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

-- 업데이트 시 updated_at 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_plan_sales_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_plan_sales_data_updated_at
BEFORE UPDATE ON plan_sales_data
FOR EACH ROW
EXECUTE FUNCTION update_plan_sales_data_updated_at();

-- 인덱스 생성
CREATE INDEX idx_plan_sales_data_code ON plan_sales_data(code);
CREATE INDEX idx_plan_sales_data_customer_name ON plan_sales_data(customer_name);
CREATE INDEX idx_plan_sales_data_business_unit ON plan_sales_data(business_unit);
CREATE INDEX idx_plan_sales_data_status ON plan_sales_data(status);
CREATE INDEX idx_plan_sales_data_registration_date ON plan_sales_data(registration_date);
CREATE INDEX idx_plan_sales_data_delivery_date ON plan_sales_data(delivery_date);

-- RLS (Row Level Security) 비활성화 (개발 중)
ALTER TABLE plan_sales_data DISABLE ROW LEVEL SECURITY;

-- 샘플 데이터 삽입 (테스트용)
INSERT INTO plan_sales_data (
  code, customer_name, sales_type, status, business_unit,
  model_code, item_code, item_name, quantity, unit_price, total_amount,
  team, registrant, delivery_date, notes
) VALUES
  (
    'SALES-24-001',
    '삼성전자',
    '신규',
    '진행',
    'SI사업부',
    'PRJ-2024-001',
    'PROD-SEC-001',
    '보안솔루션 A',
    10,
    5000000,
    50000000,
    '영업1팀',
    '김철수 팀장',
    '2024-12-31',
    '1차 계약 완료'
  ),
  (
    'SALES-24-002',
    'LG전자',
    '갱신',
    '대기',
    'SM사업부',
    'PRJ-2024-002',
    'PROD-ITM-002',
    'IT관리 시스템',
    5,
    3000000,
    15000000,
    '영업2팀',
    '이영희 파트장',
    '2025-01-15',
    '견적 제출 완료'
  ),
  (
    'SALES-24-003',
    '현대자동차',
    '추가',
    '완료',
    'SI사업부',
    'PRJ-2024-003',
    'PROD-NET-003',
    '네트워크 장비',
    20,
    2000000,
    40000000,
    '영업1팀',
    '박민수 프로',
    '2024-11-30',
    '납품 완료'
  )
ON CONFLICT (code) DO NOTHING;

COMMENT ON TABLE plan_sales_data IS '매출관리 데이터 테이블';
COMMENT ON COLUMN plan_sales_data.id IS '고유 ID';
COMMENT ON COLUMN plan_sales_data.registration_date IS '등록일';
COMMENT ON COLUMN plan_sales_data.code IS '매출 코드 (고유)';
COMMENT ON COLUMN plan_sales_data.customer_name IS '고객명';
COMMENT ON COLUMN plan_sales_data.sales_type IS '판매유형 (신규/갱신/추가 등)';
COMMENT ON COLUMN plan_sales_data.status IS '상태 (대기/진행/완료/홀딩)';
COMMENT ON COLUMN plan_sales_data.business_unit IS '사업부';
COMMENT ON COLUMN plan_sales_data.model_code IS '모델코드';
COMMENT ON COLUMN plan_sales_data.item_code IS '품목코드';
COMMENT ON COLUMN plan_sales_data.item_name IS '품목명';
COMMENT ON COLUMN plan_sales_data.quantity IS '수량';
COMMENT ON COLUMN plan_sales_data.unit_price IS '단가';
COMMENT ON COLUMN plan_sales_data.total_amount IS '총금액';
COMMENT ON COLUMN plan_sales_data.team IS '팀';
COMMENT ON COLUMN plan_sales_data.registrant IS '등록자';
COMMENT ON COLUMN plan_sales_data.delivery_date IS '배송일';
COMMENT ON COLUMN plan_sales_data.notes IS '비고';
COMMENT ON COLUMN plan_sales_data.contract_date IS '계약일 (optional)';
COMMENT ON COLUMN plan_sales_data.assignee IS '담당자 (optional)';
COMMENT ON COLUMN plan_sales_data.created_at IS '생성일시';
COMMENT ON COLUMN plan_sales_data.updated_at IS '수정일시';
