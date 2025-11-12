# 📋 토스트 알림 표준 패턴 (다른 페이지 적용용)

## 1️⃣ 기본 설정

### **Step 1: Import 추가**
```typescript
import { Snackbar, Alert } from '@mui/material';
```

### **Step 2: State 선언**
```typescript
// 알림 상태
const [snackbar, setSnackbar] = useState({
  open: false,
  message: '',
  severity: 'success' as 'success' | 'error' | 'warning' | 'info'
});
```

### **Step 3: Snackbar 컴포넌트 (페이지 하단)**
```typescript
{/* 알림 Snackbar */}
<Snackbar
  open={snackbar.open}
  autoHideDuration={6000}
  onClose={() => setSnackbar({ ...snackbar, open: false })}
  anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
>
  <Alert
    onClose={() => setSnackbar({ ...snackbar, open: false })}
    severity={snackbar.severity}
    sx={{ width: '100%' }}
  >
    {snackbar.message}
  </Alert>
</Snackbar>
```

**디자인 특징:**
- 위치: **우측 하단** (`vertical: 'bottom', horizontal: 'right'`)
- 지속시간: **6초** (`autoHideDuration: 6000`)
- 자동 닫힘 + 수동 닫기 버튼 모두 지원

---

## 2️⃣ 추가(Create) 토스트

### **패턴:**
```typescript
// 새 데이터 추가
setSnackbar({
  open: true,
  message: `${데이터제목}이 성공적으로 추가되었습니다.`,
  severity: 'success'
});
```

### **실제 예시:**
```typescript
// 인사평가관리
setSnackbar({
  open: true,
  message: `${updatedInspection.evaluationTitle}이 성공적으로 추가되었습니다.`,
  severity: 'success'
});

// 보안교육관리
setSnackbar({
  open: true,
  message: `${updatedTask.educationName}이 성공적으로 추가되었습니다.`,
  severity: 'success'
});
```

**적용 체크리스트:**
- ✅ severity: **'success'** (초록색)
- ✅ 메시지 형식: `제목 + 이 + 성공적으로 추가되었습니다`
- ✅ 조사: 항상 **"이"** 사용 (간단 버전)

---

## 3️⃣ 수정(Update) 토스트

### **패턴 A: 필드 변경 감지**

**Step 1: FieldMap 정의**
```typescript
const fieldMap: { [key: string]: string } = {
  // 영문필드명: '한글필드명',
  evaluationTitle: '평가제목',
  evaluationType: '평가유형',
  managementCategory: '관리분류',
  status: '상태',
  team: '팀',
  assignee: '담당자',
  // ... 페이지별 필드 추가
};
```

**Step 2: 변경된 필드 찾기**
```typescript
const changedFields: string[] = [];

// 원본 데이터 찾기 (inspections 배열에서)
const originalData = inspections.find((item) =>
  item.id === updatedInspection.id
);

if (originalData) {
  Object.keys(fieldMap).forEach((key) => {
    const oldValue = (originalData as any)[key];
    const newValue = (updatedInspection as any)[key];

    if (oldValue !== newValue && !changedFields.includes(fieldMap[key])) {
      changedFields.push(fieldMap[key]);
    }
  });
}
```

**Step 3: 토스트 메시지 생성**
```typescript
let message = '';
if (changedFields.length > 0) {
  const fieldsText = changedFields.join(', ');
  // 간단 버전: 필드가 1개면 "이", 2개 이상이면 "가"
  message = `${데이터제목}의 ${fieldsText}${changedFields.length === 1 ? '이' : '가'} 성공적으로 수정되었습니다.`;
} else {
  // 필드 변경이 없는 경우
  message = `${데이터제목}이 성공적으로 수정되었습니다.`;
}

setSnackbar({
  open: true,
  message: message,
  severity: 'success'
});
```

### **패턴 B: 한국어 조사 정확도 개선 (고급 버전)**

