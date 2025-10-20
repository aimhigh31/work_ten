-- ========================================
-- 🧪 권한 시스템 테스트 데이터 생성
-- ========================================
-- 목적: 역할 기반 권한 시스템 테스트용 데이터
-- 작성일: 2025-10-19
-- 실행 방법: Supabase Dashboard > SQL Editor에서 실행
-- ⚠️ 주의: 테스트 목적으로만 사용, 프로덕션 환경에서는 실행하지 말 것
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '🧪 테스트 데이터 생성 시작...';
  RAISE NOTICE '========================================';
END $$;

-- ========================================
-- STEP 1: 테스트 역할 생성
-- ========================================

DO $$
DECLARE
  v_read_role_id INTEGER;
  v_write_role_id INTEGER;
  v_full_role_id INTEGER;
BEGIN
  -- 1. 읽기 전용 역할
  INSERT INTO admin_users_rules (
    role_code,
    role_name,
    role_description,
    is_active,
    display_order,
    created_by,
    updated_by
  )
  VALUES (
    'ROLE-TEST-READ',
    '[테스트] 읽기전용',
    '테스트용 - 읽기만 가능한 역할',
    true,
    90,
    'system-test',
    'system-test'
  )
  ON CONFLICT (role_code) DO UPDATE
  SET
    role_name = EXCLUDED.role_name,
    role_description = EXCLUDED.role_description,
    updated_by = 'system-test'
  RETURNING id INTO v_read_role_id;

  RAISE NOTICE '✅ 테스트 역할 생성: ROLE-TEST-READ (ID: %)', v_read_role_id;

  -- 2. 읽기/쓰기 역할
  INSERT INTO admin_users_rules (
    role_code,
    role_name,
    role_description,
    is_active,
    display_order,
    created_by,
    updated_by
  )
  VALUES (
    'ROLE-TEST-WRITE',
    '[테스트] 읽기쓰기',
    '테스트용 - 읽기/쓰기 가능한 역할',
    true,
    91,
    'system-test',
    'system-test'
  )
  ON CONFLICT (role_code) DO UPDATE
  SET
    role_name = EXCLUDED.role_name,
    role_description = EXCLUDED.role_description,
    updated_by = 'system-test'
  RETURNING id INTO v_write_role_id;

  RAISE NOTICE '✅ 테스트 역할 생성: ROLE-TEST-WRITE (ID: %)', v_write_role_id;

  -- 3. 전체 권한 역할
  INSERT INTO admin_users_rules (
    role_code,
    role_name,
    role_description,
    is_active,
    display_order,
    created_by,
    updated_by
  )
  VALUES (
    'ROLE-TEST-FULL',
    '[테스트] 전체권한',
    '테스트용 - 모든 권한을 가진 역할',
    true,
    92,
    'system-test',
    'system-test'
  )
  ON CONFLICT (role_code) DO UPDATE
  SET
    role_name = EXCLUDED.role_name,
    role_description = EXCLUDED.role_description,
    updated_by = 'system-test'
  RETURNING id INTO v_full_role_id;

  RAISE NOTICE '✅ 테스트 역할 생성: ROLE-TEST-FULL (ID: %)', v_full_role_id;
END $$;

-- ========================================
-- STEP 2: 테스트 권한 설정 - 개인교육관리
-- ========================================

DO $$
DECLARE
  v_read_role_id INTEGER;
  v_write_role_id INTEGER;
  v_full_role_id INTEGER;
  v_menu_id INTEGER;
BEGIN
  -- 역할 ID 가져오기
  SELECT id INTO v_read_role_id FROM admin_users_rules WHERE role_code = 'ROLE-TEST-READ';
  SELECT id INTO v_write_role_id FROM admin_users_rules WHERE role_code = 'ROLE-TEST-WRITE';
  SELECT id INTO v_full_role_id FROM admin_users_rules WHERE role_code = 'ROLE-TEST-FULL';

  -- 메뉴 ID 가져오기 (개인교육관리)
  SELECT id INTO v_menu_id
  FROM admin_systemsetting_menu
  WHERE menu_url = '/apps/education'
  LIMIT 1;

  IF v_menu_id IS NULL THEN
    RAISE NOTICE '⚠️ 개인교육관리 메뉴를 찾을 수 없습니다';
    RETURN;
  END IF;

  -- 읽기 전용 역할: 읽기만 허용
  INSERT INTO admin_users_rules_permissions (
    role_id,
    menu_id,
    can_read,
    can_write,
    can_full,
    created_by,
    updated_by
  )
  VALUES (
    v_read_role_id,
    v_menu_id,
    true,
    false,
    false,
    'system-test',
    'system-test'
  )
  ON CONFLICT (role_id, menu_id) DO UPDATE
  SET
    can_read = true,
    can_write = false,
    can_full = false,
    updated_by = 'system-test';

  RAISE NOTICE '✅ ROLE-TEST-READ: 개인교육관리 읽기 권한 부여';

  -- 읽기/쓰기 역할: 읽기/쓰기 허용
  INSERT INTO admin_users_rules_permissions (
    role_id,
    menu_id,
    can_read,
    can_write,
    can_full,
    created_by,
    updated_by
  )
  VALUES (
    v_write_role_id,
    v_menu_id,
    true,
    true,
    false,
    'system-test',
    'system-test'
  )
  ON CONFLICT (role_id, menu_id) DO UPDATE
  SET
    can_read = true,
    can_write = true,
    can_full = false,
    updated_by = 'system-test';

  RAISE NOTICE '✅ ROLE-TEST-WRITE: 개인교육관리 읽기/쓰기 권한 부여';

  -- 전체 권한 역할: 모든 권한 허용
  INSERT INTO admin_users_rules_permissions (
    role_id,
    menu_id,
    can_read,
    can_write,
    can_full,
    created_by,
    updated_by
  )
  VALUES (
    v_full_role_id,
    v_menu_id,
    true,
    true,
    true,
    'system-test',
    'system-test'
  )
  ON CONFLICT (role_id, menu_id) DO UPDATE
  SET
    can_read = true,
    can_write = true,
    can_full = true,
    updated_by = 'system-test';

  RAISE NOTICE '✅ ROLE-TEST-FULL: 개인교육관리 전체 권한 부여';
