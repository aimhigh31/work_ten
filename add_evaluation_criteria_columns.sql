-- main_kpi_data 테이블에 평가기준표 관련 컬럼 추가

-- 선정배경 컬럼 추가
ALTER TABLE main_kpi_data
ADD COLUMN IF NOT EXISTS selection_background TEXT;

-- 영향도 컬럼 추가
ALTER TABLE main_kpi_data
ADD COLUMN IF NOT EXISTS impact TEXT;

-- 평가기준표 컬럼 추가 (S, A, B, C, D 등급)
ALTER TABLE main_kpi_data
ADD COLUMN IF NOT EXISTS evaluation_criteria_s TEXT;

ALTER TABLE main_kpi_data
ADD COLUMN IF NOT EXISTS evaluation_criteria_a TEXT;

ALTER TABLE main_kpi_data
ADD COLUMN IF NOT EXISTS evaluation_criteria_b TEXT;

ALTER TABLE main_kpi_data
ADD COLUMN IF NOT EXISTS evaluation_criteria_c TEXT;

ALTER TABLE main_kpi_data
ADD COLUMN IF NOT EXISTS evaluation_criteria_d TEXT;

-- 컬럼 추가 확인
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'main_kpi_data'
  AND column_name IN (
    'selection_background',
    'impact',
    'evaluation_criteria_s',
    'evaluation_criteria_a',
    'evaluation_criteria_b',
    'evaluation_criteria_c',
    'evaluation_criteria_d'
  )
ORDER BY column_name;
