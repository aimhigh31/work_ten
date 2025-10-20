-- ========================================
-- 사용자설정 페이지 접근 권한 추가 (수정됨)
-- 대상: jsan (jaesikan@nexplus.co.kr) - ROLE-25-ADMIN
-- ========================================

DO $$
DECLARE
  v_admin_role_id INTEGER;
  v_menu_id INTEGER;
  v_existing_count INTEGER;
BEGIN
  -- 1. 시스템 관리자 역할 ID 조회
  SELECT id INTO v_admin_role_id
  FROM admin_users_rules
  WHERE role_code = 'ROLE-25-ADMIN';

  IF v_admin_role_id IS NULL THEN
    RAISE EXCEPTION '❌ ROLE-25-ADMIN 역할을 찾을 수 없습니다.';
  END IF;

  RAISE NOTICE '✅ 역할 ID: % (ROLE-25-ADMIN)', v_admin_role_id;

  -- 2. 사용자설정 메뉴 ID 조회 (수정: page_key → menu_url)
  SELECT id INTO v_menu_id
  FROM admin_systemsetting_menu
  WHERE menu_url = '/admin-panel/user-settings'
     OR menu_name LIKE '%사용자설정%'
     OR menu_name LIKE '%사용자 설정%';

  IF v_menu_id IS NULL THEN
    RAISE EXCEPTION '❌ 사용자설정 메뉴를 찾을 수 없습니다.';
  END IF;

  RAISE NOTICE '✅ 메뉴 ID: % (사용자설정)', v_menu_id;

  -- 3. 기존 권한 확인
  SELECT COUNT(*) INTO v_existing_count
  FROM admin_users_rules_permissions
  WHERE role_id = v_admin_role_id
    AND menu_id = v_menu_id;

  IF v_existing_count > 0 THEN
    RAISE NOTICE '⚠️  이미 권한이 존재합니다. 업데이트합니다.';

    -- 기존 권한 업데이트 (전체 권한으로)
    UPDATE admin_users_rules_permissions
    SET
      can_read = true,
      can_write = true,
      can_full = true,
      updated_at = NOW(),
      updated_by = 'system'
    WHERE role_id = v_admin_role_id
      AND menu_id = v_menu_id;

    RAISE NOTICE '✅ 권한이 업데이트되었습니다.';
  ELSE
    -- 새 권한 추가 (전체 권한)
    INSERT INTO admin_users_rules_permissions (
      role_id,
      menu_id,
      can_read,
      can_write,
      can_full,
      created_at,
      created_by,
      updated_at,
      updated_by
    ) VALUES (
      v_admin_role_id,
      v_menu_id,
      true,  -- 읽기 권한
      true,  -- 쓰기 권한
      true,  -- 전체 권한
      NOW(),
      'system',
      NOW(),
      'system'
    );

    RAISE NOTICE '✅ 새 권한이 추가되었습니다.';
  END IF;

  -- 4. 결과 확인
  RAISE NOTICE '========================================';
  RAISE NOTICE '📊 권한 추가 완료';
  RAISE NOTICE '👤 사용자: jsan (jaesikan@nexplus.co.kr)';
  RAISE NOTICE '🎭 역할: ROLE-25-ADMIN (시스템관리자)';
  RAISE NOTICE '📄 메뉴: 사용자설정 (/admin-panel/user-settings)';
  RAISE NOTICE '✅ 권한: READ, WRITE, FULL';
  RAISE NOTICE '========================================';

END $$;

-- 최종 확인 쿼리 (수정: page_key → menu_url)
SELECT
  r.role_name AS "역할명",
  m.menu_name AS "메뉴명",
  m.menu_url AS "페이지 경로",
  p.can_read AS "읽기",
  p.can_write AS "쓰기",
  p.can_full AS "전체"
FROM admin_users_rules_permissions p
JOIN admin_users_rules r ON p.role_id = r.id
JOIN admin_systemsetting_menu m ON p.menu_id = m.id
WHERE r.role_code = 'ROLE-25-ADMIN'
  AND (m.menu_url = '/admin-panel/user-settings' OR m.menu_name LIKE '%사용자설정%')
ORDER BY m.menu_name;
