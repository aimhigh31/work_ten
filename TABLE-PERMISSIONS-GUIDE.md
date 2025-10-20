# 📋 Supabase 테이블 권한 설정 가이드

## 🎯 목적
Service Role 키를 Anon 키로 전환한 후, 테이블별로 적절한 권한을 설정하여 보안을 강화합니다.

---

## 📂 파일 구성

| 파일명 | 설명 |
|--------|------|
| `setup-table-permissions.sql` | 권한 설정 스크립트 (메인) |
| `rollback-table-permissions.sql` | 롤백 스크립트 (문제 발생 시) |
| `TABLE-PERMISSIONS-GUIDE.md` | 이 가이드 문서 |

---

## 🚀 실행 방법

### 1️⃣ Supabase Dashboard 접속
```
https://supabase.com/dashboard
```

### 2️⃣ 프로젝트 선택
- 프로젝트 ID: `exxumujwufzqnovhzvif`

### 3️⃣ SQL Editor 이동
- 왼쪽 메뉴 → **SQL Editor**

### 4️⃣ 스크립트 실행

#### **방법 A: 파일 업로드 (추천)**
1. SQL Editor 우측 상단 **"New query"** 클릭
2. 파일 내용 복사 후 붙여넣기
3. **"Run"** 버튼 클릭 (또는 Ctrl+Enter)

#### **방법 B: 직접 붙여넣기**
1. `setup-table-permissions.sql` 파일 열기
2. 전체 내용 복사 (Ctrl+A → Ctrl+C)
3. SQL Editor에 붙여넣기 (Ctrl+V)
4. **"Run"** 버튼 클릭

---

## 📊 권한 레벨 설명

### 🚫 **레벨 1: 완전 차단 (민감 정보)**
**대상 테이블:**
- `admin_salary` (급여 정보)
- `admin_evaluation` (평가 정보)

**권한:**
- 손님 (anon): ❌ 접근 불가
- 직원 (authenticated): ❌ 접근 불가
- 관리자 (service_role): ✅ 모든 권한

---

### 👁️ **레벨 2: 읽기 전용 (기본 정보)**
**대상 테이블:**
- `admin_users_userprofiles` (사용자 프로필)
- `admin_departments` (부서 정보)
- `admin_mastercode_h/l` (마스터코드)
- `admin_systemsetting_menu` (메뉴 관리)

**권한:**
- 손님 (anon): 👁️ 읽기만 가능
- 직원 (authenticated): 👁️ 읽기만 가능
- 관리자 (service_role): ✅ 모든 권한

---

### 🔨 **레벨 3: 직원 작업용 (업무 데이터)**
**대상 테이블:**
- `main_task_management` (업무 관리)
- `main_it_education` (교육 관리)
- `main_voc` (VOC 관리)
- `main_solution` (솔루션 관리)
- `main_security_*` (보안 관련)
- `main_kpi*` (KPI 관련)
- `main_cost` (비용 관리)
- `main_sales` (매출 관리)
- `main_it_hardware*` (하드웨어 관리)
- `main_it_software*` (소프트웨어 관리)
- `admin_checklist_data` (체크리스트)
- `admin_change_log` (변경로그)
- `admin_feedback` (피드백)
- `admin_files` (파일 관리)

**권한:**
- 손님 (anon): ❌ 접근 불가
- 직원 (authenticated): ✅ 생성/읽기/수정/삭제 가능
- 관리자 (service_role): ✅ 모든 권한

---

## ✅ 실행 후 확인사항

### 1. 스크립트 실행 결과 확인
SQL Editor 하단에 다음 메시지들이 표시됩니다:
```
✅ admin_users_userprofiles: 읽기 전용
✅ main_task_management: 직원 전용
✅ 모든 테이블 권한 설정 완료!
```

### 2. 권한 테이블 확인
스크립트 실행 후 자동으로 권한 요약 테이블이 표시됩니다:
```
테이블명                      | 권한
------------------------------|--------------------------------
admin_users_userprofiles      | 👁️손님(보기), 👁️직원(보기), 🔑관리자(전체)
main_task_management          | 🔨직원(편집), 🔑관리자(전체)
```

### 3. 애플리케이션 테스트

#### **필수: 개발 서버 재시작**
```bash
# 1. 현재 서버 중지 (Ctrl+C)
# 2. 재시작
npm run dev
```

#### **테스트 항목:**
- [ ] 로그인 작동
- [ ] 사용자 목록 조회
- [ ] Task 생성/수정/삭제
- [ ] 교육 데이터 조회
- [ ] 프로필 이미지 표시

---

## 🚨 문제 발생 시 대응

### Case 1: 데이터 조회 안 됨
**증상:**
```
Error: permission denied for table admin_users_userprofiles
```

