-- 새로운 Type 필드를 포함한 마스터코드3 테이블 생성
-- Type 필드로 'group'과 'subcode'를 구분하여 데이터 관리 개선

DROP TABLE IF EXISTS admin_mastercode3_with_type;

CREATE TABLE admin_mastercode3_with_type (
  id SERIAL PRIMARY KEY,

  -- 레코드 타입 구분 (group 또는 subcode)
  record_type VARCHAR(10) NOT NULL CHECK (record_type IN ('group', 'subcode')),

  -- 그룹 정보 (모든 레코드에 공통)
  group_code VARCHAR(50) NOT NULL,
  group_code_name VARCHAR(100) NOT NULL,
  group_code_description TEXT,
  group_code_status VARCHAR(20) DEFAULT 'active' CHECK (group_code_status IN ('active', 'inactive')),
  group_code_order INTEGER NOT NULL DEFAULT 0,

  -- 서브코드 정보 (record_type = 'subcode'일 때만 사용)
  subcode VARCHAR(50),
  subcode_name VARCHAR(100),
  subcode_description TEXT,
  subcode_status VARCHAR(20) DEFAULT 'active' CHECK (subcode_status IN ('active', 'inactive')),
  subcode_remark TEXT,
  subcode_order INTEGER DEFAULT 0,

  -- 공통 필드
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(50) DEFAULT 'admin',
  updated_by VARCHAR(50) DEFAULT 'admin',

  -- 제약 조건
  CONSTRAINT unique_group_code UNIQUE (group_code, record_type) DEFERRABLE INITIALLY DEFERRED,
  CONSTRAINT unique_subcode_in_group UNIQUE (group_code, subcode) DEFERRABLE INITIALLY DEFERRED,

  -- 체크 제약 조건
  CONSTRAINT check_group_record CHECK (
    (record_type = 'group' AND subcode IS NULL AND subcode_name IS NULL) OR
    (record_type = 'subcode' AND subcode IS NOT NULL AND subcode_name IS NOT NULL)
  )
);

-- 인덱스 생성
CREATE INDEX idx_mastercode3_type_group_code ON admin_mastercode3_with_type(record_type, group_code);
CREATE INDEX idx_mastercode3_type_group_order ON admin_mastercode3_with_type(group_code_order);
CREATE INDEX idx_mastercode3_type_subcode_order ON admin_mastercode3_with_type(group_code, subcode_order);

-- 업데이트 시간 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_mastercode3_type_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_mastercode3_type_updated_at
  BEFORE UPDATE ON admin_mastercode3_with_type
  FOR EACH ROW
  EXECUTE FUNCTION update_mastercode3_type_updated_at();

-- 샘플 데이터 삽입

-- 1. USER_LEVEL 그룹
INSERT INTO admin_mastercode3_with_type
(record_type, group_code, group_code_name, group_code_description, group_code_status, group_code_order, created_by, updated_by)
VALUES
('group', 'USER_LEVEL', '사용자 레벨', '사용자 권한 레벨 관리', 'active', 1, 'admin', 'admin');

INSERT INTO admin_mastercode3_with_type
(record_type, group_code, group_code_name, group_code_description, group_code_status, group_code_order,
 subcode, subcode_name, subcode_description, subcode_status, subcode_remark, subcode_order, created_by, updated_by)
VALUES
('subcode', 'USER_LEVEL', '사용자 레벨', '사용자 권한 레벨 관리', 'active', 1, 'L1', '사원', '일반 사원 레벨', 'active', '기본 권한', 1, 'admin', 'admin'),
('subcode', 'USER_LEVEL', '사용자 레벨', '사용자 권한 레벨 관리', 'active', 1, 'L2', '주임', '주임 레벨', 'active', '중간 권한', 2, 'admin', 'admin'),
('subcode', 'USER_LEVEL', '사용자 레벨', '사용자 권한 레벨 관리', 'active', 1, 'L3', '대리', '대리 레벨', 'active', '관리 권한', 3, 'admin', 'admin'),
('subcode', 'USER_LEVEL', '사용자 레벨', '사용자 권한 레벨 관리', 'active', 1, 'L4', '과장', '과장 레벨', 'active', '팀 관리 권한', 4, 'admin', 'admin'),
('subcode', 'USER_LEVEL', '사용자 레벨', '사용자 권한 레벨 관리', 'active', 1, 'L5', '차장', '차장 레벨', 'active', '부서 관리 권한', 5, 'admin', 'admin'),
('subcode', 'USER_LEVEL', '사용자 레벨', '사용자 권한 레벨 관리', 'active', 1, 'L6', '부장', '부장 레벨', 'active', '전체 관리 권한', 6, 'admin', 'admin');

