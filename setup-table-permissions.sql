-- ========================================
-- 🏪 Supabase 테이블 권한 설정 스크립트
-- ========================================
-- 목적: Service Role 키에서 Anon 키로 전환 후 테이블별 권한 설정
-- 작성일: 2025-10-19
-- 실행 방법: Supabase Dashboard > SQL Editor에서 실행
-- ========================================

-- 시작 메시지
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔧 테이블 권한 설정 시작...';
  RAISE NOTICE '========================================';
END $$;


-- ========================================
-- STEP 1: 현재 권한 상태 확인 (실행 전)
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '📋 STEP 1: 현재 권한 상태 확인';
  RAISE NOTICE '----------------------------------------';
END $$;

-- 테이블 목록 및 현재 권한 조회
SELECT
  table_name as "테이블명",
  STRING_AGG(
    CASE
      WHEN grantee = 'anon' THEN '손님(' || privilege_type || ')'
      WHEN grantee = 'authenticated' THEN '직원(' || privilege_type || ')'
      WHEN grantee = 'service_role' THEN '관리자(' || privilege_type || ')'
    END,
    ', '
  ) as "현재_권한"
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated', 'service_role')
  AND (table_name LIKE 'admin_%' OR table_name LIKE 'main_%')
GROUP BY table_name
ORDER BY table_name;


-- ========================================
-- STEP 2: 🚫 레벨 1 - 완전 차단 (민감 정보)
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🚫 STEP 2: 민감 정보 테이블 보호';
  RAISE NOTICE '----------------------------------------';
  RAISE NOTICE '급여, 평가 등 민감 정보는 관리자만 접근 가능';
END $$;

-- 급여 정보 (있는 경우)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'admin_salary') THEN
    REVOKE ALL ON admin_salary FROM anon, authenticated, PUBLIC;
    GRANT ALL ON admin_salary TO service_role;
    RAISE NOTICE '✅ admin_salary: 관리자 전용';
  END IF;
END $$;

-- 평가 정보 (있는 경우)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'admin_evaluation') THEN
    REVOKE ALL ON admin_evaluation FROM anon, authenticated, PUBLIC;
    GRANT ALL ON admin_evaluation TO service_role;
    RAISE NOTICE '✅ admin_evaluation: 관리자 전용';
  END IF;
END $$;


-- ========================================
-- STEP 3: 👁️ 레벨 2 - 읽기 전용 (기본 정보)
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '👁️ STEP 3: 기본 정보 테이블 읽기 전용 설정';
  RAISE NOTICE '----------------------------------------';
  RAISE NOTICE '사용자, 부서, 마스터코드 등은 모두 볼 수 있지만 수정 불가';
END $$;

-- 사용자 프로필
REVOKE ALL ON admin_users_userprofiles FROM anon, authenticated, PUBLIC;
GRANT SELECT ON admin_users_userprofiles TO anon, authenticated;
GRANT ALL ON admin_users_userprofiles TO service_role;

-- 부서 정보
REVOKE ALL ON admin_departments FROM anon, authenticated, PUBLIC;
GRANT SELECT ON admin_departments TO anon, authenticated;
GRANT ALL ON admin_departments TO service_role;

-- 마스터코드 (상위)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'admin_mastercode_h') THEN
    REVOKE ALL ON admin_mastercode_h FROM anon, authenticated, PUBLIC;
    GRANT SELECT ON admin_mastercode_h TO anon, authenticated;
    GRANT ALL ON admin_mastercode_h TO service_role;
    RAISE NOTICE '✅ admin_mastercode_h: 읽기 전용';
  END IF;
END $$;

-- 마스터코드 (하위)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'admin_mastercode_l') THEN
    REVOKE ALL ON admin_mastercode_l FROM anon, authenticated, PUBLIC;
    GRANT SELECT ON admin_mastercode_l TO anon, authenticated;
    GRANT ALL ON admin_mastercode_l TO service_role;
    RAISE NOTICE '✅ admin_mastercode_l: 읽기 전용';
  END IF;
END $$;

-- 메뉴 관리
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'admin_systemsetting_menu') THEN
    REVOKE ALL ON admin_systemsetting_menu FROM anon, authenticated, PUBLIC;
    GRANT SELECT ON admin_systemsetting_menu TO anon, authenticated;
    GRANT ALL ON admin_systemsetting_menu TO service_role;
    RAISE NOTICE '✅ admin_systemsetting_menu: 읽기 전용';
  END IF;
