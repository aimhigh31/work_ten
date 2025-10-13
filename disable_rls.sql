-- common_log_data 테이블의 RLS 비활성화
ALTER TABLE common_log_data DISABLE ROW LEVEL SECURITY;

-- 또는 모든 사용자에게 접근 허용하는 정책 추가
-- DROP POLICY IF EXISTS "Enable read access for all users" ON common_log_data;
-- DROP POLICY IF EXISTS "Enable insert access for all users" ON common_log_data;
-- DROP POLICY IF EXISTS "Enable update access for all users" ON common_log_data;
-- DROP POLICY IF EXISTS "Enable delete access for all users" ON common_log_data;

-- CREATE POLICY "Enable read access for all users" ON common_log_data FOR SELECT USING (true);
-- CREATE POLICY "Enable insert access for all users" ON common_log_data FOR INSERT WITH CHECK (true);
-- CREATE POLICY "Enable update access for all users" ON common_log_data FOR UPDATE USING (true);
-- CREATE POLICY "Enable delete access for all users" ON common_log_data FOR DELETE USING (true);