**해결:**
```sql
-- 특정 테이블에 읽기 권한 추가
GRANT SELECT ON admin_users_userprofiles TO authenticated;
```

---

### Case 2: 데이터 수정/삭제 안 됨
**증상:**
```
Error: permission denied for table main_task_management
```

**해결:**
```sql
-- 특정 테이블에 쓰기 권한 추가
GRANT INSERT, UPDATE, DELETE ON main_task_management TO authenticated;
```

---

### Case 3: 전체 롤백 필요
**모든 권한을 원래대로 되돌리기:**

1. SQL Editor에서 `rollback-table-permissions.sql` 실행
2. 개발 서버 재시작
3. 정상 작동 확인 후 다시 `setup-table-permissions.sql` 실행

---

## 🔍 수동 권한 확인 방법

### 특정 테이블의 권한 확인
```sql
SELECT
  grantee as "역할",
  privilege_type as "권한"
FROM information_schema.role_table_grants
WHERE table_name = 'main_task_management'  -- 확인할 테이블명
  AND table_schema = 'public';
```

### 모든 테이블의 권한 요약
```sql
SELECT
  table_name as "테이블명",
  STRING_AGG(grantee || '(' || privilege_type || ')', ', ') as "권한"
FROM information_schema.role_table_grants
WHERE table_schema = 'public'
  AND (table_name LIKE 'admin_%' OR table_name LIKE 'main_%')
GROUP BY table_name
ORDER BY table_name;
```

---

## 📝 추가 권한 설정 예시

### 특정 테이블을 완전 차단하고 싶을 때
```sql
-- 예: 새로운 민감 테이블 보호
REVOKE ALL ON admin_new_sensitive_table FROM anon, authenticated, PUBLIC;
GRANT ALL ON admin_new_sensitive_table TO service_role;
```

### 특정 테이블을 읽기 전용으로 만들고 싶을 때
```sql
-- 예: 공지사항은 읽기만 가능
REVOKE ALL ON admin_notices FROM anon, authenticated, PUBLIC;
GRANT SELECT ON admin_notices TO anon, authenticated;
GRANT ALL ON admin_notices TO service_role;
```

### 특정 테이블을 직원 편집 가능하게 하고 싶을 때
```sql
-- 예: 새로운 업무 테이블 추가
REVOKE ALL ON main_new_work_table FROM anon, authenticated, PUBLIC;
GRANT SELECT, INSERT, UPDATE, DELETE ON main_new_work_table TO authenticated;
GRANT ALL ON main_new_work_table TO service_role;
```

---

## ⚠️ 주의사항

### DO ✅
- 스크립트 실행 전 현재 데이터 백업
- 실행 후 반드시 테스트
- 문제 발생 시 즉시 롤백

### DON'T ❌
- 프로덕션 환경에서 바로 실행하지 말 것
- service_role 권한은 절대 제거하지 말 것
- 테스트 없이 여러 스크립트 동시 실행 금지

---

## 🔐 보안 수준 비교

| 상태 | Service Role 키 | Anon 키 + 권한 설정 |
|------|-----------------|---------------------|
| 클라이언트 노출 | 🔴 완전 노출 | 🟢 안전 |
| 민감 정보 접근 | 🔴 누구나 가능 | 🟢 관리자만 |
| 데이터 수정 | 🔴 제한 없음 | 🟢 로그인 필요 |
| RLS 우회 | 🔴 우회됨 | 🟢 적용됨 |
| 보안 등급 | 🔴 매우 위험 | 🟢 안전 |

---

## 📞 문제 해결 체크리스트

- [ ] 스크립트가 에러 없이 완료되었나요?
- [ ] 권한 요약 테이블이 표시되었나요?
- [ ] 개발 서버를 재시작했나요?
- [ ] 로그인이 정상적으로 작동하나요?
- [ ] 데이터 조회가 되나요?
- [ ] 데이터 수정이 되나요?
- [ ] 브라우저 콘솔에 권한 에러가 없나요?

**모든 항목이 체크되면 성공! 🎉**

---

## 🎯 다음 단계 (선택 사항)

### 1. RLS 정책 추가 (더 세밀한 제어)
```sql
-- 예: 사용자는 본인 데이터만 수정 가능
ALTER TABLE admin_users_userprofiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can update own profile"
ON admin_users_userprofiles
FOR UPDATE
USING (auth.uid()::text = id::text);
```

### 2. 애플리케이션 레벨 권한 관리
- `usePermissions` 훅 구현
- 역할별 UI 제어
- NestJS 전환 시 재사용 가능

---

## 📚 참고 자료

- [Supabase 공식 문서 - Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL 권한 관리](https://www.postgresql.org/docs/current/sql-grant.html)
- [Supabase Dashboard](https://supabase.com/dashboard)

---

**작성일:** 2025-10-19
**버전:** 1.0
**상태:** ✅ 준비 완료