END $$;

DO $$
BEGIN
  RAISE NOTICE '✅ 사용자 프로필, 부서, 마스터코드: 읽기 전용 설정 완료';
END $$;


-- ========================================
-- STEP 4: 🔨 레벨 3 - 직원 작업용 (업무 데이터)
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '🔨 STEP 4: 업무 데이터 테이블 직원 전용 설정';
  RAISE NOTICE '----------------------------------------';
  RAISE NOTICE '로그인한 사용자는 업무 데이터 생성/수정/삭제 가능';
END $$;

-- Task 관리
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'main_task_management') THEN
    REVOKE ALL ON main_task_management FROM anon, authenticated, PUBLIC;
    GRANT SELECT, INSERT, UPDATE, DELETE ON main_task_management TO authenticated;
    GRANT ALL ON main_task_management TO service_role;
    RAISE NOTICE '✅ main_task_management: 직원 전용';
  END IF;
END $$;

-- 교육 관리
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'main_it_education') THEN
    REVOKE ALL ON main_it_education FROM anon, authenticated, PUBLIC;
    GRANT SELECT, INSERT, UPDATE, DELETE ON main_it_education TO authenticated;
    GRANT ALL ON main_it_education TO service_role;
    RAISE NOTICE '✅ main_it_education: 직원 전용';
  END IF;
END $$;

-- 개인 교육 (EducationManagement)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'main_education') THEN
    REVOKE ALL ON main_education FROM anon, authenticated, PUBLIC;
    GRANT SELECT, INSERT, UPDATE, DELETE ON main_education TO authenticated;
    GRANT ALL ON main_education TO service_role;
    RAISE NOTICE '✅ main_education: 직원 전용';
  END IF;
END $$;

-- 체크리스트
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'admin_checklist_data') THEN
    REVOKE ALL ON admin_checklist_data FROM anon, authenticated, PUBLIC;
    GRANT SELECT, INSERT, UPDATE, DELETE ON admin_checklist_data TO authenticated;
    GRANT ALL ON admin_checklist_data TO service_role;
    RAISE NOTICE '✅ admin_checklist_data: 직원 전용';
  END IF;
END $$;

-- VOC 관리
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'main_voc') THEN
    REVOKE ALL ON main_voc FROM anon, authenticated, PUBLIC;
    GRANT SELECT, INSERT, UPDATE, DELETE ON main_voc TO authenticated;
    GRANT ALL ON main_voc TO service_role;
    RAISE NOTICE '✅ main_voc: 직원 전용';
  END IF;
END $$;

-- 솔루션 관리
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'main_solution') THEN
    REVOKE ALL ON main_solution FROM anon, authenticated, PUBLIC;
    GRANT SELECT, INSERT, UPDATE, DELETE ON main_solution TO authenticated;
    GRANT ALL ON main_solution TO service_role;
    RAISE NOTICE '✅ main_solution: 직원 전용';
  END IF;
END $$;

-- 보안 교육
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'main_security_education') THEN
    REVOKE ALL ON main_security_education FROM anon, authenticated, PUBLIC;
    GRANT SELECT, INSERT, UPDATE, DELETE ON main_security_education TO authenticated;
    GRANT ALL ON main_security_education TO service_role;
    RAISE NOTICE '✅ main_security_education: 직원 전용';
  END IF;
END $$;

-- 보안 사고
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'main_security_incident') THEN
    REVOKE ALL ON main_security_incident FROM anon, authenticated, PUBLIC;
    GRANT SELECT, INSERT, UPDATE, DELETE ON main_security_incident TO authenticated;
    GRANT ALL ON main_security_incident TO service_role;
    RAISE NOTICE '✅ main_security_incident: 직원 전용';
  END IF;
END $$;

-- 보안 점검
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'main_security_inspection_checksheet') THEN
    REVOKE ALL ON main_security_inspection_checksheet FROM anon, authenticated, PUBLIC;
    GRANT SELECT, INSERT, UPDATE, DELETE ON main_security_inspection_checksheet TO authenticated;
    GRANT ALL ON main_security_inspection_checksheet TO service_role;
    RAISE NOTICE '✅ main_security_inspection_checksheet: 직원 전용';
  END IF;
END $$;

