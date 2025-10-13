-- 변경로그 데이터 확인
SELECT COUNT(*) as total_count FROM common_log_data;

-- security_education 페이지 로그 확인
SELECT COUNT(*) as security_education_count
FROM common_log_data
WHERE page = 'security_education';

-- 최근 10개 로그 확인
SELECT id, page, record_id, action_type, created_at
FROM common_log_data
WHERE page = 'security_education'
ORDER BY created_at DESC
LIMIT 10;
