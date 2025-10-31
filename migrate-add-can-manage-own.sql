-- DB 권한 컬럼 통합 마이그레이션
-- can_create_data와 can_edit_own을 can_manage_own으로 통합

-- 1. can_manage_own 컬럼 추가
ALTER TABLE admin_users_rules_permissions
ADD COLUMN IF NOT EXISTS can_manage_own BOOLEAN DEFAULT false;

-- 2. 기존 데이터 마이그레이션
UPDATE admin_users_rules_permissions
SET can_manage_own = (can_create_data OR can_edit_own)
WHERE can_create_data = true OR can_edit_own = true;

-- 3. 결과 확인
SELECT
  COUNT(*) as total,
  COUNT(CASE WHEN can_manage_own = true THEN 1 END) as manage_own_count
FROM admin_users_rules_permissions;

-- 4. 샘플 데이터 확인
SELECT
  role_id,
  menu_id,
  can_create_data,
  can_edit_own,
  can_manage_own,
  can_edit_others
FROM admin_users_rules_permissions
ORDER BY role_id, menu_id
LIMIT 10;
