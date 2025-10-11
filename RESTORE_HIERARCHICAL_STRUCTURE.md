# 마스터코드 계층 구조 복원 가이드

## 📌 현재 상태
- **플랫 구조 테이블** (`admin_mastercode_data`): 존재함 (19개 레코드)
- **계층 구조 테이블** (`admin_mastercode`, `admin_subcode`): 존재하지 않음

## 🔄 복원 절차

### 1. Supabase 대시보드 접속
1. [Supabase Dashboard](https://supabase.com/dashboard) 접속
2. 프로젝트 선택
3. SQL Editor 메뉴 클릭

### 2. SQL 실행
`create-hierarchical-tables.sql` 파일의 내용을 SQL Editor에 복사하여 실행

또는 아래 SQL을 단계별로 실행:

#### Step 1: 테이블 생성
```sql
-- 기존 플랫 구조 테이블은 유지 (나중에 삭제 예정)

-- 마스터코드 테이블 생성
CREATE TABLE IF NOT EXISTS admin_mastercode (
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

-- 서브코드 테이블 생성
CREATE TABLE IF NOT EXISTS admin_subcode (
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
```

#### Step 2: 인덱스 생성
```sql
CREATE INDEX idx_admin_mastercode_code_group ON admin_mastercode(code_group);
CREATE INDEX idx_admin_mastercode_is_active ON admin_mastercode(is_active);
CREATE INDEX idx_admin_subcode_mastercode_id ON admin_subcode(mastercode_id);
CREATE INDEX idx_admin_subcode_sub_code ON admin_subcode(sub_code);
CREATE INDEX idx_admin_subcode_is_active ON admin_subcode(is_active);
```

#### Step 3: RLS 설정
```sql
ALTER TABLE admin_mastercode ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_subcode ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable all operations for admin_mastercode" ON admin_mastercode
    FOR ALL USING (true) WITH CHECK (true);

CREATE POLICY "Enable all operations for admin_subcode" ON admin_subcode
    FOR ALL USING (true) WITH CHECK (true);
```

### 3. 데이터 확인
```bash
node check-tables.js
```

### 4. 데이터 삽입
테이블 생성 후 `node restore-hierarchical-with-supabase.js` 실행

## 📊 예상 결과
- 마스터코드: 5개 (USER_LEVEL, TASK_STATUS, PRIORITY, DEPT_TYPE, DOC_TYPE)
- 서브코드: 21개 (각 마스터코드별 서브코드)

## ⚠️ 주의사항
- 플랫 구조 테이블(`admin_mastercode_data`)은 서비스 레이어 수정 후 삭제 예정
- 계층 구조로 완전히 전환 후 플랫 구조 테이블 삭제