-- ========================================
-- 🔐 사용자 역할(Role) 기반 권한 관리 시스템 구축
-- ========================================
-- 목적: admin_users_userprofiles에 role_id 추가 및 기본 역할 설정
-- 작성일: 2025-10-19
-- 실행 방법: Supabase Dashboard > SQL Editor에서 실행
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '🔐 역할 기반 권한 시스템 설정 시작...';
  RAISE NOTICE '========================================';
END $$;

-- ========================================
-- STEP 1: admin_users_userprofiles에 role_id 컬럼 추가
-- ========================================

DO $$
BEGIN
  -- role_id 컬럼이 이미 존재하는지 확인
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'admin_users_userprofiles'
    AND column_name = 'role_id'
  ) THEN
    -- role_id 컬럼 추가
    ALTER TABLE admin_users_userprofiles
    ADD COLUMN role_id INTEGER REFERENCES admin_users_rules(id);

    RAISE NOTICE '✅ admin_users_userprofiles.role_id 컬럼 추가 완료';
  ELSE
    RAISE NOTICE 'ℹ️  admin_users_userprofiles.role_id 컬럼이 이미 존재합니다';
  END IF;
END $$;

-- ========================================
-- STEP 2: 인덱스 추가 (성능 최적화)
-- ========================================

DO $$
BEGIN
  -- admin_users_userprofiles.role_id 인덱스
  CREATE INDEX IF NOT EXISTS idx_userprofiles_role_id
  ON admin_users_userprofiles(role_id);

  -- admin_users_rules_permissions 복합 인덱스
  CREATE INDEX IF NOT EXISTS idx_rules_permissions_role_menu
  ON admin_users_rules_permissions(role_id, menu_id);

  RAISE NOTICE '✅ 인덱스 생성 완료';
END $$;

-- ========================================
-- STEP 3: 기본 역할 생성
-- ========================================

DO $$
DECLARE
  v_default_role_id INTEGER;
  v_admin_role_id INTEGER;
  v_manager_role_id INTEGER;
  v_user_role_id INTEGER;
BEGIN
  -- 1. 기본 역할 (일반사용자)
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
    'ROLE-25-DEFAULT',
    '일반사용자',
    '시스템 기본 역할 - 기본 읽기 권한',
    true,
    999,
    'system',
    'system'
  )
  ON CONFLICT (role_code) DO UPDATE
  SET
    role_name = EXCLUDED.role_name,
    role_description = EXCLUDED.role_description,
    updated_by = 'system'
  RETURNING id INTO v_default_role_id;

  RAISE NOTICE '✅ 기본 역할 생성: ROLE-25-DEFAULT (ID: %)', v_default_role_id;

  -- 2. 관리자 역할
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
    'ROLE-25-ADMIN',
    '시스템관리자',
    '모든 메뉴와 기능에 대한 전체 권한',
    true,
    1,
    'system',
    'system'
  )
  ON CONFLICT (role_code) DO UPDATE
  SET
    role_name = EXCLUDED.role_name,
    role_description = EXCLUDED.role_description,
    updated_by = 'system'
  RETURNING id INTO v_admin_role_id;

  RAISE NOTICE '✅ 관리자 역할 생성: ROLE-25-ADMIN (ID: %)', v_admin_role_id;

  -- 3. 팀장 역할
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
    'ROLE-25-MANAGER',
    '팀장',
    '팀 관리 및 데이터 편집 권한',
    true,
    2,
    'system',
    'system'
  )
  ON CONFLICT (role_code) DO UPDATE
  SET
    role_name = EXCLUDED.role_name,
    role_description = EXCLUDED.role_description,
    updated_by = 'system'
  RETURNING id INTO v_manager_role_id;

  RAISE NOTICE '✅ 팀장 역할 생성: ROLE-25-MANAGER (ID: %)', v_manager_role_id;

  -- 4. 일반 사용자 역할
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
    'ROLE-25-USER',
    '일반직원',
    '데이터 조회 및 제한적 편집 권한',
    true,
    3,
    'system',
    'system'
  )
  ON CONFLICT (role_code) DO UPDATE
  SET
    role_name = EXCLUDED.role_name,
    role_description = EXCLUDED.role_description,
    updated_by = 'system'
  RETURNING id INTO v_user_role_id;

  RAISE NOTICE '✅ 일반직원 역할 생성: ROLE-25-USER (ID: %)', v_user_role_id;

