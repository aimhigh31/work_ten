# 보안교육관리 시스템 데이터 관계 및 구조 문서

## 📋 개요
보안교육관리 페이지의 데이터, 커리큘럼, 참석자 탭이 정상 작동하기까지 여러 문제를 해결했습니다. 동일한 문제가 재발하지 않도록 데이터 관계, 저장 방식, 주의사항을 정리합니다.

## 🗄️ 데이터베이스 구조

### 1. 메인 테이블: `security_education_data`
```sql
CREATE TABLE security_education_data (
  id INTEGER PRIMARY KEY,           -- 교육 고유 ID (순차 생성)
  no SERIAL,                       -- 테이블 표시용 순번 (자동 증가)
  education_name VARCHAR NOT NULL,  -- 교육명
  description TEXT,                -- 교육 설명
  education_type VARCHAR,          -- 교육 유형 (온라인/오프라인/혼합)
  assignee VARCHAR,               -- 담당자
  execution_date DATE,            -- 실행 날짜
  location VARCHAR,              -- 교육 장소
  status VARCHAR,               -- 상태 (대기/진행/완료/홀딩)
  participant_count INTEGER,    -- 참석자 수
  registration_date DATE,       -- 등록 날짜
  code VARCHAR,                -- 교육 코드

  -- 교육실적보고 관련 필드들 (2025-09-23 추가)
  achievements TEXT,           -- 성과
  improvement_points TEXT,     -- 개선사항 (DB 컬럼명)
  feedback TEXT,              -- 교육소감
  effectiveness_score INTEGER, -- 효과성 점수
  completion_rate NUMERIC,    -- 완료율
  satisfaction_score NUMERIC, -- 만족도 점수

  created_at TIMESTAMP,        -- 생성 시간
  updated_at TIMESTAMP,        -- 수정 시간
  created_by VARCHAR,         -- 생성자
  updated_by VARCHAR,        -- 수정자
  is_active BOOLEAN DEFAULT true,
  metadata JSONB              -- 추가 메타데이터 저장용
);
```

### 2. 커리큘럼 테이블: `security_education_curriculum`
```sql
CREATE TABLE security_education_curriculum (
  id SERIAL PRIMARY KEY,                    -- 커리큘럼 항목 ID
  education_id INTEGER NOT NULL,           -- 외래키: security_education_data.id
  session_order INTEGER NOT NULL,         -- 세션 순서
  session_title VARCHAR NOT NULL,         -- 세션 제목
  session_description TEXT,              -- 세션 설명
  duration_minutes INTEGER,             -- 소요 시간(분)
  instructor VARCHAR,                   -- 강사명
  session_type VARCHAR,                -- 세션 유형
  materials TEXT,                     -- 교육 자료
  objectives TEXT,                   -- 교육 목표
  created_at TIMESTAMP DEFAULT NOW(), -- 생성 시간
  updated_at TIMESTAMP DEFAULT NOW(), -- 수정 시간
  created_by VARCHAR DEFAULT 'user', -- 생성자
  updated_by VARCHAR DEFAULT 'user', -- 수정자
  is_active BOOLEAN DEFAULT true,    -- 활성 상태

  -- 외래키 제약 조건
  CONSTRAINT security_education_curriculum_education_id_fkey
    FOREIGN KEY (education_id) REFERENCES security_education_data(id)
);
```

### 3. 참석자 테이블: `security_education_attendee`
```sql
CREATE TABLE security_education_attendee (
  id SERIAL PRIMARY KEY,                    -- 참석자 항목 ID
  education_id INTEGER NOT NULL,           -- 외래키: security_education_data.id
  user_id INTEGER,                         -- 사용자 ID (옵셔널)
  user_name VARCHAR NOT NULL,              -- 사용자명
  user_code VARCHAR,                       -- 사용자 코드
  department VARCHAR,                      -- 부서
  position VARCHAR,                        -- 직책
  email VARCHAR,                           -- 이메일
  phone VARCHAR,                           -- 전화번호
  attendance_status VARCHAR DEFAULT '예정',-- 출석 상태 (예정/참석/불참)
  attendance_date TIMESTAMP,              -- 출석 시간
  completion_status VARCHAR DEFAULT '미완료', -- 완료 상태 (완료/미완료)
  score INTEGER,                           -- 점수
  certificate_issued BOOLEAN DEFAULT false, -- 수료증 발급 여부
  notes TEXT,                             -- 비고
  created_at TIMESTAMP DEFAULT NOW(),     -- 생성 시간
  updated_at TIMESTAMP DEFAULT NOW(),     -- 수정 시간
  created_by VARCHAR DEFAULT 'user',      -- 생성자
  updated_by VARCHAR DEFAULT 'user',      -- 수정자
  is_active BOOLEAN DEFAULT true,         -- 활성 상태

  -- 외래키 제약 조건
  CONSTRAINT security_education_attendee_education_id_fkey
    FOREIGN KEY (education_id) REFERENCES security_education_data(id)
);
```

