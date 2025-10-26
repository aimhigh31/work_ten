-- 평가 제출 테이블 스키마 업데이트
-- Supabase SQL Editor에서 실행하세요

-- 1. hr_evaluation_submissions 테이블 컬럼 추가
ALTER TABLE hr_evaluation_submissions
ADD COLUMN IF NOT EXISTS evaluator_department TEXT,
ADD COLUMN IF NOT EXISTS evaluator_position TEXT,
ADD COLUMN IF NOT EXISTS total_score INTEGER DEFAULT 0;

-- 2. hr_evaluation_submission_items 테이블 컬럼 추가
ALTER TABLE hr_evaluation_submission_items
ADD COLUMN IF NOT EXISTS item_no INTEGER,
ADD COLUMN IF NOT EXISTS major_category TEXT,
ADD COLUMN IF NOT EXISTS sub_category TEXT,
ADD COLUMN IF NOT EXISTS title TEXT,
ADD COLUMN IF NOT EXISTS evaluation TEXT,
ADD COLUMN IF NOT EXISTS score INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS description TEXT;

-- 3. 확인용 쿼리
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'hr_evaluation_submissions'
ORDER BY ordinal_position;

SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'hr_evaluation_submission_items'
ORDER BY ordinal_position;
