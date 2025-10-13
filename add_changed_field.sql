-- changed_field 컬럼 추가
ALTER TABLE common_log_data
ADD COLUMN IF NOT EXISTS changed_field TEXT;

-- 기존 데이터에 기본값 설정
UPDATE common_log_data
SET changed_field = '-'
WHERE changed_field IS NULL;
