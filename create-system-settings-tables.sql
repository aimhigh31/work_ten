-- ========================================
-- 시스템 설정 관리를 위한 Supabase 테이블 생성
-- ========================================

-- 1. 시스템 설정 테이블 (일반설정, 알림설정 등)
CREATE TABLE IF NOT EXISTS system_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value JSONB NOT NULL,
    setting_type VARCHAR(50) DEFAULT 'general', -- 'general', 'notification', 'maintenance', 'appearance'
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 메뉴 설정 테이블 (사이드바 메뉴 활성/비활성 관리)
CREATE TABLE IF NOT EXISTS menu_settings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    menu_id VARCHAR(100) UNIQUE NOT NULL,
    menu_title VARCHAR(200) NOT NULL,
    menu_level INTEGER DEFAULT 0,
    menu_url VARCHAR(500),
    parent_group VARCHAR(200),
    menu_type VARCHAR(50) DEFAULT 'item', -- 'group', 'collapse', 'item'
    icon_name VARCHAR(100),
    is_enabled BOOLEAN DEFAULT true,
    display_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 시스템 설정 기본값 삽입
INSERT INTO system_settings (setting_key, setting_value, setting_type, description) VALUES
-- 일반 설정
('site_name', '"Admin Dashboard"', 'general', '사이트 이름'),
('site_description', '"Next.js 관리자 시스템"', 'general', '사이트 설명'),
('site_logo', 'null', 'appearance', '사이트 로고 URL'),

-- 유지보수 설정
('maintenance_mode', 'false', 'maintenance', '유지보수 모드 활성화'),
('maintenance_message', '"시스템 점검 중입니다. 잠시 후 다시 시도해 주세요."', 'maintenance', '유지보수 모드 메시지'),

-- 알림 설정
('email_notifications', 'true', 'notification', '이메일 알림 활성화'),
('sms_notifications', 'false', 'notification', 'SMS 알림 활성화')

ON CONFLICT (setting_key) DO UPDATE SET
    setting_value = EXCLUDED.setting_value,
    updated_at = NOW();

-- 4. 메뉴 설정 기본값 삽입 (현재 메뉴 구조 반영)
INSERT INTO menu_settings (menu_id, menu_title, menu_level, menu_url, parent_group, menu_type, is_enabled, display_order) VALUES
-- Admin Panel (관리자메뉴)
('group-admin-panel', 'Admin Panel', 0, NULL, NULL, 'group', true, 1),
('system-settings', '시스템 설정', 1, '/admin-panel/system-settings', 'Admin Panel', 'item', true, 1),
('user-management', '기준 정보', 1, '/admin-panel/user-settings', 'Admin Panel', 'item', true, 2),

-- Main Menu (핵심 업무 기능)
('group-main-menu', 'Main Menu', 0, NULL, NULL, 'group', true, 2),
('dashboard', '대시보드', 1, '/dashboard', 'Main Menu', 'item', true, 1),
('task', '업무관리', 1, '/apps/task', 'Main Menu', 'item', true, 2),
('calendar', '일정관리', 1, '/apps/calendar', 'Main Menu', 'item', true, 3),
('education', '교육관리', 1, '/apps/education', 'Main Menu', 'item', true, 4),
('cost', '비용관리', 1, '/apps/cost', 'Main Menu', 'item', true, 5),

-- Planning Menu (기획 및 전략)
('group-planning-menu', 'Planning Menu', 0, NULL, NULL, 'group', true, 3),
('sales', '매출관리', 1, '/planning/sales', 'Planning Menu', 'item', true, 1),
('inventory', '재고관리', 1, '/planning/inventory', 'Planning Menu', 'item', true, 2),
('personnel', '인력관리', 1, '/planning/personnel', 'Planning Menu', 'item', true, 3),
('investment', '투자관리', 1, '/planning/investment', 'Planning Menu', 'item', true, 4),

-- IT Menu (IT 서비스)
('group-it-menu', 'IT Menu', 0, NULL, NULL, 'group', true, 4),
('voc', 'VOC관리', 1, '/it/voc', 'IT Menu', 'item', true, 1),
('solution', '솔루션관리', 1, '/it/solution', 'IT Menu', 'item', true, 2),
('hardware', '하드웨어관리', 1, '/it/hardware', 'IT Menu', 'item', true, 3),
('software', '소프트웨어관리', 1, '/it/software', 'IT Menu', 'item', true, 4),
('it-education', 'IT교육관리', 1, '/it/education', 'IT Menu', 'item', true, 5),

-- Security Menu (보안 정책)
('group-security-menu', 'Security Menu', 0, NULL, NULL, 'group', true, 5),
('regulations', '보안규정', 1, '/security/regulations', 'Security Menu', 'item', true, 1),
('inspection', '보안점검', 1, '/security/inspection', 'Security Menu', 'item', true, 2),
('security-education', '보안교육', 1, '/security/education', 'Security Menu', 'item', true, 3),
('incident', '사고관리', 1, '/security/incident', 'Security Menu', 'item', true, 4)

ON CONFLICT (menu_id) DO UPDATE SET
    menu_title = EXCLUDED.menu_title,
    menu_url = EXCLUDED.menu_url,
    updated_at = NOW();

-- 5. 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON system_settings(setting_key);
CREATE INDEX IF NOT EXISTS idx_system_settings_type ON system_settings(setting_type);
CREATE INDEX IF NOT EXISTS idx_menu_settings_enabled ON menu_settings(is_enabled);
CREATE INDEX IF NOT EXISTS idx_menu_settings_level ON menu_settings(menu_level);
CREATE INDEX IF NOT EXISTS idx_menu_settings_order ON menu_settings(display_order);

-- 6. RLS (Row Level Security) 정책 설정
ALTER TABLE system_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE menu_settings ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능 (관리자만 수정 가능하도록 추후 설정)
CREATE POLICY "Allow read access for all users" ON system_settings
    FOR SELECT USING (true);

CREATE POLICY "Allow read access for all users" ON menu_settings
    FOR SELECT USING (true);

-- 관리자만 수정 가능 (추후 auth.users와 연동 시 수정 필요)
CREATE POLICY "Allow all operations for authenticated users" ON system_settings
    FOR ALL USING (auth.uid() IS NOT NULL);

CREATE POLICY "Allow all operations for authenticated users" ON menu_settings
    FOR ALL USING (auth.uid() IS NOT NULL);

-- 7. 업데이트 트리거 함수 생성 (updated_at 자동 갱신)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 적용
CREATE TRIGGER update_system_settings_updated_at 
    BEFORE UPDATE ON system_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_menu_settings_updated_at 
    BEFORE UPDATE ON menu_settings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 8. 테이블 생성 완료 로그
SELECT 'System Settings Tables Created Successfully!' AS status;