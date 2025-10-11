# 🚀 it_software_user 테이블 생성 가이드

## 📋 단계별 생성 방법

### 1단계: Supabase Dashboard 접속
1. 브라우저에서 https://supabase.com/dashboard 접속
2. 로그인 후 프로젝트 선택

### 2단계: SQL Editor 열기
1. 왼쪽 메뉴에서 **"SQL Editor"** 클릭
2. **"New Query"** 버튼 클릭

### 3단계: SQL 실행
아래 SQL을 복사해서 붙여넣고 **"RUN"** 버튼을 클릭하세요:

```sql
-- it_software_user 테이블 생성
CREATE TABLE IF NOT EXISTS public.it_software_user (
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
  updated_at timestamptz DEFAULT now()
);

-- 인덱스 생성 (성능 최적화)
CREATE INDEX IF NOT EXISTS idx_it_software_user_software_id ON public.it_software_user(software_id);
CREATE INDEX IF NOT EXISTS idx_it_software_user_is_active ON public.it_software_user(is_active);
CREATE INDEX IF NOT EXISTS idx_it_software_user_user_name ON public.it_software_user(user_name);

-- Row Level Security (RLS) 설정
ALTER TABLE public.it_software_user ENABLE ROW LEVEL SECURITY;

-- RLS 정책 생성 (모든 사용자에게 모든 권한 허용)
CREATE POLICY "Enable all operations for authenticated users" ON public.it_software_user
FOR ALL USING (true);
```

### 4단계: 생성 확인
터미널에서 다음 명령어로 테이블 생성을 확인하세요:

```bash
node check_table_created.js
```

## 🎯 생성 완료 후 효과

테이블 생성 완료 시:
- ✅ 소프트웨어관리 페이지의 사용자이력탭이 DB와 연동됩니다
- ✅ 사용자이력 데이터가 자동으로 저장/조회됩니다
- ✅ data_relation.md 패턴에 따른 안정적인 DB 관리

## ⚡ 빠른 확인

생성이 완료되면 콘솔에서 다음과 같은 메시지를 볼 수 있습니다:
- `⚠️ it_software_user 테이블이 존재하지 않습니다. 빈 배열을 반환합니다.` ← 이 메시지가 사라집니다
- `✅ 사용자이력 조회 성공: N개` ← 이 메시지가 나타납니다

## 🔧 문제 해결

만약 외래키 에러가 발생한다면:
```sql
-- 외래키 제약 조건 추가 (옵션)
ALTER TABLE public.it_software_user
ADD CONSTRAINT it_software_user_software_id_fkey
FOREIGN KEY (software_id) REFERENCES public.it_software_data(id) ON DELETE CASCADE;
```

## 📞 도움이 필요한 경우

1. SQL 에러 발생 시: 에러 메시지를 확인하고 다시 시도
2. 권한 에러 발생 시: 프로젝트 관리자 권한 확인
3. 테이블이 보이지 않는 경우: 브라우저 새로고침 후 확인