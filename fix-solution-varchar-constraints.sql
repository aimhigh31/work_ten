-- it_solution_data 테이블 varchar 제약 수정
-- 문제: status, solution_type, development_type, code 컬럼이 varchar(10)으로 설정되어 있어
--       실제 데이터(15자)를 저장할 수 없음
-- 해결: varchar(50)으로 확장

-- 1. status 컬럼 확장 (varchar(10) -> varchar(50))
ALTER TABLE it_solution_data
ALTER COLUMN status TYPE varchar(50);

-- 2. solution_type 컬럼 확장 (varchar(10) -> varchar(50))
ALTER TABLE it_solution_data
ALTER COLUMN solution_type TYPE varchar(50);

-- 3. development_type 컬럼 확장 (varchar(10) -> varchar(50))
ALTER TABLE it_solution_data
ALTER COLUMN development_type TYPE varchar(50);

-- 4. code 컬럼 확장 (varchar(10) -> varchar(50))
ALTER TABLE it_solution_data
ALTER COLUMN code TYPE varchar(50);

-- 5. team 컬럼 확장 (varchar(10) -> varchar(50))
ALTER TABLE it_solution_data
ALTER COLUMN team TYPE varchar(50);

-- 확인 쿼리
SELECT
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'it_solution_data'
  AND column_name IN ('status', 'solution_type', 'development_type', 'code', 'team')
ORDER BY column_name;
