-- 기존 매출 데이터의 코드를 PLAN-SALES 형식으로 업데이트

-- 1. 기존 샘플 데이터 확인
SELECT code, customer_name FROM plan_sales_data ORDER BY code;

-- 2. SALES-XX-XXX 형식을 PLAN-SALES-XX-XXX로 업데이트
UPDATE plan_sales_data
SET code = 'PLAN-' || code
WHERE code LIKE 'SALES-%' AND code NOT LIKE 'PLAN-SALES-%';

-- 3. 업데이트 결과 확인
SELECT code, customer_name FROM plan_sales_data ORDER BY code;
