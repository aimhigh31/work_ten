-- ========================================
-- 개발 DB 마스터 데이터 추출 SQL
-- ========================================
-- 실행 방법:
-- 1. 개발 Supabase Dashboard SQL Editor에서 실행
-- 2. 각 쿼리를 순서대로 실행하여 결과를 CSV로 다운로드
-- 3. 또는 결과를 복사하여 INSERT 구문 생성
-- ========================================

-- ========================================
-- 1. admin_mastercode_data (마스터코드)
-- ========================================
SELECT * FROM admin_mastercode_data ORDER BY id;

-- ========================================
-- 2. admin_systemsetting_menu (메뉴 설정)
-- ========================================
SELECT * FROM admin_systemsetting_menu ORDER BY display_order;

-- ========================================
-- 3. admin_users_department (부서)
-- ========================================
SELECT * FROM admin_users_department ORDER BY id;

-- ========================================
-- 4. admin_users_rules (역할/권한)
-- ========================================
SELECT * FROM admin_users_rules ORDER BY id;

-- ========================================
-- 5. admin_users_rules_permissions (역할별 메뉴 권한)
-- ========================================
SELECT * FROM admin_users_rules_permissions ORDER BY id;

-- ========================================
-- 6. code_sequences (코드 시퀀스)
-- ========================================
SELECT * FROM code_sequences ORDER BY module_type;
