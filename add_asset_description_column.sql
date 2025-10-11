-- it_hardware_data 테이블에 asset_description 컬럼 추가
ALTER TABLE it_hardware_data
ADD COLUMN IF NOT EXISTS asset_description TEXT;

-- 추가 확인
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'it_hardware_data'
ORDER BY ordinal_position;