-- 보안 규정
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'main_security_regulation') THEN
    REVOKE ALL ON main_security_regulation FROM anon, authenticated, PUBLIC;
    GRANT SELECT, INSERT, UPDATE, DELETE ON main_security_regulation TO authenticated;
    GRANT ALL ON main_security_regulation TO service_role;
    RAISE NOTICE '✅ main_security_regulation: 직원 전용';
  END IF;
END $$;

-- 보안 규정 개정
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'main_security_regulation_revision') THEN
    REVOKE ALL ON main_security_regulation_revision FROM anon, authenticated, PUBLIC;
    GRANT SELECT, INSERT, UPDATE, DELETE ON main_security_regulation_revision TO authenticated;
    GRANT ALL ON main_security_regulation_revision TO service_role;
    RAISE NOTICE '✅ main_security_regulation_revision: 직원 전용';
  END IF;
END $$;

-- KPI 관리
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'main_kpi') THEN
    REVOKE ALL ON main_kpi FROM anon, authenticated, PUBLIC;
    GRANT SELECT, INSERT, UPDATE, DELETE ON main_kpi TO authenticated;
    GRANT ALL ON main_kpi TO service_role;
    RAISE NOTICE '✅ main_kpi: 직원 전용';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'main_kpi_record') THEN
    REVOKE ALL ON main_kpi_record FROM anon, authenticated, PUBLIC;
    GRANT SELECT, INSERT, UPDATE, DELETE ON main_kpi_record TO authenticated;
    GRANT ALL ON main_kpi_record TO service_role;
    RAISE NOTICE '✅ main_kpi_record: 직원 전용';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'main_kpi_task') THEN
    REVOKE ALL ON main_kpi_task FROM anon, authenticated, PUBLIC;
    GRANT SELECT, INSERT, UPDATE, DELETE ON main_kpi_task TO authenticated;
    GRANT ALL ON main_kpi_task TO service_role;
    RAISE NOTICE '✅ main_kpi_task: 직원 전용';
  END IF;
END $$;

-- 투자 관리
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'main_investment') THEN
    REVOKE ALL ON main_investment FROM anon, authenticated, PUBLIC;
    GRANT SELECT, INSERT, UPDATE, DELETE ON main_investment TO authenticated;
    GRANT ALL ON main_investment TO service_role;
    RAISE NOTICE '✅ main_investment: 직원 전용';
  END IF;
END $$;

-- 비용 관리
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'main_cost') THEN
    REVOKE ALL ON main_cost FROM anon, authenticated, PUBLIC;
    GRANT SELECT, INSERT, UPDATE, DELETE ON main_cost TO authenticated;
    GRANT ALL ON main_cost TO service_role;
    RAISE NOTICE '✅ main_cost: 직원 전용';
  END IF;
END $$;

-- 매출 관리
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'main_sales') THEN
    REVOKE ALL ON main_sales FROM anon, authenticated, PUBLIC;
    GRANT SELECT, INSERT, UPDATE, DELETE ON main_sales TO authenticated;
    GRANT ALL ON main_sales TO service_role;
    RAISE NOTICE '✅ main_sales: 직원 전용';
  END IF;
END $$;

-- 하드웨어 관리
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'main_it_hardware') THEN
    REVOKE ALL ON main_it_hardware FROM anon, authenticated, PUBLIC;
    GRANT SELECT, INSERT, UPDATE, DELETE ON main_it_hardware TO authenticated;
    GRANT ALL ON main_it_hardware TO service_role;
    RAISE NOTICE '✅ main_it_hardware: 직원 전용';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'main_it_hardware_user') THEN
    REVOKE ALL ON main_it_hardware_user FROM anon, authenticated, PUBLIC;
    GRANT SELECT, INSERT, UPDATE, DELETE ON main_it_hardware_user TO authenticated;
    GRANT ALL ON main_it_hardware_user TO service_role;
    RAISE NOTICE '✅ main_it_hardware_user: 직원 전용';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'main_it_hardware_history') THEN
    REVOKE ALL ON main_it_hardware_history FROM anon, authenticated, PUBLIC;
    GRANT SELECT, INSERT, UPDATE, DELETE ON main_it_hardware_history TO authenticated;
    GRANT ALL ON main_it_hardware_history TO service_role;
    RAISE NOTICE '✅ main_it_hardware_history: 직원 전용';
  END IF;
END $$;

