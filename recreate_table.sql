-- 1. 기존 테이블 백업 (새 테이블로 복사)
CREATE TABLE common_log_data_backup AS SELECT * FROM common_log_data;

-- 2. 기존 테이블 삭제
DROP TABLE IF EXISTS common_log_data CASCADE;

-- 3. 새 테이블 생성
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

-- 4. 최적화된 인덱스 생성
CREATE INDEX idx_common_log_data_page_created ON common_log_data(page, created_at DESC);
CREATE INDEX idx_common_log_data_record_id ON common_log_data(record_id);

-- 5. RLS 비활성화
ALTER TABLE common_log_data DISABLE ROW LEVEL SECURITY;

-- 6. 백업에서 security_education 데이터만 복원
INSERT INTO common_log_data (
    page, record_id, action_type, description, before_value, after_value, changed_field,
    user_name, team, user_department, created_at
)
SELECT
    page, record_id, action_type, description, before_value, after_value, changed_field,
    user_name, team, user_department, created_at
FROM common_log_data_backup
WHERE page = 'security_education'
ORDER BY created_at DESC
LIMIT 50;

-- 7. ANALYZE로 통계 업데이트
ANALYZE common_log_data;