END $$;

-- ========================================
-- STEP 4: 기존 사용자들에게 기본 역할 할당
-- ========================================

DO $$
DECLARE
  v_default_role_id INTEGER;
  v_updated_count INTEGER;
BEGIN
  -- 기본 역할 ID 가져오기
  SELECT id INTO v_default_role_id
  FROM admin_users_rules
  WHERE role_code = 'ROLE-25-DEFAULT';

  IF v_default_role_id IS NULL THEN
    RAISE EXCEPTION '❌ 기본 역할을 찾을 수 없습니다';
  END IF;

  -- role_id가 NULL인 사용자들에게 기본 역할 할당
  UPDATE admin_users_userprofiles
  SET
    role_id = v_default_role_id,
    updated_by = 'system'
  WHERE role_id IS NULL;

  GET DIAGNOSTICS v_updated_count = ROW_COUNT;

  RAISE NOTICE '✅ 기존 사용자 %명에게 기본 역할 할당 완료', v_updated_count;
END $$;

-- ========================================
-- STEP 5: 관리자 역할에 전체 권한 부여
-- ========================================

DO $$
DECLARE
  v_admin_role_id INTEGER;
  v_menu_record RECORD;
  v_permission_count INTEGER := 0;
BEGIN
  -- 관리자 역할 ID 가져오기
  SELECT id INTO v_admin_role_id
  FROM admin_users_rules
  WHERE role_code = 'ROLE-25-ADMIN';

  IF v_admin_role_id IS NULL THEN
    RAISE NOTICE '⚠️ 관리자 역할을 찾을 수 없어 권한 부여를 건너뜁니다';
    RETURN;
  END IF;

  -- 기존 관리자 권한 삭제
  DELETE FROM admin_users_rules_permissions
  WHERE role_id = v_admin_role_id;

  -- 모든 활성화된 메뉴에 대해 전체 권한 부여
  FOR v_menu_record IN
    SELECT id
    FROM admin_systemsetting_menu
    WHERE is_enabled = true
  LOOP
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
      v_admin_role_id,
      v_menu_record.id,
      true,
      true,
      true,
      'system',
      'system'
    )
    ON CONFLICT (role_id, menu_id) DO UPDATE
    SET
      can_read = true,
      can_write = true,
      can_full = true,
      updated_by = 'system';

    v_permission_count := v_permission_count + 1;
  END LOOP;

  RAISE NOTICE '✅ 관리자 역할에 %개 메뉴 전체 권한 부여 완료', v_permission_count;
END $$;

-- ========================================
-- STEP 6: 팀장 역할에 기본 권한 부여
-- ========================================

DO $$
DECLARE
  v_manager_role_id INTEGER;
  v_menu_record RECORD;
  v_permission_count INTEGER := 0;
BEGIN
  -- 팀장 역할 ID 가져오기
  SELECT id INTO v_manager_role_id
  FROM admin_users_rules
  WHERE role_code = 'ROLE-25-MANAGER';

  IF v_manager_role_id IS NULL THEN
    RAISE NOTICE '⚠️ 팀장 역할을 찾을 수 없어 권한 부여를 건너뜁니다';
    RETURN;
  END IF;

  -- 기존 팀장 권한 삭제
  DELETE FROM admin_users_rules_permissions
  WHERE role_id = v_manager_role_id;

  -- 메인메뉴에 읽기/쓰기 권한 부여 (삭제 권한 제외)
  FOR v_menu_record IN
    SELECT id
    FROM admin_systemsetting_menu
    WHERE is_enabled = true
    AND menu_category = '메인메뉴'
  LOOP
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
      v_manager_role_id,
      v_menu_record.id,
      true,
      true,
      false,  -- 전체 권한은 없음
      'system',
      'system'
    );

    v_permission_count := v_permission_count + 1;
  END LOOP;

  RAISE NOTICE '✅ 팀장 역할에 %개 메뉴 읽기/쓰기 권한 부여 완료', v_permission_count;
