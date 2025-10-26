-- hr_evaluation_data 테이블 생성
-- 인사평가 기본 정보 저장

CREATE TABLE IF NOT EXISTS hr_evaluation_data (
  id SERIAL PRIMARY KEY,

  -- 기본 정보
  evaluation_title TEXT NOT NULL,                    -- 평가제목
  details TEXT,                                       -- 세부설명
  evaluation_type TEXT,                               -- 평가유형
  management_category TEXT,                           -- 관리분류
  status TEXT DEFAULT '대기',                          -- 상태 (대기/진행/완료/홀딩)

  -- 일정
  start_date DATE,                                    -- 시작일
  end_date DATE,                                      -- 종료일

  -- 담당 정보
  team TEXT,                                          -- 팀
  manager TEXT,                                       -- 담당자

  -- 시스템 정보
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  created_by TEXT,
  updated_by TEXT
);

-- RLS 활성화
ALTER TABLE hr_evaluation_data ENABLE ROW LEVEL SECURITY;

-- 정책 생성: 인증된 사용자만 접근
CREATE POLICY "Enable read access for authenticated users"
ON hr_evaluation_data
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable insert for authenticated users"
ON hr_evaluation_data
FOR INSERT
TO authenticated
WITH CHECK (true);

CREATE POLICY "Enable update for authenticated users"
ON hr_evaluation_data
FOR UPDATE
TO authenticated
USING (true)
WITH CHECK (true);

CREATE POLICY "Enable delete for authenticated users"
ON hr_evaluation_data
FOR DELETE
TO authenticated
USING (true);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_hr_evaluation_data_status ON hr_evaluation_data(status);
CREATE INDEX IF NOT EXISTS idx_hr_evaluation_data_start_date ON hr_evaluation_data(start_date);
CREATE INDEX IF NOT EXISTS idx_hr_evaluation_data_team ON hr_evaluation_data(team);

-- 업데이트 시간 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_hr_evaluation_data_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_hr_evaluation_data_updated_at
BEFORE UPDATE ON hr_evaluation_data
FOR EACH ROW
EXECUTE FUNCTION update_hr_evaluation_data_updated_at();

COMMENT ON TABLE hr_evaluation_data IS '인사평가 기본 데이터 관리';
