-- Supabase Dashboard > SQL Editor에서 실행할 SQL
-- 실행 후 결과를 복사해서 schema.sql 파일로 저장하세요

-- 1. 모든 테이블의 CREATE TABLE 문 생성
SELECT
  'DROP TABLE IF EXISTS ' || table_name || ' CASCADE;' || E'\n' ||
  'CREATE TABLE ' || table_name || ' (' || E'\n' ||
  string_agg(
    '  ' || column_name || ' ' ||
    CASE
      WHEN data_type = 'character varying' THEN 'varchar' || COALESCE('(' || character_maximum_length || ')', '')
      WHEN data_type = 'timestamp without time zone' THEN 'timestamp'
      WHEN data_type = 'timestamp with time zone' THEN 'timestamptz'
      WHEN data_type = 'numeric' AND numeric_precision IS NOT NULL THEN
        'numeric(' || numeric_precision || COALESCE(',' || numeric_scale, '') || ')'
      ELSE data_type
    END ||
    CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
    CASE WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default ELSE '' END,
    ',' || E'\n'
  ) || E'\n' || ');' || E'\n'
  AS create_statement
FROM information_schema.columns
WHERE table_schema = 'public'
GROUP BY table_name
ORDER BY table_name;