## 🔗 데이터 관계

### 1:N 관계
- **1개 교육** : **N개 커리큘럼 세션**
- **1개 교육** : **N개 참석자**
- `security_education_data.id` ← `security_education_curriculum.education_id`
- `security_education_data.id` ← `security_education_attendee.education_id`

### 관계 특징
- **부모 테이블**: `security_education_data` (교육 기본 정보)
- **자식 테이블**:
  - `security_education_curriculum` (교육 상세 커리큘럼)
  - `security_education_attendee` (교육 참석자 정보)
- **외래키 제약**: 커리큘럼과 참석자는 반드시 유효한 교육 ID를 참조해야 함

## 💾 저장 방식 및 프로세스

### 1. 신규 교육 생성 프로세스 (mode === 'add')
```typescript
// 1단계: 교육 기본 정보 저장
const educationData = {
  id: generateNextId(),  // 순차 ID 생성
  education_name: "보안 교육명",
  // 교육실적보고 데이터 포함
  achievements: educationReport.achievements,
  improvement_points: educationReport.improvements,
  feedback: educationReport.feedback,
  // ... 기타 필드
};

// 2단계: Supabase에 교육 데이터 저장
const { data: savedEducation } = await supabase
  .from('security_education_data')
  .insert(educationData)
  .select()
  .single();

// 3단계: 커리큘럼 데이터 저장 (외래키 연결) - 조건: currentCurriculumData.length > 0
if (currentCurriculumData.length > 0) {
  const curriculumDataToSave = currentCurriculumData.map((item, index) => ({
    education_id: savedEducation.id,  // 중요: 저장된 교육 ID 사용
    session_order: item.session_order || (index + 1),
    session_title: item.session_title,
    session_description: item.session_description,
    duration_minutes: item.duration_minutes || 0,
    instructor: item.instructor,
    session_type: item.session_type || '강의',
    materials: item.materials,
    objectives: item.objectives,
    is_active: true,
    created_by: 'user',
    updated_by: 'user'
  }));

  await supabase
    .from('security_education_curriculum')
    .insert(curriculumDataToSave);
}

// 4단계: 참석자 데이터 저장 (외래키 연결) - 조건: currentParticipantData.length > 0
if (currentParticipantData.length > 0) {
  const attendeeDataToSave = currentParticipantData.map((item, index) => ({
    education_id: savedEducation.id,  // 중요: 저장된 교육 ID 사용
    user_name: item.user_name,
    position: item.position,
    department: item.department,
    attendance_status: item.attendance_status || '예정',
    notes: item.notes,
    is_active: true,
    created_by: 'user',
    updated_by: 'user'
  }));

  await supabase
    .from('security_education_attendee')
    .insert(attendeeDataToSave);
}
```

### 2. 기존 교육 수정 프로세스 (mode === 'edit')
```typescript
// 1단계: 교육 기본 정보 수정 (교육실적보고 포함)
const educationData = {
  education_name: updatedTask.title,
  description: updatedTask.description,
  // 교육실적보고 데이터 포함 - 중요: convertRecordToTableData에서 매핑 필요
  achievements: updatedRecord.achievements || '',
  improvement_points: updatedRecord.improvements || '',
  feedback: updatedRecord.feedback || '',
  // ... 기타 필드
};

await supabase
  .from('security_education_data')
  .update(educationData)
  .eq('id', educationId);

// 2단계: 커리큘럼 데이터 수정 - 기존 데이터 삭제 후 재저장
if (currentCurriculumData.length > 0) {
  // 기존 커리큘럼 데이터 삭제
  await supabase
    .from('security_education_curriculum')
    .delete()
    .eq('education_id', educationId);

  // 새 커리큘럼 데이터 저장
  const curriculumDataToSave = currentCurriculumData.map((item, index) => ({
    education_id: educationId,  // 기존 교육 ID 사용
    session_order: item.session_order || (index + 1),
    session_title: item.session_title,
    // ... 기타 필드
  }));

  await supabase
    .from('security_education_curriculum')
    .insert(curriculumDataToSave);
}

// 3단계: 참석자 데이터 수정 - 기존 데이터 삭제 후 재저장
if (currentParticipantData.length > 0) {
  // 기존 참석자 데이터 삭제
  await supabase
    .from('security_education_attendee')
    .delete()
    .eq('education_id', educationId);

  // 새 참석자 데이터 저장
  const attendeeDataToSave = currentParticipantData.map((item, index) => ({
    education_id: educationId,  // 기존 교육 ID 사용
    user_name: item.user_name,
    // ... 기타 필드
  }));

  await supabase
    .from('security_education_attendee')
    .insert(attendeeDataToSave);
}
```

