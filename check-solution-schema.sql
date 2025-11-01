-- 솔루션관리 테이블의 모든 varchar 컬럼 스키마 확인

SELECT
  column_name,
  data_type,
  character_maximum_length,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'it_solution_data'
  AND data_type LIKE '%char%'
ORDER BY ordinal_position;
