-- main_task_data 테이블에 kpi_record_id 컬럼 추가
-- KPI의 recordId (main_kpi_task 테이블의 id)를 저장하기 위한 컬럼

ALTER TABLE main_task_data
ADD COLUMN IF NOT EXISTS kpi_record_id int4;

COMMENT ON COLUMN main_task_data.kpi_record_id IS 'main_kpi_task 테이블의 id (recordId)';

-- 확인
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns
WHERE table_name = 'main_task_data'
AND column_name LIKE '%kpi%'
ORDER BY ordinal_position;
