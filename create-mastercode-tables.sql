-- ========================================
-- 마스터코드 관리 테이블 생성 스크립트
-- ========================================

-- 1. 메인 마스터코드 데이터 테이블 (admin_mastercode_data)
CREATE TABLE IF NOT EXISTS admin_mastercode_data (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- 마스터코드 기본 정보
    code_group VARCHAR(50) NOT NULL,              -- 코드 그룹 (예: USER_STATUS, DEPT_TYPE)
    code_group_name VARCHAR(100) NOT NULL,        -- 코드 그룹명 (예: 사용자상태, 부서유형)
    code_group_description TEXT,                  -- 코드 그룹 설명
    
    -- 정렬 및 상태
    display_order INTEGER NOT NULL DEFAULT 0,     -- 표시 순서
    is_active BOOLEAN NOT NULL DEFAULT true,      -- 활성화 여부
    is_system BOOLEAN NOT NULL DEFAULT false,     -- 시스템 기본 코드 여부 (삭제 불가)
    
    -- 메타데이터
    created_by VARCHAR(100) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(100) NOT NULL DEFAULT 'system',
    
    -- 제약조건
    CONSTRAINT uk_mastercode_data_code_group UNIQUE (code_group)
);

-- 2. 서브코드 테이블 (admin_mastercode_subcode)
CREATE TABLE IF NOT EXISTS admin_mastercode_subcode (
    id BIGSERIAL PRIMARY KEY,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- 외래키
    mastercode_id BIGINT NOT NULL,                -- admin_mastercode_data 참조
    
    -- 서브코드 정보
    sub_code VARCHAR(50) NOT NULL,                -- 서브코드 (예: ACTIVE, INACTIVE)
    sub_code_name VARCHAR(100) NOT NULL,          -- 서브코드명 (예: 활성, 비활성)
    sub_code_description TEXT,                    -- 서브코드 설명
    
    -- 추가 속성
    code_value1 VARCHAR(100),                     -- 추가 값1 (색상, 아이콘 등)
    code_value2 VARCHAR(100),                     -- 추가 값2
    code_value3 VARCHAR(100),                     -- 추가 값3
    
    -- 정렬 및 상태
    display_order INTEGER NOT NULL DEFAULT 0,     -- 표시 순서
    is_active BOOLEAN NOT NULL DEFAULT true,      -- 활성화 여부
    is_system BOOLEAN NOT NULL DEFAULT false,     -- 시스템 기본 코드 여부
    
    -- 메타데이터
    created_by VARCHAR(100) NOT NULL DEFAULT 'system',
    updated_by VARCHAR(100) NOT NULL DEFAULT 'system',
    
    -- 제약조건
    CONSTRAINT fk_subcode_mastercode FOREIGN KEY (mastercode_id) REFERENCES admin_mastercode_data(id) ON DELETE CASCADE,
    CONSTRAINT uk_subcode_master_sub UNIQUE (mastercode_id, sub_code)
);

-- 3. 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_mastercode_data_code_group ON admin_mastercode_data(code_group);
CREATE INDEX IF NOT EXISTS idx_mastercode_data_active ON admin_mastercode_data(is_active);
CREATE INDEX IF NOT EXISTS idx_mastercode_data_order ON admin_mastercode_data(display_order);

CREATE INDEX IF NOT EXISTS idx_subcode_mastercode_id ON admin_mastercode_subcode(mastercode_id);
CREATE INDEX IF NOT EXISTS idx_subcode_active ON admin_mastercode_subcode(is_active);
CREATE INDEX IF NOT EXISTS idx_subcode_order ON admin_mastercode_subcode(mastercode_id, display_order);

-- 4. updated_at 자동 업데이트 트리거 함수
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 적용
DROP TRIGGER IF EXISTS update_mastercode_data_updated_at ON admin_mastercode_data;
CREATE TRIGGER update_mastercode_data_updated_at 
    BEFORE UPDATE ON admin_mastercode_data 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_subcode_updated_at ON admin_mastercode_subcode;
CREATE TRIGGER update_subcode_updated_at 
    BEFORE UPDATE ON admin_mastercode_subcode 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 5. 샘플 데이터 삽입
INSERT INTO admin_mastercode_data (code_group, code_group_name, code_group_description, display_order, is_system) VALUES
('USER_STATUS', '사용자 상태', '사용자 계정 상태 구분', 1, true),
('DEPT_TYPE', '부서 유형', '부서 분류 코드', 2, false),
('PROJECT_STATUS', '프로젝트 상태', '프로젝트 진행 상태', 3, false),
('TASK_PRIORITY', '업무 우선순위', '업무 중요도 구분', 4, false),
('EDUCATION_TYPE', '교육 유형', '교육 과정 분류', 5, false)
ON CONFLICT (code_group) DO NOTHING;

