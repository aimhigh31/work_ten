-- 인사평가 테이블 RLS 정책 수정
-- Supabase SQL Editor에서 실행하세요

-- 1. 기존 정책 모두 삭제
DROP POLICY IF EXISTS "Anyone can submit evaluations" ON hr_evaluation_submissions;
DROP POLICY IF EXISTS "Anyone can submit evaluation items" ON hr_evaluation_submission_items;
DROP POLICY IF EXISTS "Authenticated users can view all submissions" ON hr_evaluation_submissions;
DROP POLICY IF EXISTS "Authenticated users can view all submission items" ON hr_evaluation_submission_items;

-- 2. 새로운 정책 생성 - 익명 사용자도 INSERT 가능
CREATE POLICY "Enable insert for anon users"
ON hr_evaluation_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Enable insert for anon users on items"
ON hr_evaluation_submission_items
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 3. 인증된 사용자는 모든 데이터 조회 가능
CREATE POLICY "Enable read access for authenticated users"
ON hr_evaluation_submissions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable read access for authenticated users on items"
ON hr_evaluation_submission_items
FOR SELECT
TO authenticated
USING (true);

-- 4. 정책 확인
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename IN ('hr_evaluation_submissions', 'hr_evaluation_submission_items')
ORDER BY tablename, policyname;
