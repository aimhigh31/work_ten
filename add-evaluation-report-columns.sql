-- hr_evaluation_data 테이블에 평가성과보고 컬럼 추가

ALTER TABLE hr_evaluation_data
ADD COLUMN IF NOT EXISTS performance TEXT,
ADD COLUMN IF NOT EXISTS improvements TEXT,
ADD COLUMN IF NOT EXISTS thoughts TEXT,
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 컬럼에 대한 주석 추가
COMMENT ON COLUMN hr_evaluation_data.performance IS '평가 성과';
COMMENT ON COLUMN hr_evaluation_data.improvements IS '개선사항';
COMMENT ON COLUMN hr_evaluation_data.thoughts IS '평가소감';
COMMENT ON COLUMN hr_evaluation_data.notes IS '비고';

-- 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'hr_evaluation_data'
AND column_name IN ('performance', 'improvements', 'thoughts', 'notes');
