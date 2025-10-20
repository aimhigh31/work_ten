-- admin_systemsetting_menu 테이블 구조 확인
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'admin_systemsetting_menu'
ORDER BY ordinal_position;

-- 샘플 데이터 확인
SELECT * FROM admin_systemsetting_menu
WHERE menu_name LIKE '%사용자%' OR menu_name LIKE '%설정%'
LIMIT 5;