### 3. 교육실적보고 임시 저장 방식
```typescript
// 실시간 입력 → 임시 저장 (sessionStorage)
const handleEducationReportChange = useCallback((field: keyof EducationReport, value: string) => {
  // 로컬 상태 업데이트
  const updatedReport = { ...educationReport, [field]: value };
  setEducationReport(updatedReport);

  // 임시 저장
  if (data?.id) {
    const tempKey = `education_report_temp_${data.id}`;
    sessionStorage.setItem(tempKey, JSON.stringify(updatedReport));
  }
}, [educationReport, data?.id]);

// 저장 버튼 클릭 시 → DB 저장
const handleSave = () => {
  const educationData = {
    // 교육실적보고 데이터 포함
    achievements: educationReport.achievements,
    improvement_points: educationReport.improvements,
    feedback: educationReport.feedback,
    // ... 기타 필드
  };

  // DB 저장 후 임시 데이터 삭제
  onSave(educationData);
  sessionStorage.removeItem(`education_report_temp_${data.id}`);
};
```

## ⚠️ 주요 주의사항

### 1. 데이터 변환 함수의 필드 누락 문제 ⭐⭐⭐
- **문제**: `convertRecordToTableData` 함수에서 교육실적보고 필드 누락
- **증상**:
  ```
  🔵 Supabase 저장 데이터: { achievements: "", feedback: "", improvement_points: "" }
  ```
- **원인**: `SecurityEducationRecord` → `SecurityEducationTableData` 변환 시 필드 매핑 누락
- **해결**:
```typescript
const convertRecordToTableData = (record: SecurityEducationRecord): SecurityEducationTableData => {
  return {
    // 기존 필드들...
    id: record.id,
    educationName: record.educationName,
    // ...

    // ⭐ 교육실적보고 필드 매핑 필수 추가
    achievements: record.achievements,
    improvements: record.improvement_points,  // DB 필드명 → 프론트 필드명
    feedback: record.feedback,
  };
};
```
- **체크포인트**: 새로운 필드 추가 시 데이터 변환 함수에도 반드시 추가

### 2. 편집 모드 저장 조건 문제 ⭐⭐
- **문제**: `mode === 'add'` 조건으로 편집 모드에서 커리큘럼/참석자 저장 안됨
- **해결**: 조건을 데이터 존재 여부로 변경
```typescript
// ❌ 잘못된 조건
if (mode === 'add' && currentCurriculumData.length > 0) {

// ✅ 올바른 조건
if (currentCurriculumData.length > 0) {
  if (mode === 'edit') {
    // 기존 데이터 삭제 후 재저장
    await supabase.from('table').delete().eq('education_id', educationId);
  }
  // 새 데이터 저장
  await supabase.from('table').insert(newData);
}
```

### 3. 교육실적보고 저장 방식 변경 ⭐
- **기존**: 실시간 DB 저장 (디바운싱)
- **변경**: 임시 저장 → 저장 버튼 시 DB 저장
- **임시 저장**: `sessionStorage`에 `education_report_temp_{educationId}` 키로 저장
- **최종 저장**: `handleSave`에서 DB 저장 후 임시 데이터 삭제

### 4. ID 생성 관련
- **문제**: `Date.now()` 사용 시 PostgreSQL 정수 범위 초과
  - 예시 에러: `"value \"1758595822674\" is out of range for type integer"`
- **해결**: `useIdGenerator` 훅의 `generateNextId()` 사용
- **범위**: 156675부터 순차 증가 (PostgreSQL integer 범위 내)
- **절대 금지**: `Date.now()`, `new Date().getTime()` 직접 사용

