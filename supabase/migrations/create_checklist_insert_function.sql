-- 체크리스트 생성을 위한 RPC 함수
-- 코드 생성과 데이터 삽입을 원자적으로 처리

CREATE OR REPLACE FUNCTION insert_checklist_with_code(
  p_task_name TEXT,
  p_status TEXT,
  p_priority TEXT,
  p_assignee TEXT,
  p_team TEXT,
  p_registration_date TEXT,
  p_start_date TEXT,
  p_end_date TEXT,
  p_description TEXT,
  p_progress INTEGER,
  p_created_by TEXT,
  p_updated_by TEXT
)
RETURNS TABLE(
  id INTEGER,
  code TEXT,
  no INTEGER,
  task_name TEXT,
  status TEXT,
  priority TEXT,
  assignee TEXT,
  team TEXT,
  registration_date TEXT,
  start_date TEXT,
  end_date TEXT,
  description TEXT,
  progress INTEGER,
  created_by TEXT,
  updated_by TEXT,
  is_active BOOLEAN,
  created_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_current_year TEXT;
  v_next_seq INTEGER;
  v_code TEXT;
  v_next_no INTEGER;
BEGIN
  -- 현재 연도 (2자리)
  v_current_year := RIGHT(EXTRACT(YEAR FROM CURRENT_DATE)::TEXT, 2);

  -- 다음 NO 값 가져오기
  SELECT COALESCE(MAX(admin_checklist_data.no), 0) + 1 INTO v_next_no
  FROM admin_checklist_data;

  -- 다음 사용 가능한 순차 번호 찾기 (활성 레코드만)
  WITH existing_codes AS (
    SELECT admin_checklist_data.code
    FROM admin_checklist_data
    WHERE is_active = true
      AND admin_checklist_data.code LIKE 'ADMIN-CHECK-' || v_current_year || '-%'
  ),
  sequences AS (
    SELECT CAST(SUBSTRING(code FROM 'ADMIN-CHECK-\d{2}-(\d{3})') AS INTEGER) as seq
    FROM existing_codes
    WHERE code ~ ('^ADMIN-CHECK-' || v_current_year || '-\d{3}$')
    ORDER BY seq
  ),
  numbered_sequences AS (
    SELECT seq, ROW_NUMBER() OVER (ORDER BY seq) as expected_seq
    FROM sequences
  )
  SELECT COALESCE(
    (SELECT MIN(expected_seq) FROM numbered_sequences WHERE seq != expected_seq),
    COALESCE((SELECT MAX(seq) + 1 FROM sequences), 1)
  ) INTO v_next_seq;

  -- 코드 생성
  v_code := 'ADMIN-CHECK-' || v_current_year || '-' || LPAD(v_next_seq::TEXT, 3, '0');

  -- 데이터 삽입 및 반환
  RETURN QUERY
  INSERT INTO admin_checklist_data (
    code,
    no,
    task_name,
    status,
    priority,
    assignee,
    team,
    registration_date,
    start_date,
    end_date,
    description,
    progress,
    created_by,
    updated_by,
    is_active
  ) VALUES (
    v_code,
    v_next_no,
    p_task_name,
    p_status,
    p_priority,
    p_assignee,
    p_team,
    COALESCE(p_registration_date, CURRENT_DATE::TEXT),
    p_start_date,
    p_end_date,
    p_description,
    COALESCE(p_progress, 0),
    COALESCE(p_created_by, p_assignee, 'unknown'),
    COALESCE(p_updated_by, p_created_by, p_assignee, 'unknown'),
    true
  )
  RETURNING *;
END;
$$;
