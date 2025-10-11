-- common_feedback_data 테이블 구조 확인
SELECT
    column_name,
    data_type,
    character_maximum_length,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_name = 'common_feedback_data'
ORDER BY ordinal_position;
