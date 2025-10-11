-- ========================================
-- 개발 환경을 위한 느슨한 RLS 정책 설정
-- 모든 인증된 사용자에게 전체 권한 부여
-- ========================================

-- 1. 시스템 설정 테이블 - RLS 활성화하되 모든 권한 허용
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON system_settings;
CREATE POLICY "Allow all for authenticated users" ON system_settings
    FOR ALL 
    USING (true)
    WITH CHECK (true);

ALTER TABLE menu_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON menu_settings;
CREATE POLICY "Allow all for authenticated users" ON menu_settings
    FOR ALL 
    USING (true)
    WITH CHECK (true);

-- 2. 비용 관리 테이블
ALTER TABLE costs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON costs;
CREATE POLICY "Allow all for authenticated users" ON costs
    FOR ALL 
    USING (true)
    WITH CHECK (true);

ALTER TABLE cost_attachments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON cost_attachments;
CREATE POLICY "Allow all for authenticated users" ON cost_attachments
    FOR ALL 
    USING (true)
    WITH CHECK (true);

ALTER TABLE cost_comments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON cost_comments;
CREATE POLICY "Allow all for authenticated users" ON cost_comments
    FOR ALL 
    USING (true)
    WITH CHECK (true);

-- 3. 업무 관리 테이블
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON tasks;
CREATE POLICY "Allow all for authenticated users" ON tasks
    FOR ALL 
    USING (true)
    WITH CHECK (true);

-- 4. 교육 관리 테이블
ALTER TABLE educations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all for authenticated users" ON educations;
CREATE POLICY "Allow all for authenticated users" ON educations
    FOR ALL 
    USING (true)
    WITH CHECK (true);

-- ========================================
-- 익명 사용자도 읽기 허용 (개발 편의를 위해)
-- ========================================

-- 시스템 설정은 익명 사용자도 읽기 가능
DROP POLICY IF EXISTS "Allow read for everyone" ON system_settings;
CREATE POLICY "Allow read for everyone" ON system_settings
    FOR SELECT 
    USING (true);

DROP POLICY IF EXISTS "Allow read for everyone" ON menu_settings;
CREATE POLICY "Allow read for everyone" ON menu_settings
    FOR SELECT 
    USING (true);

-- ========================================
-- 결과 확인
-- ========================================
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM 
    pg_policies 
WHERE 
    schemaname = 'public'
ORDER BY 
    tablename, policyname;

SELECT 'Development RLS policies have been applied. All authenticated users have full access!' AS message;