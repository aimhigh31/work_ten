-- ========================================
-- 🔄 Supabase 테이블 권한 롤백 스크립트
-- ========================================
-- 목적: 문제 발생 시 모든 테이블 권한을 원래대로 복구
-- 작성일: 2025-10-19
-- 실행 방법: Supabase Dashboard > SQL Editor에서 실행
-- ⚠️ 주의: 이 스크립트는 모든 제한을 제거합니다
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔄 테이블 권한 롤백 시작...';
  RAISE NOTICE '⚠️  모든 테이블을 authenticated에게 전체 권한 부여';
  RAISE NOTICE '========================================';
END $$;

-- ========================================
-- 모든 public 스키마 테이블에 대한 권한 복구
-- ========================================

-- authenticated (로그인한 사용자)에게 모든 권한 부여
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

-- anon (로그인 안한 사용자)에게도 읽기 권한 부여
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

-- service_role은 항상 모든 권한 유지
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ 모든 테이블 권한이 복구되었습니다';
  RAISE NOTICE '';
  RAISE NOTICE '현재 권한 상태:';
  RAISE NOTICE '  👤 anon (비로그인): SELECT (읽기)';
  RAISE NOTICE '  🔑 authenticated (로그인): ALL (전체)';
  RAISE NOTICE '  🔐 service_role (관리자): ALL (전체)';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️  보안 주의:';
  RAISE NOTICE '  - 현재 모든 로그인 사용자가 모든 데이터 수정 가능';
  RAISE NOTICE '  - 프로덕션 환경에서는 권한 재설정 권장';
  RAISE NOTICE '========================================';
END $$;

-- 현재 권한 상태 확인
SELECT
  table_name as "테이블명",
  STRING_AGG(
    CASE
      WHEN grantee = 'anon' THEN '손님(읽기)'
      WHEN grantee = 'authenticated' THEN '직원(전체)'
      WHEN grantee = 'service_role' THEN '관리자(전체)'
    END,
    ', '
  ) as "복구된_권한"
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND grantee IN ('anon', 'authenticated', 'service_role')
  AND (table_name LIKE 'admin_%' OR table_name LIKE 'main_%')
GROUP BY table_name
ORDER BY table_name
LIMIT 20;
