/**
 * 세밀한 권한 제어를 위한 DB 스키마 확장
 *
 * 기존: can_read, can_write, can_full (3개)
 * 추가: can_view_category, can_read_data, can_create_data, can_edit_own, can_edit_others (5개)
 *
 * 실행: psql 또는 Supabase SQL Editor에서 실행
 */

-- 1. admin_users_rules_permissions 테이블에 5개 새 컬럼 추가
ALTER TABLE admin_users_rules_permissions
ADD COLUMN IF NOT EXISTS can_view_category BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_read_data BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_create_data BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_edit_own BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS can_edit_others BOOLEAN DEFAULT false;

-- 2. 기존 데이터 마이그레이션 (하위 호환성)
-- can_read가 true면 can_view_category와 can_read_data를 true로 설정
UPDATE admin_users_rules_permissions
SET
  can_view_category = can_read,
  can_read_data = can_read
WHERE can_read = true;

-- can_write가 true면 can_create_data와 can_edit_own을 true로 설정
UPDATE admin_users_rules_permissions
SET
  can_create_data = can_write,
  can_edit_own = can_write
WHERE can_write = true;

-- can_full이 true면 can_edit_others를 true로 설정
UPDATE admin_users_rules_permissions
SET
  can_edit_others = can_full
WHERE can_full = true;

-- 3. 인덱스 추가 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_permissions_view_category
ON admin_users_rules_permissions(role_id, menu_id, can_view_category);

CREATE INDEX IF NOT EXISTS idx_permissions_read_data
ON admin_users_rules_permissions(role_id, menu_id, can_read_data);

CREATE INDEX IF NOT EXISTS idx_permissions_create_data
ON admin_users_rules_permissions(role_id, menu_id, can_create_data);

CREATE INDEX IF NOT EXISTS idx_permissions_edit_own
ON admin_users_rules_permissions(role_id, menu_id, can_edit_own);

CREATE INDEX IF NOT EXISTS idx_permissions_edit_others
ON admin_users_rules_permissions(role_id, menu_id, can_edit_others);

-- 4. 확인
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'admin_users_rules_permissions'
  AND column_name LIKE 'can_%'
ORDER BY column_name;

COMMENT ON COLUMN admin_users_rules_permissions.can_view_category IS '카테고리 보기 권한';
COMMENT ON COLUMN admin_users_rules_permissions.can_read_data IS '데이터 조회 권한';
COMMENT ON COLUMN admin_users_rules_permissions.can_create_data IS '데이터 새로쓰기 권한';
COMMENT ON COLUMN admin_users_rules_permissions.can_edit_own IS '나의 데이터 편집 권한';
COMMENT ON COLUMN admin_users_rules_permissions.can_edit_others IS '타인 데이터 편집 권한';
