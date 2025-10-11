-- 통합 마스터코드 테이블 생성
CREATE TABLE IF NOT EXISTS admin_mastercode (
  id SERIAL PRIMARY KEY,
  parent_id INTEGER REFERENCES admin_mastercode(id) ON DELETE CASCADE,
  code_group VARCHAR(50),        -- 최상위 레벨만 사용 (NULL for 서브코드)
  code_value VARCHAR(50),        -- 서브코드 레벨만 사용 (NULL for 마스터코드)
  code_name VARCHAR(100) NOT NULL,
  code_description TEXT,
  level INTEGER DEFAULT 0,       -- 0: 마스터, 1: 서브, 2: 하위서브...
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_system BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by VARCHAR(50) DEFAULT 'system',
  updated_by VARCHAR(50) DEFAULT 'system',
  metadata JSONB
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_admin_mastercode_parent_id ON admin_mastercode(parent_id);
CREATE INDEX IF NOT EXISTS idx_admin_mastercode_code_group ON admin_mastercode(code_group);
CREATE INDEX IF NOT EXISTS idx_admin_mastercode_level ON admin_mastercode(level);
CREATE INDEX IF NOT EXISTS idx_admin_mastercode_is_active ON admin_mastercode(is_active);

-- RLS 정책 설정 (기존 테이블과 동일하게)
ALTER TABLE admin_mastercode ENABLE ROW LEVEL SECURITY;

-- 모든 사용자에게 읽기 권한
CREATE POLICY "Allow read access for all users" ON admin_mastercode FOR SELECT USING (true);

-- 인증된 사용자에게 모든 권한
CREATE POLICY "Allow all operations for authenticated users" ON admin_mastercode FOR ALL USING (true);