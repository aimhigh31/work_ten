-- 최근 50개만 남기고 오래된 데이터 삭제
DELETE FROM common_log_data
WHERE id NOT IN (
  SELECT id FROM common_log_data
  ORDER BY created_at DESC
  LIMIT 50
);
