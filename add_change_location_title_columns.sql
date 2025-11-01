-- ========================================
-- common_log_data 테이블에 change_location, title 컬럼 추가
-- Supabase Dashboard → SQL Editor에서 실행
-- ========================================

-- 1. change_location 컬럼 추가 (변경 위치 정보)
ALTER TABLE common_log_data
ADD COLUMN IF NOT EXISTS change_location TEXT DEFAULT '개요탭';

-- 2. title 컬럼 추가 (제목 정보)
ALTER TABLE common_log_data
ADD COLUMN IF NOT EXISTS title TEXT;

-- 3. 기존 데이터에 대해 change_location 기본값 설정
UPDATE common_log_data
SET change_location = '개요탭'
WHERE change_location IS NULL;

-- 4. 인덱스 추가 (선택사항 - 성능 향상)
CREATE INDEX IF NOT EXISTS idx_common_log_data_location
ON common_log_data(change_location);

-- 5. 통계 정보 업데이트
ANALYZE common_log_data;

-- 6. 확인 쿼리
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'common_log_data'
  AND column_name IN ('change_location', 'title')
ORDER BY column_name;