-- 2. TASK_STATUS 그룹
INSERT INTO admin_mastercode3_with_type
(record_type, group_code, group_code_name, group_code_description, group_code_status, group_code_order, created_by, updated_by)
VALUES
('group', 'TASK_STATUS', '업무 상태', '업무 처리 상태 관리', 'active', 2, 'admin', 'admin');

INSERT INTO admin_mastercode3_with_type
(record_type, group_code, group_code_name, group_code_description, group_code_status, group_code_order,
 subcode, subcode_name, subcode_description, subcode_status, subcode_remark, subcode_order, created_by, updated_by)
VALUES
('subcode', 'TASK_STATUS', '업무 상태', '업무 처리 상태 관리', 'active', 2, 'PENDING', '대기중', '업무 대기 상태', 'active', '시작 전', 1, 'admin', 'admin'),
('subcode', 'TASK_STATUS', '업무 상태', '업무 처리 상태 관리', 'active', 2, 'IN_PROGRESS', '진행중', '업무 진행 상태', 'active', '처리 중', 2, 'admin', 'admin'),
('subcode', 'TASK_STATUS', '업무 상태', '업무 처리 상태 관리', 'active', 2, 'REVIEW', '검토중', '업무 검토 상태', 'active', '검토 단계', 3, 'admin', 'admin'),
('subcode', 'TASK_STATUS', '업무 상태', '업무 처리 상태 관리', 'active', 2, 'COMPLETED', '완료', '업무 완료 상태', 'active', '완료됨', 4, 'admin', 'admin'),
('subcode', 'TASK_STATUS', '업무 상태', '업무 처리 상태 관리', 'active', 2, 'CANCELLED', '취소', '업무 취소 상태', 'active', '취소됨', 5, 'admin', 'admin');

-- 3. PRIORITY 그룹
INSERT INTO admin_mastercode3_with_type
(record_type, group_code, group_code_name, group_code_description, group_code_status, group_code_order, created_by, updated_by)
VALUES
('group', 'PRIORITY', '우선순위', '업무 우선순위 관리', 'active', 3, 'admin', 'admin');

INSERT INTO admin_mastercode3_with_type
(record_type, group_code, group_code_name, group_code_description, group_code_status, group_code_order,
 subcode, subcode_name, subcode_description, subcode_status, subcode_remark, subcode_order, created_by, updated_by)
VALUES
('subcode', 'PRIORITY', '우선순위', '업무 우선순위 관리', 'active', 3, 'LOW', '낮음', '낮은 우선순위', 'active', '여유 있음', 1, 'admin', 'admin'),
('subcode', 'PRIORITY', '우선순위', '업무 우선순위 관리', 'active', 3, 'NORMAL', '보통', '보통 우선순위', 'active', '일반적', 2, 'admin', 'admin'),
('subcode', 'PRIORITY', '우선순위', '업무 우선순위 관리', 'active', 3, 'HIGH', '높음', '높은 우선순위', 'active', '중요함', 3, 'admin', 'admin'),
('subcode', 'PRIORITY', '우선순위', '업무 우선순위 관리', 'active', 3, 'URGENT', '긴급', '긴급 우선순위', 'active', '긴급함', 4, 'admin', 'admin'),
('subcode', 'PRIORITY', '우선순위', '업무 우선순위 관리', 'active', 3, 'CRITICAL', '매우긴급', '매우 긴급한 우선순위', 'active', '최우선', 5, 'admin', 'admin');

