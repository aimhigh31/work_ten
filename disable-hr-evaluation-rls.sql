-- hr_evaluation_data 테이블 RLS 정책 제거

-- 기존 정책 삭제
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON hr_evaluation_data;
DROP POLICY IF EXISTS "Enable insert for authenticated users" ON hr_evaluation_data;
DROP POLICY IF EXISTS "Enable update for authenticated users" ON hr_evaluation_data;
DROP POLICY IF EXISTS "Enable delete for authenticated users" ON hr_evaluation_data;

-- RLS 비활성화
ALTER TABLE hr_evaluation_data DISABLE ROW LEVEL SECURITY;

-- 확인
SELECT tablename, rowsecurity
FROM pg_tables
WHERE tablename = 'hr_evaluation_data';
