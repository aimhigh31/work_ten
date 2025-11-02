-- hr_evaluation_data 테이블에 체크리스트 관련 컬럼 추가

-- 체크리스트 ID 컬럼 추가
ALTER TABLE hr_evaluation_data
ADD COLUMN IF NOT EXISTS checklist_id INTEGER;

-- 체크리스트 평가 유형 컬럼 추가 (3단계/5단계)
ALTER TABLE hr_evaluation_data
ADD COLUMN IF NOT EXISTS checklist_evaluation_type TEXT;

-- 체크리스트 안내가이드 컬럼 추가
ALTER TABLE hr_evaluation_data
ADD COLUMN IF NOT EXISTS checklist_guide TEXT;

-- 평가 코드 컬럼 추가 (이미 있을 수 있음)
ALTER TABLE hr_evaluation_data
ADD COLUMN IF NOT EXISTS evaluation_code TEXT;

-- thoughts 컬럼 추가 (이미 있을 수 있음)
ALTER TABLE hr_evaluation_data
ADD COLUMN IF NOT EXISTS thoughts TEXT;

-- notes 컬럼 추가 (이미 있을 수 있음)
ALTER TABLE hr_evaluation_data
ADD COLUMN IF NOT EXISTS notes TEXT;

-- 컬럼 추가 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'hr_evaluation_data'
  AND column_name IN (
    'checklist_id',
    'checklist_evaluation_type',
    'checklist_guide',
    'evaluation_code',
    'thoughts',
    'notes'
  )
ORDER BY column_name;
