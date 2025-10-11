# it_software_user 테이블 수동 생성 가이드

## 1. Supabase 대시보드에서 테이블 생성

1. https://supabase.com/dashboard 접속
2. 프로젝트 선택
3. 왼쪽 메뉴에서 "Table Editor" 클릭
4. "Create a new table" 버튼 클릭
5. 테이블 이름: `it_software_user`

## 2. 컬럼 설정

| 컬럼명 | 타입 | 설정 | 기본값 |
|--------|------|------|--------|
| id | int8 | Primary Key, Auto Increment | |
| software_id | int8 | Not Null | |
| user_name | text | Not Null | |
| department | text | | |
| exclusive_id | text | | |
| reason | text | | |
| usage_status | text | | '사용중' |
| start_date | date | | |
| end_date | date | | |
| registration_date | date | | today() |
| created_by | text | | 'user' |
| updated_by | text | | 'user' |
| is_active | bool | | true |
| created_at | timestamptz | | now() |
| updated_at | timestamptz | | now() |

## 3. 또는 SQL Editor에서 직접 실행

```sql
CREATE TABLE IF NOT EXISTS it_software_user (
  id bigserial PRIMARY KEY,
  software_id bigint NOT NULL,
  user_name text NOT NULL,
  department text,
  exclusive_id text,
  reason text,
  usage_status text DEFAULT '사용중',
  start_date date,
  end_date date,
  registration_date date DEFAULT CURRENT_DATE,
  created_by text DEFAULT 'user',
  updated_by text DEFAULT 'user',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),

  -- Foreign Key (if it_software_data exists)
  CONSTRAINT it_software_user_software_id_fkey
    FOREIGN KEY (software_id) REFERENCES it_software_data(id) ON DELETE CASCADE
);

-- 인덱스 생성
CREATE INDEX IF NOT EXISTS idx_it_software_user_software_id ON it_software_user(software_id);
CREATE INDEX IF NOT EXISTS idx_it_software_user_is_active ON it_software_user(is_active);
```

## 4. 테이블 확인

테이블 생성 후 다음 명령으로 확인:

```bash
node -e "
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

supabase.from('it_software_user').select('id').limit(1).then(({error}) => {
  if (error) {
    console.log('❌ 테이블 없음:', error.message);
  } else {
    console.log('✅ it_software_user 테이블 생성 완료!');
  }
});
"
```