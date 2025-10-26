# 공개 평가 폼 제출 및 인사평가관리 체크리스트 개선 (2025-10-23)

## 📌 문제 상황

### 1. 공개 평가 폼 제출 오류

**증상**:
```json
{
  "error": "평가 저장 중 오류가 발생했습니다.",
  "details": "new row violates row-level security policy for table \"hr_evaluation_submissions\"",
  "code": "42501"
}
```

**원인**:
- API route에서 서버 클라이언트(`@/lib/supabase/server`)를 사용
- 쿠키 기반 인증으로 로그인하지 않은 익명 사용자는 RLS 정책 통과 불가
- 공개 폼이므로 인증 없이 접근 가능해야 함

### 2. EvaluationEditDialog 컴포넌트 오류

**증상**:
```
ReferenceError: handleCloseDetail is not defined
ReferenceError: selectedItem is not defined
```

**원인**:
- 평가 제출 다이얼로그에서 필요한 함수와 state가 누락됨
- 제출된 평가 상세보기 기능 미구현

### 3. 인사평가관리 체크리스트 탭 미구현

**문제점**:
- 체크리스트 탭이 비어있음
- 테이블 스크롤 기능 없음
- 헤더 고정 안됨

## 🔧 해결 방법

### 1. 공개 평가 폼 제출 오류 해결

#### Step 1: API에서 anon 클라이언트 사용

**수정 파일**: `src/app/api/evaluation-submit/route.ts`

```typescript
// 수정 전
import { createClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  const supabase = await createClient(); // 서버 클라이언트 (인증 필요)

// 수정 후
import { createClient } from '@supabase/supabase-js';

export async function POST(request: NextRequest) {
  // 공개 폼을 위한 anon 클라이언트 생성
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
```

**핵심 변경**:
- ❌ `@/lib/supabase/server` (쿠키 기반 인증)
- ✅ `@supabase/supabase-js` (명시적 anon key)

#### Step 2: RLS 정책 수정

**실행 SQL**: `fix-evaluation-rls-policy.sql`

```sql
-- 기존 정책 삭제
DROP POLICY IF EXISTS "Anyone can submit evaluations" ON hr_evaluation_submissions;
DROP POLICY IF EXISTS "Anyone can submit evaluation items" ON hr_evaluation_submission_items;

-- 익명 사용자도 INSERT 가능한 정책 생성
CREATE POLICY "Enable insert for anon users"
ON hr_evaluation_submissions
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

CREATE POLICY "Enable insert for anon users on items"
ON hr_evaluation_submission_items
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- 인증된 사용자는 모든 데이터 조회 가능
CREATE POLICY "Enable read access for authenticated users"
ON hr_evaluation_submissions
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Enable read access for authenticated users on items"
ON hr_evaluation_submission_items
FOR SELECT
TO authenticated
USING (true);
```

**핵심 포인트**:
- `TO anon, authenticated`: 익명 사용자와 인증 사용자 모두 INSERT 가능
- `FOR SELECT TO authenticated`: 조회는 인증 사용자만 가능

### 2. EvaluationEditDialog 함수 추가

**수정 파일**: `src/components/EvaluationEditDialog.tsx`

#### Step 1: state 추가

```typescript
const [selectedItem, setSelectedItem] = useState<any>(null);
```

#### Step 2: 다이얼로그 닫기 함수 추가

```typescript
// 상세보기 다이얼로그 닫기
const handleCloseDetail = () => {
  setDetailDialogOpen(false);
  setSelectedSubmissionId(null);
  setSelectedItem(null);
};
```

#### Step 3: 제출 데이터 로드 시 selectedItem 설정

```typescript
useEffect(() => {
  const loadSubmissionData = async () => {
    if (selectedSubmissionId && detailDialogOpen) {
      const submissionWithItems = await fetchSubmissionWithItems(selectedSubmissionId);
      if (submissionWithItems && submissionWithItems.items) {
        // selectedItem에 전체 데이터 저장
        setSelectedItem({
          targetPerson: submissionWithItems.target_person,
          department: submissionWithItems.department,
          position: submissionWithItems.position,
          evaluator: submissionWithItems.evaluator
        });
        // ... 나머지 로직
      }
    }
  };
  loadSubmissionData();
}, [selectedSubmissionId, detailDialogOpen]);
```

### 3. 인사평가관리 체크리스트 탭 구현

**수정 파일**: `src/components/EvaluationEditDialog.tsx`

