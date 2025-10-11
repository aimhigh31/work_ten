-- =====================================================
-- 마이그레이션: common_feedback_data 테이블 인덱스 추가
-- 목적: 페이지별, 레코드별 피드백 조회 성능 최적화
-- 작성일: 2025-10-11
-- =====================================================

-- 인덱스 1: page + record_id + created_at 복합 인덱스
-- 용도: WHERE page = ? AND record_id = ? ORDER BY created_at DESC 쿼리 최적화
-- 이 인덱스는 가장 자주 사용되는 쿼리 패턴을 커버합니다
CREATE INDEX IF NOT EXISTS idx_feedback_page_record_created
ON common_feedback_data (page, record_id, created_at DESC);

-- 인덱스 2: created_at 단독 인덱스
-- 용도: 전체 피드백 조회 시 정렬 성능 향상
CREATE INDEX IF NOT EXISTS idx_feedback_created_at
ON common_feedback_data (created_at DESC);

-- 인덱스 3: user_name 인덱스
-- 용도: 특정 사용자의 피드백 검색 성능 향상
CREATE INDEX IF NOT EXISTS idx_feedback_user_name
ON common_feedback_data (user_name);

-- 인덱스 4: action_type 인덱스
-- 용도: 액션 타입별 필터링 성능 향상
CREATE INDEX IF NOT EXISTS idx_feedback_action_type
ON common_feedback_data (action_type);

-- 인덱스 확인 쿼리
-- 아래 쿼리를 실행하면 생성된 인덱스를 확인할 수 있습니다
/*
SELECT
    indexname,
    indexdef
FROM
    pg_indexes
WHERE
    tablename = 'common_feedback_data'
ORDER BY
    indexname;
*/

-- 성능 테스트 쿼리 (선택사항)
-- EXPLAIN ANALYZE를 사용해서 인덱스 사용 여부를 확인할 수 있습니다
/*
EXPLAIN ANALYZE
SELECT *
FROM common_feedback_data
WHERE page = 'it_voc' AND record_id = '1'
ORDER BY created_at DESC;
*/
