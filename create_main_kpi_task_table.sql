-- main_kpi_task 테이블 생성

CREATE TABLE IF NOT EXISTS main_kpi_task (
  id SERIAL PRIMARY KEY,
  kpi_id INTEGER REFERENCES main_kpi_data(id) ON DELETE CASCADE,
  text TEXT NOT NULL,
  checked BOOLEAN DEFAULT FALSE,
  parent_id INTEGER REFERENCES main_kpi_task(id) ON DELETE CASCADE,
  level INTEGER DEFAULT 0,
  expanded BOOLEAN DEFAULT TRUE,
  status TEXT DEFAULT '대기',
  due_date DATE,
  start_date DATE,
  progress_rate INTEGER DEFAULT 0,
  assignee TEXT,
  team TEXT,
  priority TEXT,
  weight INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_main_kpi_task_kpi_id ON main_kpi_task(kpi_id);
CREATE INDEX IF NOT EXISTS idx_main_kpi_task_parent_id ON main_kpi_task(parent_id);

-- 업데이트 트리거 생성
CREATE OR REPLACE FUNCTION update_main_kpi_task_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_main_kpi_task_updated_at
  BEFORE UPDATE ON main_kpi_task
  FOR EACH ROW
  EXECUTE FUNCTION update_main_kpi_task_updated_at();

-- 테이블 확인
SELECT
  table_name,
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'main_kpi_task'
ORDER BY ordinal_position;
