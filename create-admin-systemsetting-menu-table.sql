-- Admin_Systemsetting_Menu 테이블 생성
-- 메뉴명_페이지명_해당이름 규칙을 따라 명명

CREATE TABLE IF NOT EXISTS Admin_Systemsetting_Menu (
  id BIGSERIAL PRIMARY KEY,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
  menu_level INTEGER NOT NULL DEFAULT 0,
  menu_category VARCHAR(100) NOT NULL,
  menu_icon VARCHAR(50),
  menu_page VARCHAR(100) NOT NULL,
  menu_description TEXT,
  menu_url VARCHAR(200) NOT NULL,
  is_enabled BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_by VARCHAR(100) NOT NULL DEFAULT 'system',
  updated_by VARCHAR(100) NOT NULL DEFAULT 'system'
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_admin_systemsetting_menu_category ON Admin_Systemsetting_Menu(menu_category);
CREATE INDEX IF NOT EXISTS idx_admin_systemsetting_menu_level ON Admin_Systemsetting_Menu(menu_level);
CREATE INDEX IF NOT EXISTS idx_admin_systemsetting_menu_enabled ON Admin_Systemsetting_Menu(is_enabled);
CREATE INDEX IF NOT EXISTS idx_admin_systemsetting_menu_order ON Admin_Systemsetting_Menu(display_order);

-- 업데이트 시간 자동 갱신 트리거
CREATE OR REPLACE FUNCTION update_admin_systemsetting_menu_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_admin_systemsetting_menu_updated_at
    BEFORE UPDATE ON Admin_Systemsetting_Menu
    FOR EACH ROW
    EXECUTE FUNCTION update_admin_systemsetting_menu_updated_at();

-- RLS (Row Level Security) 정책 설정
ALTER TABLE Admin_Systemsetting_Menu ENABLE ROW LEVEL SECURITY;

-- 모든 작업 허용 정책 (개발 단계용)
CREATE POLICY "Admin_Systemsetting_Menu 모든 작업 허용"
  ON Admin_Systemsetting_Menu
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- 샘플 데이터 삽입 (기존 메뉴 구조 기반)
INSERT INTO Admin_Systemsetting_Menu (
  menu_level, 
  menu_category, 
  menu_icon, 
  menu_page, 
  menu_description, 
  menu_url, 
  is_enabled, 
  display_order,
  created_by,
  updated_by
) VALUES 
-- 관리자메뉴 그룹 (레벨 0)
(0, '관리자메뉴', 'Setting2', '관리자메뉴', '시스템 관리 메뉴', '/', true, 1, 'system', 'system'),

-- 관리자메뉴 > 시스템설정 (레벨 1)
(1, '관리자메뉴', 'Setting2', '시스템설정', '시스템 기본 설정 관리', '/admin-panel/system-settings', true, 2, 'system', 'system'),

-- 관리자메뉴 > 사용자관리 (레벨 1)  
(1, '관리자메뉴', 'Profile', '사용자관리', '사용자 계정 관리', '/admin-panel/user-settings', true, 3, 'system', 'system'),

-- 메인메뉴 그룹 (레벨 0)
(0, '메인메뉴', 'Home3', '메인메뉴', '메인 대시보드', '/', true, 4, 'system', 'system'),

-- 메인메뉴 > 대시보드 (레벨 1)
(1, '메인메뉴', 'Chart', '대시보드', '현황 대시보드', '/dashboard/default', true, 5, 'system', 'system'),

-- 메인메뉴 > 업무관리 (레벨 1)
(1, '메인메뉴', 'TaskSquare', '업무관리', '업무 프로세스 관리', '/apps/task-management', true, 6, 'system', 'system'),

-- 기획메뉴 그룹 (레벨 0)
(0, '기획메뉴', 'Category2', '기획메뉴', '기획 업무 관리', '/', true, 7, 'system', 'system'),

-- 기획메뉴 > 비용관리 (레벨 1)
(1, '기획메뉴', 'Money', '비용관리', '프로젝트 비용 관리', '/apps/cost-management', true, 8, 'system', 'system'),

-- 기획메뉴 > 교육관리 (레벨 1)
(1, '기획메뉴', 'Book1', '교육관리', '교육 과정 관리', '/apps/education-management', true, 9, 'system', 'system');

-- 테이블 설명 추가
COMMENT ON TABLE Admin_Systemsetting_Menu IS '관리자 시스템설정 메뉴 관리 테이블';
COMMENT ON COLUMN Admin_Systemsetting_Menu.id IS '메뉴 고유 ID';
COMMENT ON COLUMN Admin_Systemsetting_Menu.menu_level IS '메뉴 레벨 (0: 그룹, 1: 하위메뉴, 2: 서브메뉴)';
COMMENT ON COLUMN Admin_Systemsetting_Menu.menu_category IS '메뉴 카테고리 (상위 그룹명)';
COMMENT ON COLUMN Admin_Systemsetting_Menu.menu_icon IS '메뉴 아이콘명';
COMMENT ON COLUMN Admin_Systemsetting_Menu.menu_page IS '메뉴 페이지명';
COMMENT ON COLUMN Admin_Systemsetting_Menu.menu_description IS '메뉴 설명';
COMMENT ON COLUMN Admin_Systemsetting_Menu.menu_url IS '메뉴 URL 경로';
COMMENT ON COLUMN Admin_Systemsetting_Menu.is_enabled IS '메뉴 활성화 여부';
COMMENT ON COLUMN Admin_Systemsetting_Menu.display_order IS '메뉴 표시 순서';
COMMENT ON COLUMN Admin_Systemsetting_Menu.created_by IS '생성자';
COMMENT ON COLUMN Admin_Systemsetting_Menu.updated_by IS '수정자';