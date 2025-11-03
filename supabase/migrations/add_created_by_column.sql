-- created_by 컬럼 추가 (권한 체크용)
ALTER TABLE plan_sales_data
ADD COLUMN IF NOT EXISTS created_by TEXT;

COMMENT ON COLUMN plan_sales_data.created_by IS '생성자 user_name (권한 체크용)';
