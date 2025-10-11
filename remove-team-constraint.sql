-- 팀 체크 제약조건 제거
ALTER TABLE admin_checklist_data DROP CONSTRAINT IF EXISTS chk_team;

-- 팀 필드를 더 유연하게 만들기 (NULL 허용)
ALTER TABLE admin_checklist_data ALTER COLUMN team DROP NOT NULL;

-- 상태 제약조건도 확인하고 필요시 수정
ALTER TABLE admin_checklist_data DROP CONSTRAINT IF EXISTS chk_status;
ALTER TABLE admin_checklist_data ADD CONSTRAINT chk_status_flexible
CHECK (status IN ('대기', '진행', '완료', '홀딩') OR status IS NULL);

-- 진행률 제약조건 확인
ALTER TABLE admin_checklist_data DROP CONSTRAINT IF EXISTS chk_progress;
ALTER TABLE admin_checklist_data ADD CONSTRAINT chk_progress_flexible
CHECK (progress >= 0 AND progress <= 100);

-- 테이블 구조 확인
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_name = 'admin_checklist_data'
ORDER BY ordinal_position;