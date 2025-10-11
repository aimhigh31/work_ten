
-- plan_investment_data 테이블의 no 컬럼을 NULL 허용으로 변경
ALTER TABLE plan_investment_data
ALTER COLUMN no DROP NOT NULL;

-- 기존 데이터의 no를 NULL로 설정
UPDATE plan_investment_data
SET no = NULL
WHERE is_active = true;
