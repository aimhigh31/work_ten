-- it_education_data 테이블에 team 컬럼 추가

-- 1. team 컬럼이 없으면 추가
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'it_education_data'
    AND column_name = 'team'
  ) THEN
    ALTER TABLE it_education_data ADD COLUMN team TEXT;
    RAISE NOTICE 'team 컬럼이 추가되었습니다.';
  ELSE
    RAISE NOTICE 'team 컬럼이 이미 존재합니다.';
  END IF;
END $$;

-- 2. 테이블 구조 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'it_education_data'
ORDER BY ordinal_position;