-- 4. DEPT_TYPE 그룹
INSERT INTO admin_mastercode3_with_type
(record_type, group_code, group_code_name, group_code_description, group_code_status, group_code_order, created_by, updated_by)
VALUES
('group', 'DEPT_TYPE', '부서 유형', '조직 부서 유형 관리', 'active', 4, 'admin', 'admin');

INSERT INTO admin_mastercode3_with_type
(record_type, group_code, group_code_name, group_code_description, group_code_status, group_code_order,
 subcode, subcode_name, subcode_description, subcode_status, subcode_remark, subcode_order, created_by, updated_by)
VALUES
('subcode', 'DEPT_TYPE', '부서 유형', '조직 부서 유형 관리', 'active', 4, 'DEV', '개발부', '소프트웨어 개발 부서', 'active', '기술 부서', 1, 'admin', 'admin'),
('subcode', 'DEPT_TYPE', '부서 유형', '조직 부서 유형 관리', 'active', 4, 'SALES', '영업부', '영업 및 마케팅 부서', 'active', '비즈니스 부서', 2, 'admin', 'admin'),
('subcode', 'DEPT_TYPE', '부서 유형', '조직 부서 유형 관리', 'active', 4, 'HR', '인사부', '인사 관리 부서', 'active', '지원 부서', 3, 'admin', 'admin'),
('subcode', 'DEPT_TYPE', '부서 유형', '조직 부서 유형 관리', 'active', 4, 'FINANCE', '재무부', '재무 관리 부서', 'active', '관리 부서', 4, 'admin', 'admin'),
('subcode', 'DEPT_TYPE', '부서 유형', '조직 부서 유형 관리', 'active', 4, 'MARKETING', '마케팅부', '마케팅 전략 부서', 'active', '비즈니스 부서', 5, 'admin', 'admin');

-- 5. DOC_TYPE 그룹
INSERT INTO admin_mastercode3_with_type
(record_type, group_code, group_code_name, group_code_description, group_code_status, group_code_order, created_by, updated_by)
VALUES
('group', 'DOC_TYPE', '문서 유형', '문서 분류 관리', 'active', 5, 'admin', 'admin');

INSERT INTO admin_mastercode3_with_type
(record_type, group_code, group_code_name, group_code_description, group_code_status, group_code_order,
 subcode, subcode_name, subcode_description, subcode_status, subcode_remark, subcode_order, created_by, updated_by)
VALUES
('subcode', 'DOC_TYPE', '문서 유형', '문서 분류 관리', 'active', 5, 'PROPOSAL', '제안서', '사업 제안서', 'active', '제안 문서', 1, 'admin', 'admin'),
('subcode', 'DOC_TYPE', '문서 유형', '문서 분류 관리', 'active', 5, 'SPEC', '명세서', '기술 명세서', 'active', '기술 문서', 2, 'admin', 'admin'),
('subcode', 'DOC_TYPE', '문서 유형', '문서 분류 관리', 'active', 5, 'MANUAL', '매뉴얼', '사용자 매뉴얼', 'active', '가이드 문서', 3, 'admin', 'admin'),
('subcode', 'DOC_TYPE', '문서 유형', '문서 분류 관리', 'active', 5, 'REPORT', '보고서', '업무 보고서', 'active', '보고 문서', 4, 'admin', 'admin'),
('subcode', 'DOC_TYPE', '문서 유형', '문서 분류 관리', 'active', 5, 'CONTRACT', '계약서', '계약 관련 문서', 'active', '법무 문서', 5, 'admin', 'admin');

-- 데이터 확인 쿼리
SELECT
  record_type,
  group_code,
  group_code_name,
  CASE
    WHEN record_type = 'group' THEN '- 그룹 정보 -'
    ELSE CONCAT(subcode, ' (', subcode_name, ')')
  END as display_name,
  CASE
    WHEN record_type = 'group' THEN group_code_order
    ELSE subcode_order
  END as sort_order
FROM admin_mastercode3_with_type
ORDER BY group_code_order, record_type DESC, subcode_order;