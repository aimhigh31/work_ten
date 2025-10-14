-- main_education_data 테이블에 필요한 컬럼 추가

-- 1. no 컬럼 추가 (순번)
ALTER TABLE main_education_data ADD COLUMN IF NOT EXISTS no INTEGER;

-- 2. reception_date 컬럼 추가 (start_date와 동일하지만 명시적으로)
-- start_date가 이미 있으므로 패스

-- 3. customer_name 컬럼 추가 (교육분야) - education_category 사용
-- education_category가 이미 있으므로 패스

-- 4. company_name 컬럼 추가
ALTER TABLE main_education_data ADD COLUMN IF NOT EXISTS company_name TEXT;

-- 5. channel 컬럼 추가
ALTER TABLE main_education_data ADD COLUMN IF NOT EXISTS channel TEXT;

-- 6. content 컬럼 추가 - description 사용
-- description이 이미 있으므로 패스

-- 7. assignee 컬럼 추가 - assignee_name 사용
-- assignee_name이 이미 있으므로 패스

-- 8. priority 컬럼 추가
ALTER TABLE main_education_data ADD COLUMN IF NOT EXISTS priority TEXT DEFAULT '보통';

-- 9. response_content 컬럼 추가
ALTER TABLE main_education_data ADD COLUMN IF NOT EXISTS response_content TEXT;

-- 10. resolution_date 컬럼 추가 - completion_date 사용
-- completion_date가 이미 있으므로 패스

-- 11. satisfaction_score 컬럼 추가
ALTER TABLE main_education_data ADD COLUMN IF NOT EXISTS satisfaction_score INTEGER;

-- 12. attachments 컬럼 추가
ALTER TABLE main_education_data ADD COLUMN IF NOT EXISTS attachments JSONB DEFAULT '[]'::jsonb;

-- 13. created_by, updated_by 컬럼 추가
ALTER TABLE main_education_data ADD COLUMN IF NOT EXISTS created_by TEXT DEFAULT 'system';
ALTER TABLE main_education_data ADD COLUMN IF NOT EXISTS updated_by TEXT DEFAULT 'system';

-- no 값 자동 생성 (기존 데이터에 대해)
UPDATE main_education_data
SET no = id
WHERE no IS NULL;

-- 인덱스 추가
CREATE INDEX IF NOT EXISTS idx_main_education_data_no ON main_education_data(no);

-- 확인
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'main_education_data'
ORDER BY ordinal_position;
