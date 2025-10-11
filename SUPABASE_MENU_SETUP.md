# 메뉴 관리 시스템 Supabase 설정 가이드

## 📋 개요

시스템설정 메뉴관리 탭에서 Supabase DB를 사용하기 위한 설정 가이드입니다.

## 🚀 빠른 시작 (선택사항)

**Supabase 설정 없이도 정상 작동합니다!**
- 환경 변수가 설정되지 않으면 자동으로 localStorage를 사용
- 모든 기능(체크박스, 설명 입력)이 로컬에서 동작
- 브라우저를 새로고침해도 데이터 유지

## 🔧 Supabase 연동 설정 (선택사항)

### 1. 환경 변수 설정

`.env.local` 파일을 생성하고 다음 내용을 추가:

```bash
# Supabase 설정
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### 2. Supabase 테이블 생성

`create-admin-systemsetting-menu-table.sql` 파일을 Supabase SQL Editor에서 실행:

1. Supabase Dashboard → SQL Editor
2. 파일 내용 복사 & 붙여넣기
3. "Run" 버튼 클릭

### 3. 테이블 구조

```sql
Admin_Systemsetting_Menu (
  id: BIGSERIAL PRIMARY KEY,
  menu_level: INTEGER,           -- 메뉴 레벨 (0: 그룹, 1: 하위)
  menu_category: VARCHAR(100),   -- 메뉴 카테고리
  menu_page: VARCHAR(100),       -- 메뉴 페이지명
  menu_description: TEXT,        -- 메뉴 설명
  menu_url: VARCHAR(200),        -- 메뉴 URL
  is_enabled: BOOLEAN,           -- 사용여부
  display_order: INTEGER,        -- 표시순서
  created_at: TIMESTAMPTZ,       -- 생성일
  updated_at: TIMESTAMPTZ        -- 수정일
)
```

## 📱 기능

### ✅ 현재 구현된 기능
- 메뉴 목록 조회 (DB + localStorage 폴백)
- 사용여부 토글 (체크박스)
- 설명 실시간 편집 (1초 디바운스)
- 자동 데이터 백업 (localStorage)
- 오류 처리 및 복구

### 🔄 동작 방식
1. **Supabase 연결 성공**: DB에서 데이터 로드
2. **Supabase 연결 실패**: localStorage에서 데이터 로드
3. **데이터가 없는 경우**: 기본 메뉴 구조 자동 생성

## 🐛 문제 해결

### 환경 변수 확인
```bash
# 브라우저 콘솔에서 확인 가능
console.log('Supabase URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
```

### 로그 확인
- 브라우저 개발자 도구 → Console 탭
- "Supabase 설정 상태" 로그 확인
- 오류 메시지 확인

### 일반적인 오류들
1. **환경 변수 미설정**: localStorage 자동 사용 (정상)
2. **테이블 없음**: 기본 데이터 자동 생성 (정상)
3. **권한 오류**: RLS 정책 확인 필요

## 💡 팁

- 개발 단계에서는 환경 변수 설정 없이 localStorage만 사용해도 충분
- 실제 배포 시에만 Supabase 설정을 고려
- 데이터 백업은 자동으로 localStorage에 저장됨

## 📞 지원

문제가 발생하면:
1. 브라우저 콘솔 로그 확인
2. localStorage 데이터 확인: `admin_systemsetting_menu` 키
3. 필요시 localStorage 삭제 후 새로고침으로 초기화