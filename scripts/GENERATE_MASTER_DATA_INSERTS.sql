-- ========================================
-- 마스터 데이터 INSERT 구문 자동 생성
-- ========================================
-- 실행 방법:
-- 1. 개발 Supabase Dashboard SQL Editor에서 각 쿼리 실행
-- 2. 결과를 복사하여 master-data.sql 파일로 저장
-- 3. 운영 DB에서 master-data.sql 실행
-- ========================================

-- ========================================
-- 1. admin_mastercode_data
-- ========================================
SELECT 'INSERT INTO admin_mastercode_data (id, codetype, group_code, group_code_name, group_code_description, group_code_status, group_code_order, subcode, subcode_name, subcode_description, subcode_status, subcode_remark, subcode_order, is_active, created_at, updated_at, created_by, updated_by) VALUES (' ||
  id || ', ' ||
  quote_literal(codetype) || ', ' ||
  quote_literal(group_code) || ', ' ||
  quote_literal(group_code_name) || ', ' ||
  quote_literal(group_code_description) || ', ' ||
  quote_literal(group_code_status) || ', ' ||
  group_code_order || ', ' ||
  quote_literal(subcode) || ', ' ||
  quote_literal(subcode_name) || ', ' ||
  quote_literal(subcode_description) || ', ' ||
  quote_literal(subcode_status) || ', ' ||
  quote_literal(subcode_remark) || ', ' ||
  subcode_order || ', ' ||
  is_active || ', ' ||
  quote_literal(created_at::text) || '::timestamptz, ' ||
  quote_literal(updated_at::text) || '::timestamptz, ' ||
  quote_literal(created_by) || ', ' ||
  quote_literal(updated_by) ||
  ');' AS insert_statement
FROM admin_mastercode_data
ORDER BY id;


-- ========================================
-- 2. admin_systemsetting_menu
-- ========================================
SELECT 'INSERT INTO admin_systemsetting_menu (id, created_at, updated_at, menu_level, menu_category, menu_icon, menu_page, menu_description, menu_url, is_enabled, display_order, created_by, updated_by, menu_database) VALUES (' ||
  id || ', ' ||
  quote_literal(created_at::text) || '::timestamptz, ' ||
  quote_literal(updated_at::text) || '::timestamptz, ' ||
  menu_level || ', ' ||
  quote_literal(menu_category) || ', ' ||
  COALESCE(quote_literal(menu_icon), 'NULL') || ', ' ||
  quote_literal(menu_page) || ', ' ||
  COALESCE(quote_literal(menu_description), 'NULL') || ', ' ||
  quote_literal(menu_url) || ', ' ||
  is_enabled || ', ' ||
  display_order || ', ' ||
  quote_literal(created_by) || ', ' ||
  quote_literal(updated_by) || ', ' ||
  COALESCE(quote_literal(menu_database), 'NULL') ||
  ');' AS insert_statement
FROM admin_systemsetting_menu
ORDER BY display_order;


-- ========================================
-- 3. admin_users_department
-- ========================================
SELECT 'INSERT INTO admin_users_department (id, created_at, updated_at, department_code, department_name, parent_department_id, department_level, display_order, manager_name, manager_email, phone, location, description, is_active, is_system, created_by, updated_by, metadata) VALUES (' ||
  id || ', ' ||
  quote_literal(created_at::text) || '::timestamptz, ' ||
  quote_literal(updated_at::text) || '::timestamptz, ' ||
  quote_literal(department_code) || ', ' ||
  quote_literal(department_name) || ', ' ||
  COALESCE(parent_department_id::text, 'NULL') || ', ' ||
  department_level || ', ' ||
  display_order || ', ' ||
  COALESCE(quote_literal(manager_name), 'NULL') || ', ' ||
  COALESCE(quote_literal(manager_email), 'NULL') || ', ' ||
  COALESCE(quote_literal(phone), 'NULL') || ', ' ||
  COALESCE(quote_literal(location), 'NULL') || ', ' ||
  COALESCE(quote_literal(description), 'NULL') || ', ' ||
  is_active || ', ' ||
  is_system || ', ' ||
  quote_literal(created_by) || ', ' ||
  quote_literal(updated_by) || ', ' ||
  COALESCE(quote_literal(metadata::text) || '::jsonb', 'NULL') ||
  ');' AS insert_statement
FROM admin_users_department
ORDER BY id;


-- ========================================
-- 4. admin_users_rules
-- ========================================
SELECT 'INSERT INTO admin_users_rules (id, created_at, updated_at, role_code, role_name, role_description, permissions, is_active, is_system, display_order, created_by, updated_by, metadata) VALUES (' ||
  id || ', ' ||
  quote_literal(created_at::text) || '::timestamptz, ' ||
  quote_literal(updated_at::text) || '::timestamptz, ' ||
  quote_literal(role_code) || ', ' ||
  quote_literal(role_name) || ', ' ||
  COALESCE(quote_literal(role_description), 'NULL') || ', ' ||
  quote_literal(permissions::text) || '::jsonb, ' ||
  is_active || ', ' ||
  is_system || ', ' ||
  display_order || ', ' ||
  quote_literal(created_by) || ', ' ||
  quote_literal(updated_by) || ', ' ||
  quote_literal(metadata::text) || '::jsonb' ||
  ');' AS insert_statement
FROM admin_users_rules
ORDER BY id;


-- ========================================
-- 5. admin_users_rules_permissions
-- ========================================
SELECT 'INSERT INTO admin_users_rules_permissions (id, role_id, menu_id, can_read, can_write, can_full, created_at, updated_at, created_by, updated_by, can_view_category, can_read_data, can_create_data, can_edit_own, can_edit_others, can_manage_own) VALUES (' ||
  id || ', ' ||
  role_id || ', ' ||
  menu_id || ', ' ||
  can_read || ', ' ||
  can_write || ', ' ||
  can_full || ', ' ||
  quote_literal(created_at::text) || '::timestamptz, ' ||
  quote_literal(updated_at::text) || '::timestamptz, ' ||
  quote_literal(created_by) || ', ' ||
  quote_literal(updated_by) || ', ' ||
  can_view_category || ', ' ||
  can_read_data || ', ' ||
  can_create_data || ', ' ||
  can_edit_own || ', ' ||
  can_edit_others || ', ' ||
  can_manage_own ||
  ');' AS insert_statement
FROM admin_users_rules_permissions
ORDER BY id;


-- ========================================
-- 6. code_sequences
-- ========================================
SELECT 'INSERT INTO code_sequences (id, module_type, year, current_sequence, created_at, updated_at) VALUES (' ||
  quote_literal(id::text) || '::uuid, ' ||
  quote_literal(module_type) || ', ' ||
  year || ', ' ||
  current_sequence || ', ' ||
  quote_literal(created_at::text) || '::timestamptz, ' ||
  quote_literal(updated_at::text) || '::timestamptz' ||
  ');' AS insert_statement
FROM code_sequences
ORDER BY module_type;