```typescript
// 받침 감지 함수
const getKoreanParticle = (word: string): string => {
  const lastChar = word.charAt(word.length - 1);
  const code = lastChar.charCodeAt(0);

  // 한글 범위: 0xAC00 ~ 0xD7A3
  if (code >= 0xAC00 && code <= 0xD7A3) {
    // 받침이 있으면 (code - 0xAC00) % 28 !== 0
    const hasJongseong = (code - 0xAC00) % 28 !== 0;
    return hasJongseong ? '이' : '가';
  }
  return '가'; // 한글이 아닌 경우 기본값
};

// 사용 예시
let message = '';
if (changedFields.length > 0) {
  const fieldsText = changedFields.join(', ');
  const lastField = changedFields[changedFields.length - 1];
  const josa = getKoreanParticle(lastField);
  message = `${데이터제목}의 ${fieldsText}${josa} 성공적으로 수정되었습니다.`;
} else {
  const josa = getKoreanParticle(데이터제목);
  message = `${데이터제목}${josa} 성공적으로 수정되었습니다.`;
}
```

**실제 예시:**
```
✅ "안전교육의 상태가 성공적으로 수정되었습니다." (상태 = 받침 없음)
✅ "보안점검의 담당자가 성공적으로 수정되었습니다." (담당자 = 받침 있음)
✅ "평가의 상태, 팀, 담당자가 성공적으로 수정되었습니다." (마지막 필드 기준)
```

**적용 체크리스트:**
- ✅ severity: **'success'** (초록색)
- ✅ 변경된 필드가 있으면: `제목의 필드1, 필드2 + 이/가 + 성공적으로 수정되었습니다`
- ✅ 변경된 필드가 없으면: `제목 + 이 + 성공적으로 수정되었습니다`
- ✅ 조사: **간단 버전** (필드 개수) 또는 **정확 버전** (받침 감지)

---

## 4️⃣ 삭제(Delete) 토스트

### **패턴:**

**Step 1: 삭제할 데이터 미리 저장**
```typescript
const handleDelete = async (ids: number[]) => {
  // 삭제 전에 데이터 정보 저장 (삭제 후에는 접근 불가)
  const deletedItems = dataList.filter((item) => ids.includes(item.id));

  let successCount = 0;
  let failCount = 0;

  // 각 ID에 대해 삭제 실행
  for (const id of ids) {
    try {
      const result = await deleteFunction(id);
      if (result) {
        successCount++;
      } else {
        failCount++;
      }
    } catch (error) {
      failCount++;
    }
  }

  // ... 토스트 알림
}
```

**Step 2: 토스트 메시지 (4가지 케이스)**
```typescript
// 결과에 따른 알림
if (failCount === 0) {
  // ✅ 전체 성공
  if (successCount === 1 && deletedItems.length > 0) {
    // 🔹 단일 삭제
    setSnackbar({
      open: true,
      message: `${deletedItems[0].제목필드} 성공적으로 삭제되었습니다.`,
      severity: 'error'  // ⚠️ 빨간 아이콘
    });
  } else {
    // 🔹 다중 삭제
    setSnackbar({
      open: true,
      message: `${successCount}개 항목이 성공적으로 삭제되었습니다.`,
      severity: 'error'  // ⚠️ 빨간 아이콘
    });
  }
} else if (successCount > 0) {
  // ⚠️ 부분 실패
  setSnackbar({
    open: true,
    message: `삭제 완료: ${successCount}개, 실패: ${failCount}개`,
    severity: 'warning'  // 노란색
  });
} else {
  // ❌ 전체 실패
  setSnackbar({
    open: true,
    message: '삭제에 실패했습니다.',
    severity: 'error'  // 빨간색
  });
}
```

**실제 예시:**
```typescript
// 인사평가관리
if (successCount === 1) {
  setSnackbar({
    open: true,
    message: `${deletedEvaluations[0].evaluationTitle} 성공적으로 삭제되었습니다.`,
    severity: 'error'
  });
} else {
  setSnackbar({
    open: true,
    message: `${successCount}개 인사평가가 성공적으로 삭제되었습니다.`,
    severity: 'error'
  });
}
```

**적용 체크리스트:**
- ✅ severity: **'error'** (빨간 아이콘) - 삭제는 위험한 작업이므로 빨간색 사용
- ✅ 단일 삭제: `제목 + 성공적으로 삭제되었습니다`
- ✅ 다중 삭제: `${개수}개 + 항목명 + 성공적으로 삭제되었습니다`
- ✅ 부분 실패: severity **'warning'** (노란색)
- ✅ 전체 실패: severity **'error'** (빨간색)

---

## 5️⃣ 에러 처리 토스트

