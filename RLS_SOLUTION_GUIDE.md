# RLS (Row Level Security) 문제 해결 가이드

## 🚨 문제 상황
Supabase에서 RLS 정책 때문에 데이터 읽기/쓰기가 계속 실패하는 문제

## ✅ 해결 방법 (3가지 옵션)

### 옵션 1: RLS 완전 비활성화 (가장 간단) ⭐추천⭐
개발 환경에서 가장 빠르고 확실한 방법

```sql
-- Supabase SQL Editor에서 실행
-- disable-all-rls.sql 파일 내용 전체 실행
```

**장점:**
- 즉시 모든 문제 해결
- 개발 중 권한 문제 없음
- 설정이 매우 간단

**단점:**
- 프로덕션에서는 보안 위험
- 실제 배포 전 RLS 재설정 필요

### 옵션 2: 느슨한 RLS 정책 적용
RLS는 유지하되 모든 사용자에게 권한 부여

```sql
-- Supabase SQL Editor에서 실행
-- development-rls-policies.sql 파일 내용 전체 실행
```

**장점:**
- RLS 구조는 유지
- 프로덕션 전환 시 수정 용이
- 기본적인 보안 구조 유지

**단점:**
- 여전히 인증 필요
- 익명 사용자 제한적

### 옵션 3: Supabase 서비스 키 사용
클라이언트에서 Service Role Key 사용 (보안 위험!)

```typescript
// src/lib/supabase.ts 수정
const supabaseServiceKey = 'your-service-role-key';
export const supabase = createClient(supabaseUrl, supabaseServiceKey);
```

**주의:** 절대 프로덕션에서 사용 금지!

## 🔧 실행 방법

### 1단계: Supabase Dashboard 접속
1. https://app.supabase.com 로그인
2. 프로젝트 선택
3. SQL Editor 탭 클릭

### 2단계: SQL 실행
1. `disable-all-rls.sql` 파일 내용 복사
2. SQL Editor에 붙여넣기
3. Run 버튼 클릭

### 3단계: 확인
```sql
-- RLS 상태 확인
SELECT tablename, rowsecurity 
FROM pg_tables 
WHERE schemaname = 'public';
```

## 📝 프로덕션 배포 전 체크리스트

- [ ] 적절한 RLS 정책 재설정
- [ ] 사용자별 권한 분리
- [ ] Service Role Key 제거
- [ ] 환경변수 보안 설정
- [ ] 테스트 환경에서 권한 테스트

## 💡 팁

### 개발 환경 설정
```javascript
// .env.local
NEXT_PUBLIC_SUPABASE_DISABLE_RLS=true

// supabase 초기화 시
if (process.env.NEXT_PUBLIC_SUPABASE_DISABLE_RLS === 'true') {
  console.warn('⚠️ RLS is disabled for development');
}
```

### 자주 발생하는 에러와 해결책

| 에러 코드 | 의미 | 해결책 |
|---------|------|--------|
| 42501 | RLS 정책 위반 | RLS 비활성화 또는 정책 수정 |
| 42P01 | 테이블 없음 | 테이블 생성 SQL 실행 |
| PGRST301 | JWT 문제 | 환경변수 확인 |

## 🔒 보안 권고사항

1. **개발 환경**: RLS 비활성화 OK
2. **스테이징**: 느슨한 RLS 정책 적용
3. **프로덕션**: 엄격한 RLS 정책 필수

---

## 즉시 해결 명령어

```bash
# 1. 현재 디렉토리에서
cat disable-all-rls.sql

# 2. 내용 복사 후 Supabase SQL Editor에서 실행

# 3. 앱 재시작
npm run dev
```

문제가 해결되면 정상적으로 시스템 설정을 저장할 수 있습니다!