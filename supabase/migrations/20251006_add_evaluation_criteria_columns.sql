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
