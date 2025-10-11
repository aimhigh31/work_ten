# Nexwork Supabase 설정 가이드

## 개요
이 가이드는 Nexwork 프로젝트에서 Supabase 백엔드를 설정하고 데이터를 마이그레이션하는 과정을 설명합니다.

## 전제 조건
- Supabase 프로젝트가 생성되어 있어야 함
- .env.local 파일에 Supabase 환경변수가 설정되어 있어야 함

## 환경변수 설정

`.env.local` 파일을 프로젝트 루트에 생성하고 다음 내용을 추가하세요:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
DATABASE_URL=your_database_connection_string
```

## 설정 단계별 가이드

### 1. 환경변수 확인
```bash
npm run supabase:check-env
```
- Supabase 환경변수가 올바르게 설정되었는지 확인

### 2. 데이터베이스 스키마 생성 (수동)
Supabase CLI 접근 문제로 인해 수동으로 SQL 스크립트를 실행해야 합니다:

1. Supabase Dashboard > SQL Editor 접속
2. 다음 순서로 SQL 파일 실행:
   ```
   sql-for-dashboard/01-extensions-and-basic-tables.sql
   sql-for-dashboard/02-cost-management-tables.sql
   sql-for-dashboard/03-task-education-tables.sql
   ```

### 3. 데이터 마이그레이션
```bash
npm run supabase:migrate-data
```
- 기존 mock 데이터를 Supabase로 이전
- 사용자 프로필, 비용 기록, 업무 기록, 교육 기록 포함

### 4. 데이터 검증
```bash
npm run supabase:verify
```
- 마이그레이션된 데이터의 무결성 검증
- 테이블 카운트 확인
- 외래키 제약조건 검증
- RLS 정책 동작 확인

### 5. 전체 설정 (자동화)
```bash
npm run supabase:setup
```
- 환경변수 확인 → 스키마 생성 → 데이터 마이그레이션 → 검증을 한 번에 실행
- ⚠️ 현재 스키마 생성 부분은 수동 실행 필요

## 데이터베이스 스키마

### 핵심 테이블
- `user_profiles`: 사용자 프로필 (auth.users 확장)
- `cost_records`: 비용 관리 메인 테이블
- `cost_amount_details`: 비용 상세 내역
- `cost_comments`: 비용 코멘트
- `cost_attachments`: 비용 첨부파일
- `task_records`: 업무 관리 메인 테이블
- `task_attachments`: 업무 첨부파일
- `education_records`: 교육 관리 메인 테이블
- `education_curriculum`: 교육 커리큘럼
- `education_participants`: 교육 참석자

### 보안 정책
- Row Level Security (RLS) 활성화
- 사용자별/역할별 데이터 접근 제어
- 생성자/담당자/관리자만 해당 데이터 조회 가능

### 자동화 기능
- UUID 기반 기본키
- 자동 코드 생성 (COST-YY-NNN, TASK-YY-NNN, EDU-X-YY-NNN)
- 타임스탬프 자동 관리
- 금액 계산 검증 제약조건

## 트러블슈팅

### 1. 환경변수 문제
- `.env.local` 파일 존재 및 내용 확인
- Supabase 프로젝트 설정에서 키 재확인

### 2. 스키마 생성 실패
- Supabase Dashboard에서 수동 실행
- SQL 실행 순서 준수 (의존성 고려)

### 3. 데이터 마이그레이션 실패
- 스키마가 먼저 생성되었는지 확인
- 외래키 제약조건 확인
- 테이블 권한 확인

### 4. RLS 정책 문제
- Service Role Key 사용 확인
- 정책 조건 재검토
- 사용자 인증 상태 확인

## 다음 단계

1. ✅ 데이터베이스 스키마 완성
2. ✅ 기본 데이터 마이그레이션 완료
3. 🔄 Frontend API 연동 구현
4. 🔄 파일 업로드/Storage 연동
5. 🔄 실시간 기능 구현
6. 🔄 성능 최적화

## 주의사항

- 프로덕션 환경에서는 더 강력한 보안 정책 필요
- 정기적인 백업 설정 권장
- 인덱스 최적화 고려
- 데이터 용량 모니터링 필요