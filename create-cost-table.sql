-- Supabase에서 실행할 SQL (Dashboard > SQL Editor에서)

-- 1. UUID 확장 활성화 (이미 있을 수도 있음)
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. cost_records 테이블 생성
CREATE TABLE IF NOT EXISTS cost_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  registration_date DATE NOT NULL,
  start_date DATE NOT NULL,
  code TEXT UNIQUE NOT NULL,
  team TEXT NOT NULL,
  assignee_id UUID,
  cost_type TEXT NOT NULL CHECK (cost_type IN ('솔루션', '하드웨어', '출장경비', '행사경비', '사무경비')),
  content TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  unit_price DECIMAL(15,2) NOT NULL,
  amount DECIMAL(15,2) NOT NULL,
  status TEXT DEFAULT '대기' CHECK (status IN ('대기', '진행', '완료', '취소')),
  completion_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID,
  
  -- 자동 계산 검증 제약조건
  CONSTRAINT check_amount_calculation CHECK (amount = quantity * unit_price)
);

-- 3. 개발용으로 RLS 비활성화 (나중에 다시 활성화)
ALTER TABLE cost_records DISABLE ROW LEVEL SECURITY;

-- 4. 테스트 데이터 추가
INSERT INTO cost_records (
  registration_date,
  start_date,
  code,
  team,
  cost_type,
  content,
  quantity,
  unit_price,
  amount,
  status
) VALUES 
(
  '2025-01-01',
  '2025-01-01',
  'COST-2025-001',
  'IT팀',
  '솔루션',
  'Supabase 테스트 데이터',
  1,
  100000,
  100000,
  '대기'
),
(
  '2025-01-02',
  '2025-01-02', 
  'COST-2025-002',
  '마케팅팀',
  '행사경비',
  'Supabase 테스트 데이터 2',
  1,
  200000,
  200000,
  '진행'
);

-- 5. 테이블 생성 확인
SELECT 'cost_records 테이블이 성공적으로 생성되었습니다!' as message;
SELECT COUNT(*) as record_count FROM cost_records;