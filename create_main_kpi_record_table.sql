-- main_kpi_record 테이블 생성

CREATE TABLE IF NOT EXISTS main_kpi_record (
  id SERIAL PRIMARY KEY,
  kpi_id INTEGER REFERENCES main_kpi_data(id) ON DELETE CASCADE,
  month TEXT NOT NULL,
  target_kpi TEXT,
  actual_kpi TEXT,
  traffic_light TEXT DEFAULT 'green',
  overall_progress TEXT DEFAULT '0',
  plan_performance TEXT,
  achievement_reflection TEXT,
  attachments TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_main_kpi_record_kpi_id ON main_kpi_record(kpi_id);
CREATE INDEX IF NOT EXISTS idx_main_kpi_record_month ON main_kpi_record(month);

-- 업데이트 트리거 생성
CREATE OR REPLACE FUNCTION update_main_kpi_record_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_main_kpi_record_updated_at
  BEFORE UPDATE ON main_kpi_record
  FOR EACH ROW
  EXECUTE FUNCTION update_main_kpi_record_updated_at();

-- 테이블 확인
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'main_kpi_record'
ORDER BY ordinal_position;
