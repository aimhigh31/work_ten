-- Phase 3-1: DB 인덱스 추가 스크립트
-- common_feedback_data 테이블 성능 최적화를 위한 인덱스

-- 1. page 컬럼 인덱스 (WHERE page = ? 조건 최적화)
CREATE INDEX IF NOT EXISTS idx_feedback_page
ON common_feedback_data(page);

-- 2. record_id 컬럼 인덱스 (WHERE record_id = ? 조건 최적화)
CREATE INDEX IF NOT EXISTS idx_feedback_record_id
ON common_feedback_data(record_id);

-- 3. (page, record_id) 복합 인덱스 (WHERE page = ? AND record_id = ? 최적화)
-- 가장 자주 사용되는 쿼리 패턴
CREATE INDEX IF NOT EXISTS idx_feedback_page_record_id
ON common_feedback_data(page, record_id);

-- 4. (page, record_id, created_at) 복합 인덱스 (ORDER BY created_at 최적화)
-- 정렬까지 포함하여 커버링 인덱스로 동작
CREATE INDEX IF NOT EXISTS idx_feedback_page_record_created
ON common_feedback_data(page, record_id, created_at DESC);

-- 5. created_at 컬럼 인덱스 (ORDER BY created_at 최적화)
CREATE INDEX IF NOT EXISTS idx_feedback_created_at
ON common_feedback_data(created_at DESC);

-- 인덱스 추가 완료 확인
SELECT
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'common_feedback_data'
ORDER BY indexname;
