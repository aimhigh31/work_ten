-- VOC 테이블에 code 컬럼 추가
-- Supabase Dashboard > SQL Editor에서 실행하세요

-- 1. code 컬럼 추가
ALTER TABLE it_voc_data
ADD COLUMN IF NOT EXISTS code VARCHAR(50);

-- 2. 기존 데이터에 연도별 순차 코드 부여
WITH ranked_vocs AS (
  SELECT
    id,
    EXTRACT(YEAR FROM created_at) as year,
    ROW_NUMBER() OVER (
      PARTITION BY EXTRACT(YEAR FROM created_at)
      ORDER BY id
    ) as seq
  FROM it_voc_data
  WHERE code IS NULL
)
UPDATE it_voc_data
SET code = CONCAT(
  'IT-VOC-',
  LPAD(RIGHT(ranked_vocs.year::TEXT, 2), 2, '0'),
  '-',
  LPAD(ranked_vocs.seq::TEXT, 3, '0')
)
FROM ranked_vocs
WHERE it_voc_data.id = ranked_vocs.id;

-- 3. 결과 확인
SELECT id, code, created_at, title
FROM it_voc_data
ORDER BY code DESC
LIMIT 10;
