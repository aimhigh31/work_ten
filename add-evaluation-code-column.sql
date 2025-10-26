-- hr_evaluation_data 테이블에 evaluation_code 컬럼 추가

ALTER TABLE hr_evaluation_data
ADD COLUMN IF NOT EXISTS evaluation_code TEXT UNIQUE;

-- 인덱스 추가 (빠른 조회를 위해)
CREATE INDEX IF NOT EXISTS idx_evaluation_code ON hr_evaluation_data(evaluation_code);

-- 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'hr_evaluation_data'
ORDER BY ordinal_position;