END $$;

-- ========================================
-- STEP 3: 테스트 권한 설정 - 업무관리
-- ========================================

DO $$
DECLARE
  v_read_role_id INTEGER;
  v_write_role_id INTEGER;
  v_full_role_id INTEGER;
  v_menu_id INTEGER;
BEGIN
  -- 역할 ID 가져오기
  SELECT id INTO v_read_role_id FROM admin_users_rules WHERE role_code = 'ROLE-TEST-READ';
  SELECT id INTO v_write_role_id FROM admin_users_rules WHERE role_code = 'ROLE-TEST-WRITE';
  SELECT id INTO v_full_role_id FROM admin_users_rules WHERE role_code = 'ROLE-TEST-FULL';

  -- 메뉴 ID 가져오기 (업무관리)
  SELECT id INTO v_menu_id
  FROM admin_systemsetting_menu
  WHERE menu_url LIKE '%task%' OR menu_page LIKE '%업무%'
  LIMIT 1;

  IF v_menu_id IS NULL THEN
    RAISE NOTICE '⚠️ 업무관리 메뉴를 찾을 수 없습니다';
    RETURN;
  END IF;

  -- 읽기 전용 역할: 권한 없음 (테스트용)
  DELETE FROM admin_users_rules_permissions
  WHERE role_id = v_read_role_id AND menu_id = v_menu_id;

  RAISE NOTICE '✅ ROLE-TEST-READ: 업무관리 권한 없음 (테스트)';

  -- 읽기/쓰기 역할: 읽기만 허용 (테스트용)
  INSERT INTO admin_users_rules_permissions (
    role_id,
    menu_id,
    can_read,
    can_write,
    can_full,
    created_by,
    updated_by
  )
  VALUES (
    v_write_role_id,
    v_menu_id,
    true,
    false,
    false,
    'system-test',
    'system-test'
  )
  ON CONFLICT (role_id, menu_id) DO UPDATE
  SET
    can_read = true,
    can_write = false,
    can_full = false,
    updated_by = 'system-test';

  RAISE NOTICE '✅ ROLE-TEST-WRITE: 업무관리 읽기 권한 부여';

  -- 전체 권한 역할: 읽기/쓰기 허용
  INSERT INTO admin_users_rules_permissions (
    role_id,
    menu_id,
    can_read,
    can_write,
    can_full,
    created_by,
    updated_by
  )
  VALUES (
    v_full_role_id,
    v_menu_id,
    true,
    true,
    true,
    'system-test',
    'system-test'
  )
  ON CONFLICT (role_id, menu_id) DO UPDATE
  SET
    can_read = true,
    can_write = true,
    can_full = true,
    updated_by = 'system-test';

  RAISE NOTICE '✅ ROLE-TEST-FULL: 업무관리 전체 권한 부여';
END $$;

-- ========================================
-- 완료 메시지
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ 테스트 데이터 생성 완료!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '생성된 테스트 역할:';
  RAISE NOTICE '  1. ROLE-TEST-READ  : 개인교육관리만 읽기';
  RAISE NOTICE '  2. ROLE-TEST-WRITE : 개인교육관리 읽기/쓰기, 업무관리 읽기';
  RAISE NOTICE '  3. ROLE-TEST-FULL  : 모든 권한';
  RAISE NOTICE '';
  RAISE NOTICE '테스트 방법:';
  RAISE NOTICE '  1. 사용자관리에서 테스트 사용자에게 역할 할당';
  RAISE NOTICE '  2. 해당 사용자로 로그인';
  RAISE NOTICE '  3. 메뉴 접근 및 버튼 표시 여부 확인';
  RAISE NOTICE '  4. API 호출 시 권한 에러 확인';
  RAISE NOTICE '';
  RAISE NOTICE '⚠️ 테스트 완료 후 삭제 방법:';
  RAISE NOTICE '  DELETE FROM admin_users_rules WHERE role_code LIKE ''ROLE-TEST-%'';';
  RAISE NOTICE '========================================';
END $$;

-- ========================================
-- 테스트 데이터 확인
-- ========================================

-- 1. 생성된 테스트 역할 확인
SELECT
  id,
  role_code,
  role_name,
  role_description,
  is_active
FROM admin_users_rules
WHERE role_code LIKE 'ROLE-TEST-%'
ORDER BY role_code;

-- 2. 테스트 역할별 권한 확인
SELECT
  r.role_code,
  r.role_name,
  m.menu_page,
  m.menu_url,
  p.can_read,
  p.can_write,
  p.can_full
FROM admin_users_rules r
LEFT JOIN admin_users_rules_permissions p ON r.id = p.role_id
LEFT JOIN admin_systemsetting_menu m ON p.menu_id = m.id
WHERE r.role_code LIKE 'ROLE-TEST-%'
ORDER BY r.role_code, m.menu_page;
