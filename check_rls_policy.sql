-- common_log_data 테이블의 RLS 정책 확인
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies
WHERE tablename = 'common_log_data';

-- RLS가 활성화되어 있는지 확인
SELECT
    tablename,
    rowsecurity
FROM pg_tables
WHERE tablename = 'common_log_data';
