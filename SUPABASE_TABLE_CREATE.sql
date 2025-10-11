-- it_software_user 테이블 생성 SQL
-- Supabase Dashboard > SQL Editor에서 실행하세요

-- 1. 테이블 생성
CREATE TABLE IF NOT EXISTS public.it_software_user (
  id bigserial PRIMARY KEY,
  software_id bigint NOT NULL,
  user_name text NOT NULL,
  department text,
  exclusive_id text,
  reason text,
  usage_status text DEFAULT '사용중',
  start_date date,
  end_date date,
  registration_date date DEFAULT CURRENT_DATE,
  created_by text DEFAULT 'user',
  updated_by text DEFAULT 'user',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_it_software_user_software_id ON public.it_software_user(software_id);
CREATE INDEX IF NOT EXISTS idx_it_software_user_is_active ON public.it_software_user(is_active);
CREATE INDEX IF NOT EXISTS idx_it_software_user_user_name ON public.it_software_user(user_name);

-- 3. Row Level Security (RLS) 설정
ALTER TABLE public.it_software_user ENABLE ROW LEVEL SECURITY;

-- 4. RLS 정책 생성 (모든 사용자에게 모든 권한 허용)
CREATE POLICY "Enable all operations for authenticated users" ON public.it_software_user
FOR ALL USING (true);

-- 5. 외래키 제약 조건 (it_software_data 테이블과 연결)
-- 주의: it_software_data 테이블이 존재하는 경우에만 실행
-- ALTER TABLE public.it_software_user
-- ADD CONSTRAINT it_software_user_software_id_fkey
-- FOREIGN KEY (software_id) REFERENCES public.it_software_data(id) ON DELETE CASCADE;

-- 6. 테스트 데이터 삽입 (선택사항)
-- INSERT INTO public.it_software_user (
--   software_id, user_name, department, exclusive_id, reason, usage_status,
--   start_date, end_date, registration_date
-- ) VALUES (
--   1, '김테스트', 'IT팀', 'SW001-KIM', '테스트 사용자', '사용중',
--   '2025-01-01', '2025-12-31', CURRENT_DATE
-- );

-- 완료 후 확인 쿼리
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'it_software_user'
ORDER BY ordinal_position;