### **패턴:**
```typescript
try {
  // ... 작업 수행
} catch (error: any) {
  setSnackbar({
    open: true,
    message: `저장 실패: ${error?.message || '알 수 없는 오류가 발생했습니다.'}`,
    severity: 'error'
  });
}
```

---

## 📝 페이지별 적용 체크리스트

### ✅ 새 페이지에 토스트 적용 시

**1단계: 기본 설정**
- [ ] Import: Snackbar, Alert 추가
- [ ] State: snackbar state 선언
- [ ] JSX: Snackbar 컴포넌트 페이지 하단 추가

**2단계: 추가(Create) 구현**
- [ ] handleSave 또는 handleCreate 함수에서 추가 로직 확인
- [ ] 성공 시 토스트: `제목이 성공적으로 추가되었습니다`
- [ ] severity: 'success'

**3단계: 수정(Update) 구현**
- [ ] fieldMap 정의 (영문 → 한글)
- [ ] 원본 데이터 저장 (originalData state 또는 배열에서 찾기)
- [ ] 변경된 필드 감지 로직
- [ ] 성공 시 토스트: `제목의 필드이/가 성공적으로 수정되었습니다`
- [ ] severity: 'success'

**4단계: 삭제(Delete) 구현**
- [ ] handleDelete 함수에서 삭제 전 데이터 저장
- [ ] 단일/다중 삭제 구분
- [ ] 성공 시 토스트: `제목 성공적으로 삭제되었습니다`
- [ ] severity: **'error'** (빨간 아이콘)
- [ ] 부분 실패 처리: severity 'warning'

**5단계: 에러 처리**
- [ ] try-catch로 에러 처리
- [ ] 실패 시 토스트: severity 'error'

---

## 🔧 주요 파라미터 정리

| 항목 | 값 | 설명 |
|------|------|------|
| **위치** | `{ vertical: 'bottom', horizontal: 'right' }` | 우측 하단 |
| **지속시간** | `6000` (6초) | 자동 숨김 시간 |
| **추가 severity** | `'success'` | 초록색 아이콘 |
| **수정 severity** | `'success'` | 초록색 아이콘 |
| **삭제 severity** | `'error'` | 빨간색 아이콘 |
| **부분실패 severity** | `'warning'` | 노란색 아이콘 |
| **에러 severity** | `'error'` | 빨간색 아이콘 |

---

## 💡 핵심 포인트

1. **삭제는 빨간색** - severity: 'error' 사용 (위험한 작업 표시)
2. **추가/수정은 초록색** - severity: 'success' 사용
3. **위치는 우측 하단** - 사용자 작업 방해 최소화
4. **필드 변경 감지** - 무엇이 바뀌었는지 명확히 표시
5. **한국어 조사** - 간단 버전(필드 개수) 또는 정확 버전(받침 감지)

---

## 📚 참고: 구현된 페이지

### ✅ 인사평가관리 (`EvaluationManagement.tsx`)
- 위치: `src/views/apps/EvaluationManagement.tsx`
- Line 2146-2150: Snackbar state
- Line 2585-2703: 추가/수정 로직
- Line 2705-2791: 삭제 로직
- Line 3674-3688: Snackbar 컴포넌트
- **특징**: 간단 버전 조사 (필드 개수 기반)

### ✅ 보안교육관리 (`ITEducationManagement.tsx`)
- 위치: `src/views/apps/ITEducationManagement.tsx`
- Line 2056-2060: Snackbar state
- Line 2341-2467: 추가/수정 로직
- Line 2469-2569: 삭제 로직
- Line 3334-3348: Snackbar 컴포넌트
- **특징**: 고급 버전 조사 (받침 감지 기반)

### ✅ 보안규정관리 (`RegulationManagement.tsx`)
- 위치: `src/views/apps/RegulationManagement.tsx`
- **특징**: 폴더뷰 + 칸반뷰, 고급 버전 조사

---

## ⚠️ 주의사항: 실패 사례 및 해결 방법

### 🔴 보안사고관리 페이지 구현 시 발생한 오류들

보안사고관리 페이지에서 토스트 알림 구현 중 여러 오류가 발생했습니다. 다른 페이지 적용 시 동일한 실수를 반복하지 않도록 분석 내용을 정리합니다.

---

### 📌 오류 1: `setSnackbar is not defined`

