-- common_log_data 테이블 구조 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'common_log_data'
ORDER BY ordinal_position;