-- 사용자 상태 서브코드
INSERT INTO admin_mastercode_subcode (mastercode_id, sub_code, sub_code_name, sub_code_description, code_value1, display_order, is_system)
SELECT id, 'ACTIVE', '활성', '정상 사용 가능한 계정', '#4caf50', 1, true FROM admin_mastercode_data WHERE code_group = 'USER_STATUS'
UNION ALL
SELECT id, 'INACTIVE', '비활성', '일시 중지된 계정', '#ff9800', 2, true FROM admin_mastercode_data WHERE code_group = 'USER_STATUS'
UNION ALL
SELECT id, 'SUSPENDED', '정지', '이용 정지된 계정', '#f44336', 3, true FROM admin_mastercode_data WHERE code_group = 'USER_STATUS'
ON CONFLICT (mastercode_id, sub_code) DO NOTHING;

-- 부서 유형 서브코드
INSERT INTO admin_mastercode_subcode (mastercode_id, sub_code, sub_code_name, sub_code_description, display_order)
SELECT id, 'MANAGEMENT', '경영진', '경영진 부서', 1 FROM admin_mastercode_data WHERE code_group = 'DEPT_TYPE'
UNION ALL
SELECT id, 'DEVELOPMENT', '개발팀', '소프트웨어 개발 부서', 2 FROM admin_mastercode_data WHERE code_group = 'DEPT_TYPE'
UNION ALL
SELECT id, 'MARKETING', '마케팅팀', '마케팅 및 영업 부서', 3 FROM admin_mastercode_data WHERE code_group = 'DEPT_TYPE'
UNION ALL
SELECT id, 'HR', '인사팀', '인사 관리 부서', 4 FROM admin_mastercode_data WHERE code_group = 'DEPT_TYPE'
ON CONFLICT (mastercode_id, sub_code) DO NOTHING;

-- 프로젝트 상태 서브코드
INSERT INTO admin_mastercode_subcode (mastercode_id, sub_code, sub_code_name, sub_code_description, code_value1, display_order)
SELECT id, 'PLANNING', '기획', '프로젝트 기획 단계', '#2196f3', 1 FROM admin_mastercode_data WHERE code_group = 'PROJECT_STATUS'
UNION ALL
SELECT id, 'IN_PROGRESS', '진행중', '프로젝트 진행 중', '#ff9800', 2 FROM admin_mastercode_data WHERE code_group = 'PROJECT_STATUS'
UNION ALL
SELECT id, 'COMPLETED', '완료', '프로젝트 완료', '#4caf50', 3 FROM admin_mastercode_data WHERE code_group = 'PROJECT_STATUS'
UNION ALL
SELECT id, 'CANCELLED', '취소', '프로젝트 취소됨', '#f44336', 4 FROM admin_mastercode_data WHERE code_group = 'PROJECT_STATUS'
ON CONFLICT (mastercode_id, sub_code) DO NOTHING;

-- 업무 우선순위 서브코드
INSERT INTO admin_mastercode_subcode (mastercode_id, sub_code, sub_code_name, sub_code_description, code_value1, display_order)
SELECT id, 'HIGH', '높음', '긴급 처리 필요', '#f44336', 1 FROM admin_mastercode_data WHERE code_group = 'TASK_PRIORITY'
UNION ALL
SELECT id, 'MEDIUM', '보통', '일반 처리', '#ff9800', 2 FROM admin_mastercode_data WHERE code_group = 'TASK_PRIORITY'
UNION ALL
SELECT id, 'LOW', '낮음', '여유있게 처리', '#4caf50', 3 FROM admin_mastercode_data WHERE code_group = 'TASK_PRIORITY'
ON CONFLICT (mastercode_id, sub_code) DO NOTHING;

-- 교육 유형 서브코드
INSERT INTO admin_mastercode_subcode (mastercode_id, sub_code, sub_code_name, sub_code_description, display_order)
SELECT id, 'TECHNICAL', '기술교육', '기술 스킬 향상 교육', 1 FROM admin_mastercode_data WHERE code_group = 'EDUCATION_TYPE'
UNION ALL
SELECT id, 'BUSINESS', '비즈니스교육', '비즈니스 스킬 교육', 2 FROM admin_mastercode_data WHERE code_group = 'EDUCATION_TYPE'
UNION ALL
SELECT id, 'LANGUAGE', '어학교육', '외국어 교육', 3 FROM admin_mastercode_data WHERE code_group = 'EDUCATION_TYPE'
UNION ALL
SELECT id, 'CERTIFICATION', '자격증교육', '자격증 취득 과정', 4 FROM admin_mastercode_data WHERE code_group = 'EDUCATION_TYPE'
ON CONFLICT (mastercode_id, sub_code) DO NOTHING;

-- 6. 권한 설정 (필요시)
-- RLS가 비활성화되어 있으므로 별도 정책 설정 불필요

COMMENT ON TABLE admin_mastercode_data IS '마스터코드 메인 데이터 테이블';
COMMENT ON TABLE admin_mastercode_subcode IS '마스터코드 서브코드 테이블';

-- 완료 메시지
SELECT 'admin_mastercode_data 테이블 생성 완료' as message
UNION ALL
SELECT 'admin_mastercode_subcode 테이블 생성 완료' as message
UNION ALL  
SELECT '샘플 데이터 삽입 완료' as message;