**❌ 실패한 코드:**
```typescript
// 컴포넌트 외부에 함수 정의 (Line 253)
const handleDragEnd = async (event: DragEndEvent) => {
  // ... 로직
  setSnackbar({  // ❌ Error: setSnackbar is not defined
    open: true,
    message: '...',
    severity: 'success'
  });
};

function SecurityIncidentManagement() {
  const [snackbar, setSnackbar] = useState({ ... });
  // ...
}
```

**원인:**
- `handleDragEnd` 함수가 **컴포넌트 함수 외부**에 정의됨
- 컴포넌트 내부의 state (`setSnackbar`)에 접근할 수 없음
- React 컴포넌트 스코프 규칙 위반

**✅ 해결 방법:**
```typescript
function SecurityIncidentManagement() {
  const [snackbar, setSnackbar] = useState({ ... });

  // 컴포넌트 내부로 이동 (Line 2602)
  const handleDragEnd = async (event: DragEndEvent) => {
    // ... 로직
    setSnackbar({  // ✅ 정상 동작
      open: true,
      message: '...',
      severity: 'success'
    });
  };

  // ...
}
```

**핵심 교훈:**
- ✅ **토스트 알림을 사용하는 모든 함수는 컴포넌트 내부에 정의**
- ✅ `setSnackbar`를 사용하는 함수는 반드시 `useState`와 같은 스코프 내에 있어야 함

---

### 📌 오류 2: `handleDragEnd is not defined` (자식 컴포넌트)

**❌ 실패한 코드:**
```typescript
// KanbanView.tsx (자식 컴포넌트)
function KanbanView({ ... }: KanbanViewProps) {
  return (
    <DndContext onDragEnd={handleDragEnd}>  {/* ❌ Error: handleDragEnd is not defined */}
      {/* ... */}
    </DndContext>
  );
}
```

**원인:**
- `handleDragEnd` 함수를 부모 컴포넌트로 이동했지만
- 자식 컴포넌트에 **prop으로 전달하지 않음**

**✅ 해결 방법:**

**Step 1: Props 인터페이스에 추가**
```typescript
interface KanbanViewProps {
  // ... 기존 props
  onDragEnd?: (event: any) => void;  // ✅ 함수 prop 추가
}
```

**Step 2: 함수 파라미터에 추가**
```typescript
function KanbanView({
  // ... 기존 params
  onDragEnd  // ✅ prop 받기
}: KanbanViewProps) {
  return (
    <DndContext onDragEnd={onDragEnd}>  {/* ✅ prop 사용 */}
      {/* ... */}
    </DndContext>
  );
}
```

**Step 3: 부모에서 전달**
```typescript
// SecurityIncidentManagement.tsx (부모 컴포넌트)
<KanbanView
  {/* ... 기존 props */}
  onDragEnd={handleDragEnd}  // ✅ 함수 전달
/>
```

**핵심 교훈:**
- ✅ **부모의 state를 사용하는 함수는 반드시 prop으로 전달**
- ✅ 인터페이스 → 파라미터 → 전달 순서 확인

---

### 📌 오류 3: `activeTask is not defined` (State Prop 누락)

**❌ 실패한 코드:**
```typescript
// KanbanView.tsx
function KanbanView({ ... }: KanbanViewProps) {
  return (
    <DragOverlay>
      {activeTask ? <DraggableCard task={activeTask} /> : null}  {/* ❌ activeTask is not defined */}
    </DragOverlay>
  );
}
```

**원인:**
- `activeTask` state를 부모 컴포넌트에 선언했지만
- 자식 컴포넌트에 **prop으로 전달하지 않음**

**✅ 해결 방법:**

**Step 1: 부모 컴포넌트에 State 선언**
```typescript
function SecurityIncidentManagement() {
  const [activeTask, setActiveTask] = useState<SecurityIncidentRecord | null>(null);
  // ...
}
```

**Step 2: Props 인터페이스에 추가**
```typescript
interface KanbanViewProps {
  activeTask?: SecurityIncidentRecord | null;  // ✅ State prop 추가
}
```

**Step 3: 자식 컴포넌트에서 받기**
```typescript
function KanbanView({ activeTask }: KanbanViewProps) {
  return (
    <DragOverlay>
      {activeTask ? <DraggableCard task={activeTask} /> : null}  {/* ✅ 정상 동작 */}
    </DragOverlay>
  );
}
```

**Step 4: 부모에서 전달**
```typescript
<KanbanView
  activeTask={activeTask}  // ✅ State 전달
/>
```

