-- main_education_data 테이블 RLS 비활성화
ALTER TABLE main_education_data DISABLE ROW LEVEL SECURITY;

-- 또는 모든 작업을 허용하는 정책 추가 (RLS 유지하면서)
-- ALTER TABLE main_education_data ENABLE ROW LEVEL SECURITY;
-- DROP POLICY IF EXISTS "Enable all access" ON main_education_data;
-- CREATE POLICY "Enable all access" ON main_education_data FOR ALL USING (true) WITH CHECK (true);
