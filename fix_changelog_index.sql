-- 인덱스 재생성
DROP INDEX IF EXISTS idx_common_log_data_page;
DROP INDEX IF EXISTS idx_common_log_data_created_at;
DROP INDEX IF EXISTS idx_common_log_data_page_created_at;

CREATE INDEX idx_common_log_data_page ON common_log_data(page);
CREATE INDEX idx_common_log_data_created_at ON common_log_data(created_at DESC);
CREATE INDEX idx_common_log_data_page_created_at ON common_log_data(page, created_at DESC);

-- changed_field 컬럼 추가
ALTER TABLE common_log_data
ADD COLUMN IF NOT EXISTS changed_field TEXT;

-- 기존 데이터에 기본값 설정
UPDATE common_log_data
SET changed_field = '-'
WHERE changed_field IS NULL;