**핵심 교훈:**
- ✅ **Drag 관련 state는 부모 컴포넌트에 선언**
- ✅ 자식 컴포넌트가 사용하는 모든 state는 prop으로 전달
- ✅ `activeTask`, `isDraggingState` 등 drag 관련 변수 모두 동일하게 처리

---

### 📌 오류 4: `isDraggingState is not defined`

**❌ 실패한 코드:**
```typescript
// KanbanView.tsx
onClick={(e) => {
  if (!isDraggingState && !isDragging) {  // ❌ isDraggingState is not defined
    handleCardClick(task);
  }
}}
```

**원인:**
- `isDraggingState`가 부모 컴포넌트에만 선언되어 있음
- 자식 컴포넌트에 prop으로 전달 안 됨

**✅ 해결 방법:**
- 오류 3과 동일한 패턴으로 해결
- Props 인터페이스 추가 → 파라미터 추가 → 전달

**핵심 교훈:**
- ✅ **모든 drag 관련 state/함수는 부모→자식 단방향으로 전달**
- ✅ `activeTask`, `isDraggingState`, `onDragStart`, `onDragEnd` 모두 동일 패턴

---

### 📌 오류 5: Delete 실패 (`is_deleted` 컬럼 없음)

**❌ 실패한 코드:**
```typescript
const handleDelete = async (ids: number[]) => {
  // Soft delete 시도
  await supabase
    .from('security_accident_report')  // ❌ 잘못된 테이블명
    .update({ is_deleted: true })      // ❌ 컬럼 없음
    .in('id', ids);
};
```

**원인:**
1. 잘못된 테이블명 사용 (`security_accident_report` → `security_accident_data`)
2. `is_deleted` 컬럼이 존재하지 않는데 soft delete 시도
3. **Hook 함수를 사용하지 않음**

**✅ 해결 방법:**

**Step 1: Hook에서 deleteAccident 함수 가져오기**
```typescript
const { items, error, fetchAccidents, updateAccident, deleteAccident } = useSupabaseSecurityAccident();
```

**Step 2: Hook 함수 사용**
```typescript
const handleDelete = async (ids: number[]) => {
  let successCount = 0;
  let failCount = 0;

  for (const id of ids) {
    const result = await deleteAccident(id);  // ✅ Hook 함수 사용
    if (result) {
      successCount++;
    } else {
      failCount++;
    }
  }

  // 토스트 알림
  // ...
};
```

**핵심 교훈:**
- ✅ **DB 작업은 반드시 Hook 함수 사용** (`deleteAccident`, `updateAccident` 등)
- ✅ 직접 Supabase 쿼리 작성 금지 (테이블명 오류 발생 가능)
- ✅ Hook의 CRUD 함수를 활용하면 안전하고 일관성 유지

---

### 📌 오류 6: 자식 컴포넌트에 `setSnackbar` 전달 누락

**❌ 실패한 코드:**
```typescript
// SecurityIncidentTable.tsx (자식 컴포넌트)
const handleSave = () => {
  // ... 저장 로직
  setSnackbar({ ... });  // ❌ setSnackbar is not defined
};

// SecurityIncidentManagement.tsx (부모)
<SecurityIncidentTable
  // setSnackbar 전달 안 함
/>
```

**✅ 해결 방법:**

**Step 1: 자식 컴포넌트 Props 인터페이스**
```typescript
interface SecurityIncidentTableProps {
  // ... 기존 props
  setSnackbar?: React.Dispatch<React.SetStateAction<{
    open: boolean;
    message: string;
    severity: 'success' | 'error' | 'warning' | 'info';
  }>>;
}
```

**Step 2: 자식 컴포넌트에서 받기**
```typescript
export default function SecurityIncidentTable({
  // ... 기존 params
  setSnackbar = undefined  // 기본값 설정
}: SecurityIncidentTableProps) {
  // ...
  if (setSnackbar) {  // ✅ 안전하게 사용
    setSnackbar({ ... });
  }
}
```

**Step 3: 부모에서 전달**
```typescript
<SecurityIncidentTable
  setSnackbar={setSnackbar}  // ✅ 전달
/>
```

**핵심 교훈:**
- ✅ **테이블 컴포넌트가 별도 파일이면 setSnackbar를 prop으로 전달**
- ✅ Optional prop + 기본값 설정으로 안전성 확보
- ✅ `if (setSnackbar)` 체크 후 사용

