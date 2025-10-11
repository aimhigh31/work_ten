-- ========================================
-- 모든 테이블의 RLS 비활성화 스크립트
-- 개발 환경에서 RLS 관련 문제를 방지
-- ========================================

-- 1. 시스템 설정 테이블 RLS 비활성화
ALTER TABLE IF EXISTS system_settings DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS menu_settings DISABLE ROW LEVEL SECURITY;

-- 2. 비용 관리 테이블 RLS 비활성화
ALTER TABLE IF EXISTS costs DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cost_attachments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS cost_comments DISABLE ROW LEVEL SECURITY;

-- 3. 업무 관리 테이블 RLS 비활성화
ALTER TABLE IF EXISTS tasks DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS task_attachments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS task_comments DISABLE ROW LEVEL SECURITY;

-- 4. 교육 관리 테이블 RLS 비활성화
ALTER TABLE IF EXISTS educations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS education_attachments DISABLE ROW LEVEL SECURITY;

-- 5. 사용자 관련 테이블 RLS 비활성화
ALTER TABLE IF EXISTS users DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS departments DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS checklist_items DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS master_codes DISABLE ROW LEVEL SECURITY;

-- 6. 기타 테이블 RLS 비활성화
ALTER TABLE IF EXISTS sales DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS inventory DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS personnel DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS investment DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS voc DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS solutions DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS hardware DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS software DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS security_regulations DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS security_inspections DISABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS security_incidents DISABLE ROW LEVEL SECURITY;

-- 확인 쿼리: RLS가 활성화된 테이블 목록 조회
SELECT 
    schemaname,
    tablename,
    rowsecurity
FROM 
    pg_tables 
WHERE 
    schemaname = 'public' 
    AND rowsecurity = true
ORDER BY 
    tablename;

-- 결과 메시지
SELECT 'RLS has been disabled for all tables. This is suitable for development environment only!' AS message;

-- ========================================
-- 주의사항:
-- 1. 이 스크립트는 개발 환경에서만 사용하세요
-- 2. 프로덕션 환경에서는 적절한 RLS 정책을 설정해야 합니다
-- 3. 보안이 중요한 경우 RLS를 다시 활성화하고 적절한 정책을 설정하세요
-- ========================================