#### Step 1: 탭 추가

```typescript
<Tabs value={activeTab} onChange={handleTabChange}>
  <Tab label="개요" />
  <Tab label="체크리스트" />  {/* 추가 */}
  <Tab label="평가" />
  <Tab label="평가성과보고" />
  <Tab label="기록" />
  <Tab label="자료" />
</Tabs>
```

#### Step 2: 보안점검관리 점검 탭 복사

**원본**: `src/components/InspectionEditDialog.tsx` (case 1: 점검 탭)

**주요 기능**:
- 체크리스트 선택 드롭다운
- 평가 유형 선택 (3단계/5단계)
- 점검 통계 정보 (항목 수, 총점, 평가별 건수)
- 점검 항목 테이블 (대분류, 소분류, 평가내용, 평가, 점수)

#### Step 3: 테이블 스크롤 및 헤더 고정

```typescript
{checklistItems.length > 0 && (
  <TableContainer
    sx={{
      border: 'none',
      boxShadow: 'none',
      maxHeight: 'calc(100vh - 340px)',  // 테이블 높이
      overflowY: 'auto',                  // 세로 스크롤
      overflowX: 'auto',                  // 가로 스크롤
      position: 'relative',
      mb: 4,                              // 하단 여백
    }}
  >
    <Table size="small" stickyHeader>
      <TableHead>
        <TableRow>
          <TableCell
            sx={{
              fontWeight: 600,
              bgcolor: '#fafafa !important',
              position: 'sticky !important',
              top: 0,
              zIndex: 100,
              borderBottom: '2px solid #e0e0e0'
            }}
          >
            NO
          </TableCell>
          {/* 모든 헤더 셀에 동일 적용 */}
        </TableRow>
      </TableHead>
```

**핵심 스타일**:
- `maxHeight: calc(100vh - 340px)`: 뷰포트 높이의 대부분 사용
- `overflowY: auto`: 내용이 넘치면 스크롤
- `position: sticky !important`: 강제 고정
- `zIndex: 100`: 다른 요소 위에 표시
- `borderBottom`: 헤더와 바디 구분

#### Step 4: 첨부 컬럼 제거

```typescript
// 수정 전: 8개 컬럼
NO | 대분류 | 소분류 | 점검항목 | 평가내용 | 평가 | 점수 | 첨부

// 수정 후: 7개 컬럼 (첨부 제거)
NO | 대분류 | 소분류 | 점검항목 | 평가내용 | 평가 | 점수
```

## 📊 Before / After 비교

### 공개 평가 폼

| 항목 | Before | After |
|------|--------|-------|
| 제출 기능 | ❌ RLS 정책 위반 | ✅ 정상 제출 |
| 클라이언트 | 서버 클라이언트 (쿠키) | anon 클라이언트 |
| 익명 접근 | ❌ 불가능 | ✅ 가능 |
| 완료 페이지 | ❌ 없음 | ✅ 구현됨 |

### EvaluationEditDialog

| 항목 | Before | After |
|------|--------|-------|
| handleCloseDetail | ❌ 미정의 | ✅ 구현됨 |
| selectedItem | ❌ 미정의 | ✅ 구현됨 |
| 상세보기 | ❌ 오류 발생 | ✅ 정상 작동 |

### 체크리스트 탭

| 항목 | Before | After |
|------|--------|-------|
| 체크리스트 선택 | ❌ 없음 | ✅ 드롭다운 |
| 통계 정보 | ❌ 없음 | ✅ 표시됨 |
| 테이블 | ❌ 없음 | ✅ 완전 구현 |
| 스크롤 | ❌ 없음 | ✅ 상하 스크롤 |
| 헤더 고정 | ❌ 없음 | ✅ sticky header |
| 첨부 컬럼 | - | ✅ 제거됨 |

## 🚀 성공 확인

### 1. 공개 평가 폼 제출 테스트

```
✅ 평가 정보 입력:
   - 평가 코드: test-2025-01
   - 피평가자: 홍길동
   - 부서: 개발팀
   - 평가자: 김철수

✅ 13개 평가 항목 작성:
   - 책임감: 행동지표 3개 선택 → 권장점수 3점
   - 전문성: 행동지표 2개 선택 → 권장점수 2점
   - ... (총 13개 항목)

✅ 제출 성공:
   - API 응답: 200 OK
   - DB 저장: hr_evaluation_submissions (1건)
   - DB 저장: hr_evaluation_submission_items (13건)
   - 완료 페이지 표시

✅ 완료 페이지:
   - 체크마크 아이콘
   - 제출 정보 요약 (평가 코드, 피평가자, 부서, 평가자, 제출일시)
   - "새 평가 작성" 버튼 → 폼 초기화
   - "닫기" 버튼 → 창 닫기
```

