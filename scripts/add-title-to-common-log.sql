-- common_log_data 테이블에 title 컬럼 추가
-- 실행 방법: Supabase Dashboard > SQL Editor에서 실행

-- title 컬럼 추가 (text 타입, nullable)
ALTER TABLE common_log_data
ADD COLUMN IF NOT EXISTS title TEXT;

-- title 컬럼에 코멘트 추가
COMMENT ON COLUMN common_log_data.title IS '변경로그 제목';

-- 확인 쿼리
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'common_log_data' AND column_name = 'title';
