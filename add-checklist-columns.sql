-- hr_evaluation_data 테이블에 체크리스트 관련 컬럼 추가

-- 체크리스트 ID 컬럼 추가
ALTER TABLE hr_evaluation_data
ADD COLUMN IF NOT EXISTS checklist_id INTEGER;

-- 체크리스트 평가 유형 컬럼 추가 (3단계 또는 5단계)
ALTER TABLE hr_evaluation_data
ADD COLUMN IF NOT EXISTS checklist_evaluation_type TEXT;

-- 체크리스트 테이블과의 외래 키 관계 설정 (선택사항)
-- ALTER TABLE hr_evaluation_data
-- ADD CONSTRAINT fk_checklist
-- FOREIGN KEY (checklist_id) REFERENCES admin_inspection_checklist_new(id)
-- ON DELETE SET NULL;

-- 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'hr_evaluation_data'
ORDER BY ordinal_position;
