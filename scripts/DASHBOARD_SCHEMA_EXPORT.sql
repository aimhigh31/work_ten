-- ========================================
-- Supabase Dashboard에서 실행할 SQL
-- ========================================
-- 실행 방법:
-- 1. https://supabase.com/dashboard/project/exxumujwufzqnovhzvif/sql/new
-- 2. 아래 SQL을 복사해서 실행
-- 3. 결과를 텍스트로 복사해서 schema.sql로 저장

-- ========================================
-- STEP 1: 모든 테이블 목록 출력
-- ========================================
SELECT
  '-- Table: ' || table_name || E'\n' ||
  'DROP TABLE IF EXISTS ' || table_name || ' CASCADE;' || E'\n' ||
  'CREATE TABLE ' || table_name || ' (' || E'\n' ||
  string_agg(
    '  ' || column_name || ' ' ||
    CASE
      WHEN data_type = 'character varying' THEN
        'varchar' || CASE WHEN character_maximum_length IS NOT NULL
                         THEN '(' || character_maximum_length || ')'
                         ELSE '' END
      WHEN data_type = 'timestamp without time zone' THEN 'timestamp'
      WHEN data_type = 'timestamp with time zone' THEN 'timestamptz'
      WHEN data_type = 'numeric' AND numeric_precision IS NOT NULL THEN
        'numeric(' || numeric_precision ||
        CASE WHEN numeric_scale IS NOT NULL AND numeric_scale > 0
             THEN ',' || numeric_scale
             ELSE '' END || ')'
      WHEN data_type = 'ARRAY' THEN
        REPLACE(udt_name, '_', '') || '[]'
      ELSE data_type
    END ||
    CASE WHEN is_nullable = 'NO' THEN ' NOT NULL' ELSE '' END ||
    CASE
      WHEN column_default IS NOT NULL THEN ' DEFAULT ' || column_default
      ELSE ''
    END,
    ',' || E'\n'
    ORDER BY ordinal_position
  ) || E'\n' || ');' || E'\n\n' AS schema_sql
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name IN (
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_type = 'BASE TABLE'
  )
GROUP BY table_name
ORDER BY table_name;