-- 소프트웨어 관리
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'main_it_software') THEN
    REVOKE ALL ON main_it_software FROM anon, authenticated, PUBLIC;
    GRANT SELECT, INSERT, UPDATE, DELETE ON main_it_software TO authenticated;
    GRANT ALL ON main_it_software TO service_role;
    RAISE NOTICE '✅ main_it_software: 직원 전용';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'main_it_software_user') THEN
    REVOKE ALL ON main_it_software_user FROM anon, authenticated, PUBLIC;
    GRANT SELECT, INSERT, UPDATE, DELETE ON main_it_software_user TO authenticated;
    GRANT ALL ON main_it_software_user TO service_role;
    RAISE NOTICE '✅ main_it_software_user: 직원 전용';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'main_it_software_history') THEN
    REVOKE ALL ON main_it_software_history FROM anon, authenticated, PUBLIC;
    GRANT SELECT, INSERT, UPDATE, DELETE ON main_it_software_history TO authenticated;
    GRANT ALL ON main_it_software_history TO service_role;
    RAISE NOTICE '✅ main_it_software_history: 직원 전용';
  END IF;
END $$;

-- 변경로그
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'admin_change_log') THEN
    REVOKE ALL ON admin_change_log FROM anon, authenticated, PUBLIC;
    GRANT SELECT, INSERT, UPDATE, DELETE ON admin_change_log TO authenticated;
    GRANT ALL ON admin_change_log TO service_role;
    RAISE NOTICE '✅ admin_change_log: 직원 전용';
  END IF;
END $$;

-- 피드백
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'admin_feedback') THEN
    REVOKE ALL ON admin_feedback FROM anon, authenticated, PUBLIC;
    GRANT SELECT, INSERT, UPDATE, DELETE ON admin_feedback TO authenticated;
    GRANT ALL ON admin_feedback TO service_role;
    RAISE NOTICE '✅ admin_feedback: 직원 전용';
  END IF;
END $$;

-- 파일 관리
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'admin_files') THEN
    REVOKE ALL ON admin_files FROM anon, authenticated, PUBLIC;
    GRANT SELECT, INSERT, UPDATE, DELETE ON admin_files TO authenticated;
    GRANT ALL ON admin_files TO service_role;
    RAISE NOTICE '✅ admin_files: 직원 전용';
  END IF;
END $$;


-- ========================================
-- STEP 5: 설정 완료 확인
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ 테이블 권한 설정 완료!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '📊 설정 결과 요약:';
END $$;

-- 최종 권한 상태 조회
SELECT
  table_name as "테이블명",
  STRING_AGG(
    CASE
      WHEN grantee = 'anon' AND privilege_type = 'SELECT' THEN '👁️손님(보기)'
      WHEN grantee = 'authenticated' AND privilege_type = 'SELECT' THEN '👁️직원(보기)'
      WHEN grantee = 'authenticated' AND privilege_type IN ('INSERT', 'UPDATE', 'DELETE') THEN '🔨직원(편집)'
      WHEN grantee = 'service_role' THEN '🔑관리자(전체)'
    END,
    ', '
  ) as "권한"
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated', 'service_role')
  AND (table_name LIKE 'admin_%' OR table_name LIKE 'main_%')
GROUP BY table_name
ORDER BY
  CASE
    WHEN table_name LIKE 'admin_salary%' THEN 1
    WHEN table_name LIKE 'admin_users%' THEN 2
    WHEN table_name LIKE 'admin_departments%' THEN 3
    WHEN table_name LIKE 'admin_%' THEN 4
    ELSE 5
  END,
  table_name;


-- ========================================
-- 완료 메시지
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '🎉 설정이 완료되었습니다!';
  RAISE NOTICE '';
  RAISE NOTICE '📋 권한 레벨:';
  RAISE NOTICE '  🚫 레벨 1: 민감 정보 (관리자만)';
  RAISE NOTICE '  👁️ 레벨 2: 기본 정보 (읽기만)';
  RAISE NOTICE '  🔨 레벨 3: 업무 데이터 (직원 편집)';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  다음 단계:';
  RAISE NOTICE '  1. 개발 서버 재시작 필요';
  RAISE NOTICE '  2. 로그인 후 기능 테스트';
  RAISE NOTICE '  3. 문제 발생 시 롤백 스크립트 실행';
  RAISE NOTICE '========================================';
END $$;
