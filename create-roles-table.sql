-- 역할관리 테이블 생성
CREATE TABLE admin_users_rules (
  id SERIAL PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- 역할 기본 정보
  role_code VARCHAR(50) UNIQUE NOT NULL,
  role_name VARCHAR(100) NOT NULL,
  role_description TEXT,

  -- 권한 설정 (JSON 형태로 카테고리별 권한 저장)
  permissions JSONB DEFAULT '{}',

  -- 상태 관리
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,

  -- 메타데이터
  created_by VARCHAR(100) DEFAULT 'system',
  updated_by VARCHAR(100) DEFAULT 'system',
  metadata JSONB DEFAULT '{}'
);

-- 인덱스 생성
CREATE INDEX idx_admin_users_rules_role_code ON admin_users_rules(role_code);
CREATE INDEX idx_admin_users_rules_is_active ON admin_users_rules(is_active);
CREATE INDEX idx_admin_users_rules_display_order ON admin_users_rules(display_order);

-- 트리거 생성 (updated_at 자동 업데이트)
CREATE OR REPLACE FUNCTION update_admin_users_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_admin_users_rules_updated_at
  BEFORE UPDATE ON admin_users_rules
  FOR EACH ROW
  EXECUTE FUNCTION update_admin_users_rules_updated_at();

-- 샘플 데이터 삽입
INSERT INTO admin_users_rules (role_code, role_name, role_description, permissions, display_order) VALUES
('ROLE-25-001', '시스템 관리자', '전체 시스템 관리 권한',
 '{"dashboard": "전체", "user_management": "전체", "role_management": "전체", "master_code": "전체", "task_management": "전체", "cost_management": "전체", "department_management": "전체"}', 1),

('ROLE-25-002', '일반 사용자', '기본 조회 및 제한적 편집 권한',
 '{"dashboard": "읽기", "user_management": "읽기", "role_management": "읽기", "master_code": "읽기", "task_management": "쓰기", "cost_management": "읽기", "department_management": "읽기"}', 2),

('ROLE-25-003', '부서 관리자', '부서 관련 관리 권한',
 '{"dashboard": "읽기", "user_management": "쓰기", "role_management": "읽기", "master_code": "쓰기", "task_management": "전체", "cost_management": "쓰기", "department_management": "전체"}', 3),

('ROLE-25-004', '조회 전용', '모든 데이터 조회만 가능',
 '{"dashboard": "읽기", "user_management": "읽기", "role_management": "읽기", "master_code": "읽기", "task_management": "읽기", "cost_management": "읽기", "department_management": "읽기"}', 4),

('ROLE-25-005', '테스트 역할', '테스트용 역할',
 '{"dashboard": "읽기", "user_management": "읽기", "role_management": "읽기", "master_code": "읽기", "task_management": "읽기", "cost_management": "읽기", "department_management": "읽기"}', 5);

-- 테이블 코멘트
COMMENT ON TABLE admin_users_rules IS '사용자 역할 및 권한 관리 테이블';
COMMENT ON COLUMN admin_users_rules.role_code IS '역할 코드 (고유)';
COMMENT ON COLUMN admin_users_rules.role_name IS '역할명';
COMMENT ON COLUMN admin_users_rules.permissions IS '카테고리별 권한 설정 (읽기/쓰기/전체)';
COMMENT ON COLUMN admin_users_rules.is_active IS '활성 상태';
COMMENT ON COLUMN admin_users_rules.is_system IS '시스템 기본 역할 여부';