---

## ✅ 성공적인 구현 체크리스트

### 칸반뷰가 있는 페이지 (보안사고관리 등)

**1️⃣ State 관리 (부모 컴포넌트)**
```typescript
function MainManagement() {
  // ✅ Snackbar state
  const [snackbar, setSnackbar] = useState({ ... });

  // ✅ Drag 관련 state (부모에 선언)
  const [activeTask, setActiveTask] = useState<TaskType | null>(null);
  const [isDraggingState, setIsDraggingState] = useState(false);

  // ✅ Hook에서 CRUD 함수 가져오기
  const { items, updateItem, deleteItem } = useSupabaseHook();
}
```

**2️⃣ 함수 정의 (부모 컴포넌트 내부)**
```typescript
function MainManagement() {
  // ...

  // ✅ 컴포넌트 내부에 정의
  const handleDragStart = (event: DragStartEvent) => {
    setActiveTask(...);
    setIsDraggingState(true);
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    setActiveTask(null);
    setIsDraggingState(false);
    // ... 로직
    setSnackbar({ ... });  // ✅ 정상 접근
  };
}
```

**3️⃣ Props 전달 (부모 → 자식)**
```typescript
// ✅ KanbanView Props 인터페이스
interface KanbanViewProps {
  activeTask?: TaskType | null;
  isDraggingState?: boolean;
  onDragStart?: (event: any) => void;
  onDragEnd?: (event: any) => void;
}

// ✅ 부모에서 전달
<KanbanView
  activeTask={activeTask}
  isDraggingState={isDraggingState}
  onDragStart={handleDragStart}
  onDragEnd={handleDragEnd}
/>

// ✅ 테이블 컴포넌트에 전달
<DataTable
  setSnackbar={setSnackbar}
/>
```

**4️⃣ 자식 컴포넌트에서 사용**
```typescript
function KanbanView({
  activeTask,
  isDraggingState,
  onDragStart,
  onDragEnd
}: KanbanViewProps) {
  return (
    <DndContext
      onDragStart={onDragStart}   // ✅ prop 사용
      onDragEnd={onDragEnd}       // ✅ prop 사용
    >
      <DragOverlay>
        {activeTask ? <Card /> : null}  {/* ✅ prop 사용 */}
      </DragOverlay>
    </DndContext>
  );
}
```

---

## 🎯 핵심 원칙 요약

### ✅ DO (해야 할 것)
1. **State는 부모 컴포넌트에 선언**
   - `snackbar`, `activeTask`, `isDraggingState` 등
2. **함수는 컴포넌트 내부에 정의**
   - `handleDragEnd`, `handleDragStart`, `handleDelete` 등
3. **Hook 함수 활용**
   - `deleteAccident`, `updateAccident` 등 CRUD 함수 사용
4. **Props 체계적으로 전달**
   - 인터페이스 정의 → 파라미터 추가 → 부모에서 전달
5. **Optional Props + 안전 체크**
   - `setSnackbar?: ...`, `if (setSnackbar) { ... }`

### ❌ DON'T (하지 말아야 할 것)
1. **컴포넌트 외부에 함수 정의 금지**
   - State 접근 불가 오류 발생
2. **자식 컴포넌트에 state 선언 금지**
   - 부모에 선언하고 prop으로 전달
3. **직접 Supabase 쿼리 작성 금지**
   - Hook 함수 사용으로 안전성 확보
4. **Props 전달 누락 금지**
   - 인터페이스, 파라미터, 전달 모두 확인

---

## 📚 참고: 성공 사례

### ✅ 보안사고관리 (`SecurityIncidentManagement.tsx`)
- 위치: `src/views/apps/SecurityIncidentManagement.tsx`
- Line 2024-2028: Snackbar state
- Line 2030-2032: Drag state (부모 선언)
- Line 2594-2600: handleDragStart (컴포넌트 내부)
- Line 2602-2664: handleDragEnd (컴포넌트 내부)
- Line 148-151: KanbanViewProps (Props 인터페이스)
- Line 3108-3113: Props 전달
- **특징**: 칸반뷰 + 테이블뷰, 컴포넌트 분리, Props 전달 패턴

---

**이 패턴을 다른 모든 관리 페이지에 동일하게 적용하면 일관된 사용자 경험을 제공할 수 있습니다!**
