-- hr_evaluation_data 테이블에 체크리스트 안내가이드 컬럼 추가

ALTER TABLE hr_evaluation_data
ADD COLUMN IF NOT EXISTS checklist_guide TEXT;

-- 컬럼에 대한 주석 추가
COMMENT ON COLUMN hr_evaluation_data.checklist_guide IS '체크리스트 안내가이드';

-- 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'hr_evaluation_data'
AND column_name = 'checklist_guide';
