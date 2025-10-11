-- admin_mastercode_data 테이블 생성
CREATE TABLE IF NOT EXISTS public.admin_mastercode_data (
    id SERIAL PRIMARY KEY,

    -- 레코드 타입 구분
    codetype VARCHAR(10) NOT NULL CHECK (codetype IN ('group', 'subcode')),

    -- 그룹 정보
    group_code VARCHAR(50) NOT NULL,
    group_code_name VARCHAR(200) NOT NULL,
    group_code_description TEXT DEFAULT '',
    group_code_status VARCHAR(20) DEFAULT 'active' CHECK (group_code_status IN ('active', 'inactive')),
    group_code_order INTEGER DEFAULT 0,

    -- 서브코드 정보
    subcode VARCHAR(50) DEFAULT '',
    subcode_name VARCHAR(200) DEFAULT '',
    subcode_description TEXT DEFAULT '',
    subcode_status VARCHAR(20) DEFAULT 'active' CHECK (subcode_status IN ('active', 'inactive')),
    subcode_remark TEXT DEFAULT '',
    subcode_order INTEGER DEFAULT 0,

    -- 공통 필드
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by VARCHAR(100) DEFAULT 'system',
    updated_by VARCHAR(100) DEFAULT 'system'
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_admin_mastercode_data_codetype ON public.admin_mastercode_data(codetype);
CREATE INDEX IF NOT EXISTS idx_admin_mastercode_data_group_code ON public.admin_mastercode_data(group_code);
CREATE INDEX IF NOT EXISTS idx_admin_mastercode_data_group_order ON public.admin_mastercode_data(group_code_order);
CREATE INDEX IF NOT EXISTS idx_admin_mastercode_data_subcode_order ON public.admin_mastercode_data(subcode_order);

-- 기존 데이터 복사
INSERT INTO public.admin_mastercode_data (
    codetype, group_code, group_code_name, group_code_description,
    group_code_status, group_code_order, subcode, subcode_name,
    subcode_description, subcode_status, subcode_remark, subcode_order,
    is_active, created_at, updated_at, created_by, updated_by
)
SELECT
    codetype, group_code, group_code_name, group_code_description,
    group_code_status, group_code_order, subcode, subcode_name,
    subcode_description, subcode_status, subcode_remark, subcode_order,
    is_active, created_at, updated_at, created_by, updated_by
FROM public.admin_mastercode3_flat
WHERE NOT EXISTS (
    SELECT 1 FROM public.admin_mastercode_data
    WHERE admin_mastercode_data.group_code = admin_mastercode3_flat.group_code
    AND admin_mastercode_data.codetype = admin_mastercode3_flat.codetype
    AND admin_mastercode_data.subcode = admin_mastercode3_flat.subcode
);

-- 트리거 함수 생성 (updated_at 자동 업데이트)
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 트리거 생성
DROP TRIGGER IF EXISTS update_admin_mastercode_data_updated_at ON public.admin_mastercode_data;
CREATE TRIGGER update_admin_mastercode_data_updated_at
    BEFORE UPDATE ON public.admin_mastercode_data
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- RLS 설정
ALTER TABLE public.admin_mastercode_data ENABLE ROW LEVEL SECURITY;

-- 모든 사용자가 읽기 가능
CREATE POLICY "Enable read access for all users" ON public.admin_mastercode_data
    FOR SELECT USING (true);

-- 인증된 사용자만 쓰기 가능
CREATE POLICY "Enable insert for authenticated users only" ON public.admin_mastercode_data
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Enable update for authenticated users only" ON public.admin_mastercode_data
    FOR UPDATE USING (auth.role() = 'authenticated');

CREATE POLICY "Enable delete for authenticated users only" ON public.admin_mastercode_data
    FOR DELETE USING (auth.role() = 'authenticated');