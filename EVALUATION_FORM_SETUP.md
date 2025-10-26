# 인사평가 공개 폼 시스템 설정 가이드

## 개요
인사평가를 구글 설문조사처럼 공개 URL로 제공하여, 시스템 로그인 없이도 평가를 작성하고 제출할 수 있는 시스템입니다.

## 생성된 파일

### 1. 컴포넌트
- `src/components/PublicEvaluationForm.tsx` - 공개 평가 폼 컴포넌트

### 2. 페이지
- `src/app/evaluation-form/[id]/page.tsx` - 공개 평가 작성 페이지 (인증 불필요)
- `src/app/evaluation-complete/page.tsx` - 평가 제출 완료 페이지

### 3. API
- `src/app/api/evaluation-submit/route.ts` - 평가 제출 API 엔드포인트

## Supabase 테이블 생성

다음 SQL을 Supabase SQL Editor에서 실행하세요:

```sql
-- 1. 평가 제출 메인 테이블
CREATE TABLE IF NOT EXISTS hr_evaluation_submissions (
  id SERIAL PRIMARY KEY,
  evaluation_id TEXT,
  target_person TEXT NOT NULL,
  department TEXT NOT NULL,
  position TEXT NOT NULL,
  evaluator TEXT NOT NULL,
  submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  total_recommended_score INTEGER DEFAULT 0,
  total_actual_score INTEGER DEFAULT 0,
  total_difference_score INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 평가 상세 항목 테이블
CREATE TABLE IF NOT EXISTS hr_evaluation_submission_items (
  id SERIAL PRIMARY KEY,
  submission_id INTEGER REFERENCES hr_evaluation_submissions(id) ON DELETE CASCADE,
  item_id INTEGER NOT NULL,
  item_name TEXT NOT NULL,
  checked_behaviors BOOLEAN[] DEFAULT ARRAY[false, false, false],
  recommended_score INTEGER DEFAULT 0,
  actual_score INTEGER DEFAULT 0,
  difference_score INTEGER DEFAULT 0,
  difference_reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. 인덱스 생성
CREATE INDEX idx_evaluation_submissions_evaluation_id ON hr_evaluation_submissions(evaluation_id);
CREATE INDEX idx_evaluation_submission_items_submission_id ON hr_evaluation_submission_items(submission_id);

-- 4. RLS (Row Level Security) 설정
ALTER TABLE hr_evaluation_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE hr_evaluation_submission_items ENABLE ROW LEVEL SECURITY;

-- 5. 공개 접근 정책 (누구나 INSERT 가능)
CREATE POLICY "Anyone can submit evaluations" ON hr_evaluation_submissions
  FOR INSERT TO anon
  WITH CHECK (true);

CREATE POLICY "Anyone can submit evaluation items" ON hr_evaluation_submission_items
  FOR INSERT TO anon
  WITH CHECK (true);

-- 6. 인증된 사용자는 모든 데이터 조회 가능
CREATE POLICY "Authenticated users can view all submissions" ON hr_evaluation_submissions
  FOR SELECT TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can view all submission items" ON hr_evaluation_submission_items
  FOR SELECT TO authenticated
  USING (true);
```

## 사용 방법

### 1. 공개 URL 생성
평가 ID를 포함한 URL을 생성하여 평가 대상자에게 전달:
```
http://localhost:3200/evaluation-form/[평가ID]
```

예시:
```
http://localhost:3200/evaluation-form/2025-team-leader-001
http://localhost:3200/evaluation-form/annual-review-2025
```

### 2. 평가 작성 프로세스
1. 평가 대상자가 URL 접속 (로그인 불필요)
2. 기본 정보 입력:
   - 피평가자
   - 부서
   - 직위
   - 평가자
3. 13개 평가 항목별 작성:
   - 행동지표 3개 체크 (권장점수 자동 계산)
   - 실제점수 입력 (1~5점)
   - 차이점수 자동 계산
   - 차이 사유 입력 (차이점수 절대값 ≥ 1일 때 필수)
4. 제출 버튼 클릭
5. 완료 페이지로 이동

### 3. 평가 데이터 조회
평가탭에서 제출된 데이터를 조회하려면:

```typescript
// 제출된 평가 목록 조회
const { data: submissions } = await supabase
  .from('hr_evaluation_submissions')
  .select(`
    *,
    hr_evaluation_submission_items (*)
  `)
  .order('submitted_at', { ascending: false });
```

## 권장점수 계산 규칙
- 체크박스 1개 선택 → 권장점수 1점
- 체크박스 2개 선택 → 권장점수 3점
- 체크박스 3개 선택 → 권장점수 5점

## 차이점수 계산
```
차이점수 = 실제점수 - 권장점수
```
- 양수 (+): 권장보다 높게 평가 (파란색 표시)
- 음수 (-): 권장보다 낮게 평가 (빨간색 표시)
- 0: 권장과 동일

## 유효성 검사
1. **기본 정보 필수**: 피평가자, 부서, 직위, 평가자 모두 입력
2. **차이 사유 필수**: 차이점수 절대값이 1 이상일 때 차이 사유 50자 이내 입력
3. 제출 시 누락된 항목이 있으면 알림으로 안내

## 다음 단계
1. Supabase SQL 실행 (위의 SQL 코드)
2. 평가탭에서 제출된 데이터 표시 기능 추가
3. 평가 ID 생성 및 URL 공유 기능 추가
4. 이메일/SMS로 평가 URL 자동 발송 기능 (선택사항)

## 보안 고려사항
- 평가 ID는 추측하기 어려운 고유값 사용 권장 (UUID 등)
- RLS 정책으로 공개 제출은 허용하되, 조회는 인증된 사용자만 가능
- 제출 후 수정 불가 (필요시 별도 UPDATE 정책 추가)
