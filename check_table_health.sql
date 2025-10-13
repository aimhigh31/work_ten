-- 1. 전체 레코드 수 확인
SELECT COUNT(*) as total_records FROM common_log_data;

-- 2. page별 레코드 수
SELECT page, COUNT(*) as count FROM common_log_data GROUP BY page;

-- 3. 테이블 크기 확인
SELECT
    pg_size_pretty(pg_total_relation_size('common_log_data')) as total_size,
    pg_size_pretty(pg_relation_size('common_log_data')) as table_size,
    pg_size_pretty(pg_indexes_size('common_log_data')) as indexes_size;

-- 4. 테이블 bloat 확인
SELECT
    schemaname,
    tablename,
    pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
    n_live_tup AS live_tuples,
    n_dead_tup AS dead_tuples
FROM pg_stat_user_tables
WHERE tablename = 'common_log_data';

-- 5. 인덱스 사용 통계
SELECT
    indexrelname AS index_name,
    idx_scan AS times_used,
    idx_tup_read AS tuples_read,
    idx_tup_fetch AS tuples_fetched
FROM pg_stat_user_indexes
WHERE relname = 'common_log_data';
