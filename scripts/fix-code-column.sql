-- 옵션 1: code 컬럼을 nullable로 변경 (추천)
ALTER TABLE main_education_data ALTER COLUMN code DROP NOT NULL;

-- 옵션 2: code에 기본값 설정
-- ALTER TABLE main_education_data ALTER COLUMN code SET DEFAULT '';

-- 확인
SELECT column_name, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'main_education_data' AND column_name = 'code';
