-- ========================================
-- common_log_data 테이블 재생성 스크립트
-- Supabase Dashboard → SQL Editor에서 실행
-- ========================================

-- 1. 기존 테이블 삭제 (CASCADE로 의존성도 함께 삭제)
DROP TABLE IF EXISTS common_log_data CASCADE;

-- 2. 새 테이블 생성
CREATE TABLE common_log_data (
    id BIGSERIAL PRIMARY KEY,
    page TEXT NOT NULL,
    record_id TEXT NOT NULL,
    action_type TEXT NOT NULL,
    description TEXT,
    before_value TEXT,
    after_value TEXT,
    changed_field TEXT,
    user_id TEXT,
    user_name TEXT NOT NULL,
    team TEXT,
    user_department TEXT,
    user_position TEXT,
    user_profile_image TEXT,
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. 성능을 위한 인덱스 생성
CREATE INDEX idx_common_log_data_page_created ON common_log_data(page, created_at DESC);
CREATE INDEX idx_common_log_data_record_id ON common_log_data(record_id);

-- 4. RLS 비활성화 (모든 사용자가 접근 가능)
ALTER TABLE common_log_data DISABLE ROW LEVEL SECURITY;

-- 5. 테스트 데이터 1개 추가
INSERT INTO common_log_data (
    page,
    record_id,
    action_type,
    description,
    changed_field,
    user_name,
    team,
    user_department,
    created_at
) VALUES (
    'security_education',
    'SEC-25-048',
    '수정',
    '테이블 재생성 후 테스트 데이터',
    '-',
    '시스템',
    '보안팀',
    '보안팀',
    NOW()
);

-- 6. 통계 정보 업데이트
ANALYZE common_log_data;

-- 7. 확인 쿼리 (결과가 1개 나오면 성공)
SELECT COUNT(*) as total_count FROM common_log_data;
