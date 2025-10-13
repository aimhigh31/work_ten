-- 1. 기존 인덱스 확인
SELECT
    indexname,
    indexdef
FROM pg_indexes
WHERE tablename = 'common_log_data';

-- 2. 모든 기존 인덱스 삭제
DROP INDEX IF EXISTS idx_common_log_data_page;
DROP INDEX IF EXISTS idx_common_log_data_created_at;
DROP INDEX IF EXISTS idx_common_log_data_page_created_at;

-- 3. 최적화된 복합 인덱스 생성 (page + created_at 순서 중요!)
CREATE INDEX idx_common_log_data_optimized ON common_log_data(page, created_at DESC);

-- 4. VACUUM ANALYZE로 통계 정보 업데이트 (인덱스가 실제로 사용되도록)
-- 주의: VACUUM은 트랜잭션 밖에서 실행해야 하므로 별도 실행 필요
