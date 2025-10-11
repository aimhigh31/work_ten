-- common_feedback_data 테이블에 사용자 정보 컬럼 추가

ALTER TABLE common_feedback_data
ADD COLUMN IF NOT EXISTS user_department TEXT,
ADD COLUMN IF NOT EXISTS user_position TEXT,
ADD COLUMN IF NOT EXISTS user_profile_image TEXT;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_feedback_user_name ON common_feedback_data(user_name);
