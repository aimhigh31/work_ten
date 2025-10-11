-- admin_checklist_data 테이블 관련 유용한 SQL 쿼리들
-- Supabase SQL Editor에서 직접 실행할 수 있습니다.

-- 1. 전체 데이터 조회 (최신순)
SELECT
  id, no, code, department, work_content, description,
  status, team, assignee, progress, completed_date,
  created_at, updated_at
FROM admin_checklist_data
ORDER BY no DESC;

-- 2. 상태별 조회
SELECT * FROM admin_checklist_data WHERE status = '진행' ORDER BY no;

-- 3. 팀별 조회
SELECT * FROM admin_checklist_data WHERE team = '개발팀' ORDER BY no;

-- 4. 담당자별 조회
SELECT * FROM admin_checklist_data WHERE assignee = 'USR001' ORDER BY no;

-- 5. 진행률별 조회 (50% 이상)
SELECT * FROM admin_checklist_data WHERE progress >= 50 ORDER BY progress DESC;

-- 6. 완료된 항목 조회
SELECT * FROM admin_checklist_data
WHERE status = '완료' AND completed_date IS NOT NULL
ORDER BY completed_date DESC;

-- 7. 첨부파일이 있는 항목 조회
SELECT id, code, work_content, attachments
FROM admin_checklist_data
WHERE attachments IS NOT NULL;

-- 8. 통계 쿼리들

-- 상태별 통계
SELECT status, COUNT(*) as count, AVG(progress) as avg_progress
FROM admin_checklist_data
GROUP BY status
ORDER BY count DESC;

-- 팀별 통계
SELECT team, COUNT(*) as count, AVG(progress) as avg_progress
FROM admin_checklist_data
GROUP BY team
ORDER BY count DESC;

-- 담당자별 통계
SELECT assignee, COUNT(*) as count, AVG(progress) as avg_progress
FROM admin_checklist_data
GROUP BY assignee
ORDER BY count DESC;

-- 분류별 통계
SELECT department, COUNT(*) as count
FROM admin_checklist_data
GROUP BY department
ORDER BY count DESC;

-- 9. 월별 등록 현황
SELECT
  DATE_TRUNC('month', registration_date) as month,
  COUNT(*) as registered_count
FROM admin_checklist_data
GROUP BY DATE_TRUNC('month', registration_date)
ORDER BY month;

-- 10. 미완료 항목 (진행률 100% 미만)
SELECT * FROM admin_checklist_data
WHERE progress < 100
ORDER BY progress ASC, registration_date DESC;

-- 11. 긴급도 높은 항목 (홀딩 상태 제외하고 오래된 순)
SELECT * FROM admin_checklist_data
WHERE status != '홀딩' AND status != '완료'
ORDER BY registration_date ASC;

-- 12. 최근 업데이트된 항목
SELECT * FROM admin_checklist_data
ORDER BY updated_at DESC
LIMIT 10;

-- 13. 검색 쿼리 (제목이나 설명에서 키워드 검색)
-- 예: '보안' 키워드 검색
SELECT * FROM admin_checklist_data
WHERE work_content ILIKE '%보안%'
   OR description ILIKE '%보안%'
ORDER BY no DESC;

-- 14. 데이터 추가 예시
/*
INSERT INTO admin_checklist_data (
  no, code, department, work_content, description,
  status, team, assignee, progress, created_by, updated_by
) VALUES (
  6, 'CHK-25-006', 'IT001', '새로운 체크리스트 항목',
  '항목에 대한 상세 설명', '대기', '개발팀', 'USR001',
  0, 'admin', 'admin'
);
*/

-- 15. 데이터 수정 예시
/*
UPDATE admin_checklist_data
SET
  status = '진행',
  progress = 50,
  updated_by = 'admin',
  updated_at = NOW()
WHERE code = 'CHK-25-006';
*/

-- 16. 완료 처리 예시
/*
UPDATE admin_checklist_data
SET
  status = '완료',
  progress = 100,
  completed_date = CURRENT_DATE,
  updated_by = 'admin',
  updated_at = NOW()
WHERE code = 'CHK-25-006';
*/

-- 17. 테이블 구조 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'admin_checklist_data'
ORDER BY ordinal_position;

-- 18. 인덱스 확인
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'admin_checklist_data';

-- 19. 제약조건 확인
SELECT conname, contype, pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'admin_checklist_data'::regclass;

-- 20. 전체 테이블 정보
SELECT
  schemaname, tablename, tableowner, tablespace, hasindexes, hasrules, hastriggers
FROM pg_tables
WHERE tablename = 'admin_checklist_data';