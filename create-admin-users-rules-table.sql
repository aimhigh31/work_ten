-- admin_users_rules 테이블 생성 (역할 관리용)
CREATE TABLE IF NOT EXISTS admin_users_rules (
    id SERIAL PRIMARY KEY,
    role_no INTEGER UNIQUE NOT NULL,
    role_code VARCHAR(50) UNIQUE NOT NULL,
    role_name VARCHAR(100) NOT NULL,
    role_description TEXT,
    user_count INTEGER DEFAULT 0,
    permission_count INTEGER DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_by VARCHAR(100) DEFAULT '시스템',
    updated_by VARCHAR(100) DEFAULT '시스템',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_admin_users_rules_role_code ON admin_users_rules(role_code);
CREATE INDEX IF NOT EXISTS idx_admin_users_rules_role_name ON admin_users_rules(role_name);
CREATE INDEX IF NOT EXISTS idx_admin_users_rules_is_active ON admin_users_rules(is_active);

-- 기본 데이터 삽입 (이미 데이터가 있으면 무시)
INSERT INTO admin_users_rules (role_no, role_code, role_name, role_description, user_count, permission_count, is_active)
VALUES
    (1, 'ROLE-25-001', '시스템관리자', '시스템 전체 관리 권한', 2, 15, true),
    (2, 'ROLE-25-002', '일반관리자', '일반 관리 업무 권한', 5, 8, true),
    (3, 'ROLE-25-003', '사용자', '기본 사용자 권한', 20, 3, true),
    (4, 'ROLE-25-004', '게스트', '제한적 조회 권한', 0, 1, false),
    (5, 'ROLE-25-005', '검토자', '검토 및 승인 권한', 3, 5, true)
ON CONFLICT (role_code) DO NOTHING;

-- 업데이트 트리거 함수 생성
CREATE OR REPLACE FUNCTION update_admin_users_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 업데이트 트리거 설정
DROP TRIGGER IF EXISTS update_admin_users_rules_updated_at ON admin_users_rules;
CREATE TRIGGER update_admin_users_rules_updated_at
    BEFORE UPDATE ON admin_users_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_users_rules_updated_at();

-- 테이블 정보 조회
SELECT
    'admin_users_rules 테이블 생성 완료' as status,
    count(*) as total_records
FROM admin_users_rules;