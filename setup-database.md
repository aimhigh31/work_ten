# Supabase 데이터베이스 설정 가이드

## 1. Supabase Dashboard 접속
- https://supabase.com 접속
- 로그인 후 프로젝트 선택 (exxumujwufzqnovhzvif)

## 2. SQL Editor에서 스키마 생성
다음 순서로 SQL 파일을 실행하세요:

1. **기본 확장 프로그램 및 사용자 테이블**
   ```sql
   -- supabase/migrations/20250912000001_nexwork_complete_schema.sql 파일의 내용을 실행
   ```

## 3. RLS (Row Level Security) 임시 비활성화 (개발용)
개발 중에는 RLS를 비활성화하여 테스트할 수 있습니다:

```sql
-- cost_records 테이블의 RLS 비활성화
ALTER TABLE cost_records DISABLE ROW LEVEL SECURITY;

-- 또는 모든 사용자가 읽을 수 있도록 임시 정책 추가
CREATE POLICY "Allow all for development" ON cost_records
  FOR ALL USING (true);
```

## 4. 테이블 생성 확인
SQL Editor에서 다음 쿼리를 실행하여 테이블이 생성되었는지 확인:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('cost_records', 'user_profiles', 'task_records');
```

## 5. 샘플 데이터 추가 (선택사항)
```sql
INSERT INTO cost_records (
  registration_date,
  start_date,
  code,
  team,
  cost_type,
  content,
  quantity,
  unit_price,
  amount,
  status
) VALUES (
  '2025-01-01',
  '2025-01-01',
  'COST-2025-001',
  'IT팀',
  '솔루션',
  '테스트 비용 항목',
  1,
  100000,
  100000,
  '대기'
);
```

## 6. 연결 테스트
브라우저에서 http://localhost:3201 접속하여 콘솔 확인