-- 1. 기존 플랫 구조 테이블 삭제
DROP TABLE IF EXISTS admin_mastercode_data CASCADE;

-- 2. 기존 계층 구조 테이블 삭제 (있을 경우)
DROP TABLE IF EXISTS admin_subcode CASCADE;
DROP TABLE IF EXISTS admin_mastercode CASCADE;

-- 3. 마스터코드 테이블 생성
CREATE TABLE admin_mastercode (
    id SERIAL PRIMARY KEY,
    code_group VARCHAR(50) NOT NULL UNIQUE,
    code_group_name VARCHAR(100) NOT NULL,
    code_group_description TEXT,
    is_active BOOLEAN DEFAULT true,
    is_system BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100)
);

-- 4. 서브코드 테이블 생성
CREATE TABLE admin_subcode (
    id SERIAL PRIMARY KEY,
    mastercode_id INTEGER NOT NULL REFERENCES admin_mastercode(id) ON DELETE CASCADE,
    sub_code VARCHAR(50) NOT NULL,
    sub_code_name VARCHAR(100) NOT NULL,
    sub_code_description TEXT,
    code_value1 VARCHAR(255),
    code_value2 VARCHAR(255),
    code_value3 VARCHAR(255),
    is_active BOOLEAN DEFAULT true,
    is_system BOOLEAN DEFAULT false,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100),
    updated_by VARCHAR(100),
    UNIQUE(mastercode_id, sub_code)
);

-- 5. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_admin_mastercode_code_group ON admin_mastercode(code_group);
CREATE INDEX IF NOT EXISTS idx_admin_mastercode_is_active ON admin_mastercode(is_active);
CREATE INDEX IF NOT EXISTS idx_admin_subcode_mastercode_id ON admin_subcode(mastercode_id);
CREATE INDEX IF NOT EXISTS idx_admin_subcode_sub_code ON admin_subcode(sub_code);
CREATE INDEX IF NOT EXISTS idx_admin_subcode_is_active ON admin_subcode(is_active);

-- 6. RLS 비활성화 (개발 환경)
ALTER TABLE admin_mastercode ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_subcode ENABLE ROW LEVEL SECURITY;

-- 모든 작업 허용 정책
CREATE POLICY "Enable all operations for admin_mastercode" ON admin_mastercode
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for admin_subcode" ON admin_subcode
    FOR ALL USING (true) WITH CHECK (true);

-- 7. 샘플 데이터 삽입
-- 마스터코드 데이터
INSERT INTO admin_mastercode (code_group, code_group_name, code_group_description, display_order) VALUES
('USER_LEVEL', '사용자 레벨', '사용자 권한 레벨 관리', 1),
('TASK_STATUS', '업무 상태', '업무 진행 상태 코드', 2),
('PRIORITY', '우선순위', '업무 우선순위 레벨', 3),
('DEPT_TYPE', '부서 유형', '부서 분류 코드', 4),
('DOC_TYPE', '문서 유형', '문서 분류 코드', 5);

-- 서브코드 데이터 (USER_LEVEL)
INSERT INTO admin_subcode (mastercode_id, sub_code, sub_code_name, code_value1, display_order)
SELECT id, 'L1', '사원', '#4CAF50', 1 FROM admin_mastercode WHERE code_group = 'USER_LEVEL';
INSERT INTO admin_subcode (mastercode_id, sub_code, sub_code_name, code_value1, display_order)
SELECT id, 'L2', '대리', '#2196F3', 2 FROM admin_mastercode WHERE code_group = 'USER_LEVEL';
INSERT INTO admin_subcode (mastercode_id, sub_code, sub_code_name, code_value1, display_order)
SELECT id, 'L3', '과장', '#FF9800', 3 FROM admin_mastercode WHERE code_group = 'USER_LEVEL';
INSERT INTO admin_subcode (mastercode_id, sub_code, sub_code_name, code_value1, display_order)
SELECT id, 'L4', '부장', '#F44336', 4 FROM admin_mastercode WHERE code_group = 'USER_LEVEL';
INSERT INTO admin_subcode (mastercode_id, sub_code, sub_code_name, code_value1, display_order)
SELECT id, 'L5', '임원', '#9C27B0', 5 FROM admin_mastercode WHERE code_group = 'USER_LEVEL';

