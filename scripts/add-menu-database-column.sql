-- admin_systemsetting_menu 테이블에 menu_database 컬럼 추가
-- 실행 위치: Supabase Dashboard > SQL Editor 또는 node scripts/add-menu-database-column.js

-- 1. menu_database 컬럼 추가 (TEXT 타입, NULL 허용)
ALTER TABLE admin_systemsetting_menu
ADD COLUMN IF NOT EXISTS menu_database TEXT;

-- 2. 컬럼 추가 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'admin_systemsetting_menu'
AND column_name = 'menu_database';

-- 3. 기존 데이터 확인 (선택사항)
SELECT id, menu_page, menu_database
FROM admin_systemsetting_menu
LIMIT 5;
