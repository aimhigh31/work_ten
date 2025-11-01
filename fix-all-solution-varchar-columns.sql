-- 솔루션관리 테이블의 모든 varchar(10) 컬럼을 varchar(50)으로 변경

-- 1. 현재 상태 확인
SELECT
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'it_solution_data'
  AND data_type LIKE '%char%'
ORDER BY ordinal_position;

-- 2. solution_type 컬럼 타입 변경
ALTER TABLE it_solution_data
ALTER COLUMN solution_type TYPE varchar(50);

-- 3. development_type 컬럼 타입 변경
ALTER TABLE it_solution_data
ALTER COLUMN development_type TYPE varchar(50);

-- 4. status 컬럼 타입 변경 (혹시 모르니)
ALTER TABLE it_solution_data
ALTER COLUMN status TYPE varchar(50);

-- 5. title 컬럼 타입 변경 (제목은 더 길 수 있으니 200으로)
ALTER TABLE it_solution_data
ALTER COLUMN title TYPE varchar(200);

-- 6. assignee 컬럼 타입 변경
ALTER TABLE it_solution_data
ALTER COLUMN assignee TYPE varchar(50);

-- 7. code 컬럼 타입 변경
ALTER TABLE it_solution_data
ALTER COLUMN code TYPE varchar(50);

-- 8. 변경 후 확인
SELECT
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'it_solution_data'
  AND data_type LIKE '%char%'
ORDER BY ordinal_position;

-- 완료! 이제 모든 한글 값을 저장할 수 있습니다.