### 2. 외래키 제약 조건
- **문제**: 커리큘럼 저장 시 존재하지 않는 education_id 참조
- **해결**: 반드시 교육 데이터 저장 후 반환된 실제 ID 사용
- **순서**: 교육 저장 → ID 확인 → 커리큘럼 저장

### 3. 타입 일치 문제
- **문제**: education_id가 string/number 혼재
- **해결**: 비교 시 타입 통일
```typescript
const itemEducationId = typeof item.education_id === 'string'
  ? parseInt(item.education_id) : item.education_id;
const targetEducationId = typeof educationId === 'string'
  ? parseInt(educationId as string) : educationId;
```

### 4. 클로저 문제
- **문제**: `getCurrentCurriculumData` 함수가 오래된 상태 참조
- **해결**: `useRef`로 최신 상태 참조
```typescript
const curriculumItemsRef = useRef<SecurityCurriculumItem[]>([]);
// getCurrentCurriculumData에서 curriculumItemsRef.current 사용
```

### 5. 임시 데이터 저장 (체크리스트 방식)
- **add 모드**: 로컬 상태에만 저장, 저장 버튼 클릭 시 DB 저장
- **edit 모드**: 실시간 DB 연동
- **텍스트 입력**: `handleLocalEditItem` 사용 (DB 저장 X)
- **최종 저장**: `handleSave`에서 일괄 DB 저장

## 🛠️ 핵심 기술 구조

### 1. 데이터 흐름
```
사용자 입력 → 로컬 상태 → 임시 저장 → 최종 DB 저장
     ↓           ↓           ↓           ↓
  TextField → curriculumItems → useRef → Supabase
```

### 2. 컴포넌트 구조
```
SecurityEducationEditDialog
├── DataTab (교육 기본 정보)
├── CurriculumTab (커리큘럼 관리)
│   ├── mode: 'add' | 'edit'
│   ├── educationId: number
│   └── curriculumItems: SecurityCurriculumItem[]
├── ParticipantsTab (참석자 관리)
│   ├── mode: 'add' | 'edit'
│   ├── educationId: number
│   └── participantItems: SecurityAttendeeItem[]
├── ReportsTab
├── RecordTab
└── MaterialTab
```

### 3. 상태 관리
```typescript
// 메인 교육 상태
const [educationState, setEducationState] = useState<EducationState>();

// 커리큘럼 상태 (CurriculumTab 내부)
const [curriculumItems, setCurriculumItems] = useState<SecurityCurriculumItem[]>([]);
const curriculumItemsRef = useRef<SecurityCurriculumItem[]>([]);

// 참석자 상태 (ParticipantsTab 내부)
const [participantItems, setParticipantItems] = useState<SecurityAttendeeItem[]>([]);
const participantItemsRef = useRef<SecurityAttendeeItem[]>([]);

// 외부 노출 함수 (체크리스트 방식)
(window as any).getCurrentCurriculumData = () => curriculumItemsRef.current;
(window as any).getCurrentParticipantData = () => participantItemsRef.current;
```

## 🚨 앞으로 오류 방지 방법

### 1. ID 생성 시
- **절대 사용 금지**: `Date.now()`, `new Date().getTime()`
  - 참석자탭 예시 오류: `"value \"1758595822674\" is out of range for type integer"`
- **권장 사용**: `useIdGenerator` 훅의 `generateNextId()`
- **범위 확인**: PostgreSQL integer 범위 (-2,147,483,648 ~ 2,147,483,647)
- **정리 방법**: 잘못된 ID 발견 시 `cleanup-invalid-attendee-ids.js` 스크립트 사용

### 2. 외래키 관계 설정 시
```typescript
// ✅ 올바른 방법
const savedEducation = await createEducation(educationData);
const curriculumData = items.map(item => ({
  ...item,
  education_id: savedEducation.id  // 실제 저장된 ID 사용
}));

// ❌ 잘못된 방법
const curriculumData = items.map(item => ({
  ...item,
  education_id: Date.now()  // 존재하지 않는 ID
}));
```

### 3. API vs Supabase 직접 연결
- **문제 원인**: 존재하지 않는 API 엔드포인트 호출
- **해결책**: Supabase 직접 연결 사용
- **패턴**:
```typescript
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const { createClient } = await import('@supabase/supabase-js');
const supabase = createClient(supabaseUrl, supabaseKey);
```

