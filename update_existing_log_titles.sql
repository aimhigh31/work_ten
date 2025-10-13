-- 기존 VOC 로그의 title을 description에서 추출하여 업데이트
-- (VOC관리 페이지의 로그만 대상)

UPDATE common_log_data
SET title =
  CASE
    -- description에서 괄호 안의 내용 추출 (예: "VOC관리 요청내용(IT-VOC-25-001)이..." -> "요청내용")
    WHEN description ~ '\(.*?\)' THEN
      REGEXP_REPLACE(
        SUBSTRING(description FROM 'VOC관리 (.*?)\('),
        '^\s+|\s+$',
        '',
        'g'
      )
    ELSE description
  END
WHERE page = 'it_voc'
  AND title IS NULL;

-- 확인용 쿼리
SELECT id, page, title, description
FROM common_log_data
WHERE page = 'it_voc'
ORDER BY created_at DESC
LIMIT 10;
