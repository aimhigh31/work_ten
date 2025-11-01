-- 솔루션관리 테이블의 team 컬럼 크기 수정
-- varchar(10) → varchar(50)

-- 1. 현재 컬럼 정보 확인
SELECT
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'it_solution_data'
  AND column_name = 'team';

-- 2. team 컬럼 타입 변경
ALTER TABLE it_solution_data
ALTER COLUMN team TYPE varchar(50);

-- 3. 변경 후 확인
SELECT
  column_name,
  data_type,
  character_maximum_length
FROM information_schema.columns
WHERE table_name = 'it_solution_data'
  AND column_name = 'team';

-- 완료! 이제 한글 부서명을 저장할 수 있습니다.
