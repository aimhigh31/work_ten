-- security_accident_data 테이블 생성
CREATE TABLE security_accident_data (
  id SERIAL PRIMARY KEY,
  no INTEGER,
  registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
  code VARCHAR(50) UNIQUE NOT NULL,
  incident_type VARCHAR(50) NOT NULL,
  request_content TEXT,
  main_content TEXT NOT NULL,
  response_action TEXT,
  description TEXT,
  severity VARCHAR(10) NOT NULL DEFAULT '중간',
  status VARCHAR(10) NOT NULL DEFAULT '대기',
  response_stage VARCHAR(20),
  assignee VARCHAR(100),
  team VARCHAR(50),
  discoverer VARCHAR(100),
  impact_scope TEXT,
  cause_analysis TEXT,
  prevention_plan TEXT,
  occurrence_date DATE,
  completed_date DATE,
  start_date DATE,
  progress INTEGER DEFAULT 0,
  attachment BOOLEAN DEFAULT FALSE,
  attachment_count INTEGER DEFAULT 0,
  attachments JSONB DEFAULT '[]'::jsonb,
  likes INTEGER DEFAULT 0,
  liked_by JSONB DEFAULT '[]'::jsonb,
  views INTEGER DEFAULT 0,
  viewed_by JSONB DEFAULT '[]'::jsonb,
  comments JSONB DEFAULT '[]'::jsonb,
  incident_report JSONB,
  post_measures JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  created_by VARCHAR(100) DEFAULT 'system',
  updated_by VARCHAR(100) DEFAULT 'system',
  is_active BOOLEAN DEFAULT TRUE
);

-- 인덱스 생성
CREATE INDEX idx_security_accident_code ON security_accident_data(code);
CREATE INDEX idx_security_accident_type ON security_accident_data(incident_type);
CREATE INDEX idx_security_accident_status ON security_accident_data(status);
CREATE INDEX idx_security_accident_assignee ON security_accident_data(assignee);
CREATE INDEX idx_security_accident_date ON security_accident_data(registration_date);

-- updated_at 자동 업데이트 트리거
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_security_accident_updated_at
    BEFORE UPDATE ON security_accident_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- 샘플 데이터 추가
INSERT INTO security_accident_data (
  no, code, incident_type, request_content, main_content, response_action,
  severity, status, response_stage, assignee, team, occurrence_date,
  completed_date, start_date, progress, attachment, attachment_count
) VALUES
(1, 'SECACC-25-001', '악성코드', '직원 PC에서 악성코드 감염 발견', '직원 PC에서 악성코드 감염 발견. 백신 프로그램으로 탐지 및 격리 처리 완료.', '백신 프로그램으로 악성코드 격리, PC 재설치 및 보안 패치 적용', '높음', '완료', '근본개선', '김철수', '보안팀', '2025-01-15', '2025-01-16', '2025-01-15', 100, true, 2),
(2, 'SECACC-25-002', '계정탈취', '영업팀 직원 이메일 계정 무단 접근 시도', '영업팀 직원 이메일 계정 무단 접근 시도 발견. 2차 인증 강화 및 비밀번호 변경 조치.', '2차 인증 활성화, 비밀번호 정책 강화, 보안 교육 실시', '중간', '완료', '근본개선', '이영희', 'IT팀', '2025-01-18', '2025-01-19', '2025-01-18', 100, false, 0),
(3, 'SECACC-25-003', '랜섬웨어', '개발서버 랜섬웨어 공격 감지', '개발서버에서 랜섬웨어 공격 시도 감지. 네트워크 격리 및 백업 복구 진행 중.', '네트워크 격리, 백업 복구 진행, 랜섬웨어 백신 스캔 실시', '높음', '진행', '개선 조치 중', '박민수', '보안팀', '2025-01-20', NULL, '2025-01-20', 50, true, 1);