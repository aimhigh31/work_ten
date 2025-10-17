-- plan_task_management 테이블명을 main_task_management로 변경
-- Supabase Dashboard > SQL Editor에서 실행하세요

ALTER TABLE plan_task_management RENAME TO main_task_management;

-- 변경 확인
SELECT COUNT(*) FROM main_task_management;