-- 서브코드 데이터 (TASK_STATUS)
INSERT INTO admin_subcode (mastercode_id, sub_code, sub_code_name, code_value1, display_order)
SELECT id, 'PENDING', '대기중', '#9E9E9E', 1 FROM admin_mastercode WHERE code_group = 'TASK_STATUS';
INSERT INTO admin_subcode (mastercode_id, sub_code, sub_code_name, code_value1, display_order)
SELECT id, 'IN_PROGRESS', '진행중', '#2196F3', 2 FROM admin_mastercode WHERE code_group = 'TASK_STATUS';
INSERT INTO admin_subcode (mastercode_id, sub_code, sub_code_name, code_value1, display_order)
SELECT id, 'COMPLETED', '완료', '#4CAF50', 3 FROM admin_mastercode WHERE code_group = 'TASK_STATUS';
INSERT INTO admin_subcode (mastercode_id, sub_code, sub_code_name, code_value1, display_order)
SELECT id, 'CANCELLED', '취소', '#F44336', 4 FROM admin_mastercode WHERE code_group = 'TASK_STATUS';

-- 서브코드 데이터 (PRIORITY)
INSERT INTO admin_subcode (mastercode_id, sub_code, sub_code_name, code_value1, display_order)
SELECT id, 'LOW', '낮음', '#4CAF50', 1 FROM admin_mastercode WHERE code_group = 'PRIORITY';
INSERT INTO admin_subcode (mastercode_id, sub_code, sub_code_name, code_value1, display_order)
SELECT id, 'MEDIUM', '보통', '#FF9800', 2 FROM admin_mastercode WHERE code_group = 'PRIORITY';
INSERT INTO admin_subcode (mastercode_id, sub_code, sub_code_name, code_value1, display_order)
SELECT id, 'HIGH', '높음', '#F44336', 3 FROM admin_mastercode WHERE code_group = 'PRIORITY';
INSERT INTO admin_subcode (mastercode_id, sub_code, sub_code_name, code_value1, display_order)
SELECT id, 'URGENT', '긴급', '#D32F2F', 4 FROM admin_mastercode WHERE code_group = 'PRIORITY';

-- 서브코드 데이터 (DEPT_TYPE)
INSERT INTO admin_subcode (mastercode_id, sub_code, sub_code_name, display_order)
SELECT id, 'DEV', '개발팀', 1 FROM admin_mastercode WHERE code_group = 'DEPT_TYPE';
INSERT INTO admin_subcode (mastercode_id, sub_code, sub_code_name, display_order)
SELECT id, 'DESIGN', '디자인팀', 2 FROM admin_mastercode WHERE code_group = 'DEPT_TYPE';
INSERT INTO admin_subcode (mastercode_id, sub_code, sub_code_name, display_order)
SELECT id, 'SALES', '영업팀', 3 FROM admin_mastercode WHERE code_group = 'DEPT_TYPE';
INSERT INTO admin_subcode (mastercode_id, sub_code, sub_code_name, display_order)
SELECT id, 'HR', '인사팀', 4 FROM admin_mastercode WHERE code_group = 'DEPT_TYPE';

-- 서브코드 데이터 (DOC_TYPE)
INSERT INTO admin_subcode (mastercode_id, sub_code, sub_code_name, display_order)
SELECT id, 'REPORT', '보고서', 1 FROM admin_mastercode WHERE code_group = 'DOC_TYPE';
INSERT INTO admin_subcode (mastercode_id, sub_code, sub_code_name, display_order)
SELECT id, 'PROPOSAL', '제안서', 2 FROM admin_mastercode WHERE code_group = 'DOC_TYPE';
INSERT INTO admin_subcode (mastercode_id, sub_code, sub_code_name, display_order)
SELECT id, 'CONTRACT', '계약서', 3 FROM admin_mastercode WHERE code_group = 'DOC_TYPE';
INSERT INTO admin_subcode (mastercode_id, sub_code, sub_code_name, display_order)
SELECT id, 'MANUAL', '매뉴얼', 4 FROM admin_mastercode WHERE code_group = 'DOC_TYPE';