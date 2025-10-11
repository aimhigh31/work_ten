-- common_feedback_data 테이블의 id를 uuid에서 int4로 변경

-- 1. 기존 PRIMARY KEY 제약조건 제거
ALTER TABLE common_feedback_data DROP CONSTRAINT IF EXISTS common_feedback_data_pkey;

-- 2. 기존 id 컬럼 삭제
ALTER TABLE common_feedback_data DROP COLUMN id;

-- 3. 새로운 id 컬럼 추가 (int4, auto increment)
ALTER TABLE common_feedback_data ADD COLUMN id SERIAL PRIMARY KEY;

-- 4. 컬럼 순서 변경을 위해 임시 테이블 생성 (선택사항, id를 첫 컬럼으로)
-- PostgreSQL은 컬럼 순서 변경을 직접 지원하지 않으므로, 순서가 중요하면 아래 주석 해제
/*
CREATE TABLE common_feedback_data_new (
  id SERIAL PRIMARY KEY,
  page TEXT NOT NULL,
  record_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  description TEXT,
  user_id TEXT,
  user_name TEXT,
  team TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  metadata JSONB,
  user_department TEXT,
  user_position TEXT,
  user_profile_image TEXT
);

-- 데이터 복사 (데이터가 있는 경우)
INSERT INTO common_feedback_data_new (page, record_id, action_type, description, user_id, user_name, team, created_at, metadata, user_department, user_position, user_profile_image)
SELECT page, record_id, action_type, description, user_id, user_name, team, created_at, metadata, user_department, user_position, user_profile_image
FROM common_feedback_data;

-- 기존 테이블 삭제
DROP TABLE common_feedback_data;

-- 새 테이블을 원래 이름으로 변경
ALTER TABLE common_feedback_data_new RENAME TO common_feedback_data;
*/

-- 확인 쿼리
SELECT column_name, data_type, column_default
FROM information_schema.columns
WHERE table_name = 'common_feedback_data'
ORDER BY ordinal_position;
