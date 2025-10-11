-- plan_investment_data 테이블의 no 컬럼 제약조건 제거
ALTER TABLE plan_investment_data DROP CONSTRAINT IF EXISTS plan_investment_data_no_key;
ALTER TABLE plan_investment_data ALTER COLUMN no DROP NOT NULL;

-- 기존 데이터의 no를 0으로 설정
UPDATE plan_investment_data SET no = 0 WHERE is_active = true;
