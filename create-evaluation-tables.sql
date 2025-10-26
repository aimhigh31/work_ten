-- 인사평가 공개 폼 테이블 생성 SQL
-- Supabase SQL Editor에서 실행하세요

-- 1. 평가 제출 메인 테이블
CREATE TABLE IF NOT EXISTS hr_evaluation_submissions (
  id SERIAL PRIMARY KEY,
  evaluation_id TEXT,
  target_person TEXT NOT NULL,
  department TEXT NOT NULL,
  position TEXT NOT NULL,
  evaluator TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_recommended_score INTEGER DEFAULT 0,
  total_actual_score INTEGER DEFAULT 0,
  total_difference_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 평가 상세 항목 테이블
CREATE TABLE IF NOT EXISTS hr_evaluation_submission_items (
  id SERIAL PRIMARY KEY,
  submission_id INTEGER REFERENCES hr_evaluation_submissions(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL,
  item_name TEXT NOT NULL,
  checked_behaviors BOOLEAN[] DEFAULT ARRAY[false, false, false],
  recommended_score INTEGER DEFAULT 0,
  actual_score INTEGER DEFAULT 0,
  difference_score INTEGER DEFAULT 0,
  difference_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_evaluation_submissions_evaluation_id ON hr_evaluation_submissions(evaluation_id);
CREATE INDEX IF NOT EXISTS idx_evaluation_submission_items_submission_id ON hr_evaluation_submission_items(submission_id);

-- 4. RLS (Row Level Security) 설정
ALTER TABLE hr_evaluation_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_evaluation_submission_items ENABLE ROW LEVEL SECURITY;

-- 5. 기존 정책 삭제 (있는 경우)
DROP POLICY IF EXISTS "Anyone can submit evaluations" ON hr_evaluation_submissions;
DROP POLICY IF EXISTS "Anyone can submit evaluation items" ON hr_evaluation_submission_items;
DROP POLICY IF EXISTS "Authenticated users can view all submissions" ON hr_evaluation_submissions;
DROP POLICY IF EXISTS "Authenticated users can view all submission items" ON hr_evaluation_submission_items;

-- 6. 공개 접근 정책 (누구나 INSERT 가능)
CREATE POLICY "Anyone can submit evaluations" ON hr_evaluation_submissions
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can submit evaluation items" ON hr_evaluation_submission_items
  FOR INSERT TO anon
  WITH CHECK (true);

-- 7. 인증된 사용자는 모든 데이터 조회 가능
CREATE POLICY "Authenticated users can view all submissions" ON hr_evaluation_submissions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view all submission items" ON hr_evaluation_submission_items
  FOR SELECT TO authenticated
  USING (true);