END $$;

-- ========================================
-- STEP 7: 일반직원 역할에 읽기 권한만 부여
-- ========================================

DO $$
DECLARE
  v_user_role_id INTEGER;
  v_menu_record RECORD;
  v_permission_count INTEGER := 0;
BEGIN
  -- 일반직원 역할 ID 가져오기
  SELECT id INTO v_user_role_id
  FROM admin_users_rules
  WHERE role_code = 'ROLE-25-USER';

  IF v_user_role_id IS NULL THEN
    RAISE NOTICE '⚠️ 일반직원 역할을 찾을 수 없어 권한 부여를 건너뜁니다';
    RETURN;
  END IF;

  -- 기존 일반직원 권한 삭제
  DELETE FROM admin_users_rules_permissions
  WHERE role_id = v_user_role_id;

  -- 메인메뉴에 읽기 권한만 부여
  FOR v_menu_record IN
    SELECT id
    FROM admin_systemsetting_menu
    WHERE is_enabled = true
    AND menu_category = '메인메뉴'
  LOOP
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
      v_user_role_id,
      v_menu_record.id,
      true,
      false,  -- 쓰기 권한 없음
      false,  -- 전체 권한 없음
      'system',
      'system'
    );

    v_permission_count := v_permission_count + 1;
  END LOOP;

  RAISE NOTICE '✅ 일반직원 역할에 %개 메뉴 읽기 권한 부여 완료', v_permission_count;
END $$;

-- ========================================
-- 완료 메시지 및 확인
-- ========================================

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ 역할 기반 권한 시스템 설정 완료!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '생성된 역할:';
  RAISE NOTICE '  1. ROLE-25-ADMIN    : 시스템관리자 (전체 권한)';
  RAISE NOTICE '  2. ROLE-25-MANAGER  : 팀장 (읽기/쓰기)';
  RAISE NOTICE '  3. ROLE-25-USER     : 일반직원 (읽기만)';
  RAISE NOTICE '  4. ROLE-25-DEFAULT  : 기본 역할';
  RAISE NOTICE '';
  RAISE NOTICE '다음 단계:';
  RAISE NOTICE '  1. 사용자관리에서 각 사용자에게 적절한 역할 할당';
  RAISE NOTICE '  2. 역할관리에서 메뉴별 권한 세부 조정';
  RAISE NOTICE '  3. 애플리케이션 재시작 (npm run dev)';
  RAISE NOTICE '========================================';
END $$;

-- ========================================
-- 설정 확인 쿼리
-- ========================================

-- 1. 생성된 역할 확인
SELECT
  id,
  role_code,
  role_name,
  role_description,
  display_order,
  is_active
FROM admin_users_rules
WHERE role_code LIKE 'ROLE-25-%'
ORDER BY display_order;

-- 2. 역할별 권한 개수 확인
SELECT
  r.role_code,
  r.role_name,
  COUNT(p.id) as permission_count,
  COUNT(CASE WHEN p.can_read THEN 1 END) as read_count,
  COUNT(CASE WHEN p.can_write THEN 1 END) as write_count,
  COUNT(CASE WHEN p.can_full THEN 1 END) as full_count
FROM admin_users_rules r
LEFT JOIN admin_users_rules_permissions p ON r.id = p.role_id
WHERE r.role_code LIKE 'ROLE-25-%'
GROUP BY r.id, r.role_code, r.role_name
ORDER BY r.display_order;

-- 3. role_id가 할당된 사용자 수 확인
SELECT
  r.role_name,
  COUNT(u.id) as user_count
FROM admin_users_rules r
LEFT JOIN admin_users_userprofiles u ON r.id = u.role_id
WHERE r.role_code LIKE 'ROLE-25-%'
GROUP BY r.id, r.role_name
ORDER BY r.display_order;