### 2. 인사평가관리 체크리스트 탭 테스트

```
✅ 체크리스트 선택:
   - 드롭다운에서 "ADMIN-CHECK-25-002 | GROUP006-SUB001 | 삼성전자 본안 | 삼성전자 보안" 선택
   - 12개 항목 로드됨

✅ 통계 정보 표시:
   - 점검항목: 0 / 12
   - 총점수: 0 / 36점 (3단계 기준)
   - 평가: 미평가 12건

✅ 테이블 스크롤:
   - 항목 4~5개 보임
   - 스크롤 시 헤더 고정 유지
   - 1~12번 모두 스크롤로 확인 가능

✅ 평가 작성:
   - 평가내용 텍스트 입력
   - 평가 드롭다운 선택 (미흡/보통/우수)
   - 점수 자동 계산 (1~3점)
```

## 💡 핵심 교훈

### 1. 공개 폼에서 Supabase 사용 시

**DO ✅**:
```typescript
// anon 클라이언트 명시적 생성
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
```

**DON'T ❌**:
```typescript
// 서버 클라이언트 사용 (쿠키 기반 인증)
const supabase = await createClient();
```

### 2. RLS 정책 설정

**공개 접근이 필요한 경우**:
```sql
-- INSERT: 익명 사용자 허용
TO anon, authenticated
WITH CHECK (true)

-- SELECT: 인증 사용자만 허용
TO authenticated
USING (true)
```

### 3. 테이블 헤더 고정

**완벽한 sticky header**:
```typescript
sx={{
  bgcolor: '#fafafa !important',      // !important로 강제
  position: 'sticky !important',      // !important로 강제
  top: 0,
  zIndex: 100,                        // 높은 z-index
  borderBottom: '2px solid #e0e0e0'   // 구분선
}}
```

## 📝 관련 파일

### 수정된 파일

1. **`src/app/api/evaluation-submit/route.ts`**
   - 서버 클라이언트 → anon 클라이언트 변경
   - 에러 로깅 강화

2. **`src/components/EvaluationEditDialog.tsx`**
   - selectedItem state 추가
   - handleCloseDetail 함수 추가
   - 체크리스트 탭 구현 (보안점검관리에서 복사)
   - 테이블 스크롤 및 헤더 고정
   - 첨부 컬럼 제거

3. **`src/components/PublicEvaluationForm.tsx`**
   - 4단계 프로세스 구현 (평가안내 → 평가개요 → 체크시트 → 완료)
   - Stepper 크기 증가
   - 완료 페이지 구현
   - 에러 로깅 강화

4. **`src/app/evaluation-form/[id]/page.tsx`**
   - Next.js 15 params 경고 해결 (async/await)

### 생성된 파일

1. **`fix-evaluation-rls-policy.sql`**
   - RLS 정책 수정 SQL
   - anon 사용자 INSERT 허용

2. **`create-evaluation-tables.sql`**
   - 평가 테이블 생성 SQL (참고용)

## 🎉 결론

**3가지 주요 문제**를 성공적으로 해결:

1. ✅ **공개 평가 폼 제출 오류**
   - RLS 정책 위반 → anon 클라이언트 + RLS 정책 수정
   - 완료 페이지 구현 (4단계 프로세스)

2. ✅ **EvaluationEditDialog 오류**
   - 미정의 함수 → handleCloseDetail, selectedItem 추가
   - 제출된 평가 상세보기 정상 작동

3. ✅ **체크리스트 탭 구현**
   - 보안점검관리 점검 탭 복사
   - 테이블 스크롤 및 헤더 고정
   - 첨부 컬럼 제거

**핵심 원칙**:
- 🔑 공개 접근 API는 **anon 클라이언트** 사용
- 🔐 RLS 정책을 **명확하게 정의** (anon vs authenticated)
- 📋 테이블 헤더 고정은 **!important + 높은 z-index**
- 📏 스크롤 영역은 **명확한 maxHeight** 설정

---

**공개 평가 폼 및 인사평가관리 체크리스트 완벽 구현! 🎉**