### 4. 타입 안전성 확보
```typescript
// 인터페이스 정의 시 일관성 유지
export interface SecurityEducationRecord {
  id: number;
  no?: number;  // 옵셔널 필드는 명확히 표시
  // ...
}

// 타입 변환 시 안전장치
const numericId = typeof id === 'string' ? parseInt(id) : id;
```

### 5. 상태 관리 패턴
```typescript
// ✅ useRef로 최신 상태 보장
const dataRef = useRef(data);
useEffect(() => {
  dataRef.current = data;
}, [data]);

// ✅ 의존성 배열에서 불필요한 의존성 제거
useEffect(() => {
  // 클로저 문제 방지
}, [mode]); // data는 제외
```

## 📈 성능 최적화

### 1. 데이터 로딩
- **정렬**: `order('no', { ascending: true })` 사용
- **필터링**: 필요한 컬럼만 select
- **페이지네이션**: 대량 데이터 시 limit/offset 사용

### 2. 리렌더링 최적화
- **memo**: 컴포넌트 메모이제이션
- **useCallback**: 함수 메모이제이션
- **useMemo**: 계산 결과 메모이제이션

## 🔧 디버깅 팁

### 1. 로그 활용
```typescript
console.log('🔍 교육 ID:', educationId);
console.log('📦 커리큘럼 데이터:', curriculumItems);
console.log('✅ 저장 성공:', result);
console.log('❌ 에러:', error);
```

### 2. 단계별 확인
1. 교육 데이터 저장 확인
2. 반환된 ID 확인
3. 커리큘럼 데이터 매핑 확인
4. 외래키 제약 조건 확인

## 📝 체크리스트

새로운 관련 기능 개발 시 확인사항:

### 🔄 데이터 변환 관련
- [ ] **데이터 변환 함수**에 새 필드가 매핑되었는가? (`convertRecordToTableData`)
- [ ] **타입 정의**가 실제 DB 스키마와 일치하는가?
- [ ] **필드명 매핑**이 올바른가? (DB: `improvement_points` ↔ 프론트: `improvements`)

### 💾 저장 로직 관련
- [ ] **편집 모드 저장** 조건이 `currentData.length > 0`인가? (`mode === 'add'` 금지)
- [ ] **편집 모드**에서 기존 데이터 삭제 로직이 있는가?
- [ ] **임시 저장**과 **최종 DB 저장**이 구분되어 있는가?
- [ ] **sessionStorage** 정리 로직이 있는가?

### 🗄️ 데이터베이스 관련
- [ ] **ID 생성** 방식이 PostgreSQL 범위 내인가? (`generateNextId()` 사용)
- [ ] **외래키 관계**가 올바르게 설정되었는가?
- [ ] **DB 스키마**와 타입 정의가 일치하는가?

### 🔧 기술적 안전성
- [ ] **타입 일치성**이 보장되는가?
- [ ] **클로저 문제**가 없는가? (`useRef` 사용)
- [ ] **API 대신 Supabase 직접 연결**을 사용하는가?
- [ ] **에러 처리**가 적절한가?

### 🎯 사용자 경험
- [ ] **데이터 로드** 시 임시 저장 데이터 우선 복원되는가?
- [ ] **저장 성공** 시 임시 데이터가 삭제되는가?
- [ ] **팝업 닫기** 시 불필요한 임시 데이터가 정리되는가?

## 🎯 결론

이 문서의 패턴을 따르면 비슷한 데이터 관계를 가진 기능을 개발할 때 동일한 문제를 피할 수 있습니다.

### 🔥 가장 중요한 3가지 주의사항:
1. **데이터 변환 함수**에서 새 필드 누락 방지 (`convertRecordToTableData`)
2. **편집 모드 저장** 조건을 `currentData.length > 0`으로 설정
3. **교육실적보고** 임시 저장 → 저장 버튼 시 DB 저장 방식

### 📋 오류 예방 핵심 원칙:
- **DB 스키마 ↔ 타입 정의 ↔ 데이터 변환 함수** 일치성 확보
- **편집 모드**에서 기존 데이터 삭제 후 재저장 패턴
- **외래키 제약 조건**과 **ID 생성 방식** 안전성

이 문서를 참고하여 동일한 구조의 데이터 관계를 구현할 때 **체크리스트**를 활용하면 오류를 크게 줄일 수 있습니다. 🎯