# Phase 2: 병렬 데이터 로딩 - 계획서

작성일: 2025-10-18
작성자: Claude Code

---

## 📋 개요

**목표**: 여러 API 호출을 순차 실행에서 병렬 실행으로 변경하여 초기 로딩 시간 단축

**예상 효과**: 초기 로딩 시간 **50-70%** 단축

---

## 🔍 현재 상황 분석

### 문제점: 순차적 API 호출

현재 대부분의 페이지는 **여러 hook이 독립적으로 useEffect를 실행**하고 있습니다:

```typescript
// 현재 방식 (순차 실행)
export default function TaskManagement() {
  const { users } = useSupabaseUserManagement();           // useEffect → API 1
  const { departments } = useSupabaseDepartmentManagement(); // useEffect → API 2
  const { tasks } = useSupabaseTaskManagement();           // useEffect → API 3
  const { kpiTasks } = useSupabaseKpiTask();               // useEffect → API 4

  // 각 hook이 독립적으로 실행됨
  // → 총 로딩 시간 = API1 + API2 + API3 + API4 (순차)
}
```

**문제**:
- React의 useEffect가 순서대로 실행되어 API 호출이 순차적으로 발생
- 총 로딩 시간 = 모든 API 응답 시간의 **합**
- 예: 4개 API × 평균 500ms = **2000ms**

---

## ✅ 개선 방안

### 전략 1: Promise.all을 사용한 병렬 실행

```typescript
// 개선 방식 (병렬 실행)
export default function TaskManagement() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    users: [],
    departments: [],
    tasks: [],
    kpiTasks: []
  });

  useEffect(() => {
    const loadAllData = async () => {
      setLoading(true);

      try {
        // Promise.all로 모든 API 동시 호출
        const [users, departments, tasks, kpiTasks] = await Promise.all([
          fetchUsers(),
          fetchDepartments(),
          fetchTasks(),
          fetchKpiTasks()
        ]);

        setData({ users, departments, tasks, kpiTasks });
      } catch (error) {
        console.error('데이터 로딩 오류:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAllData();
  }, []);

  // 총 로딩 시간 = max(API1, API2, API3, API4) (병렬)
  // 예: max(500ms, 400ms, 600ms, 300ms) = 600ms
}
```

**효과**:
- 총 로딩 시간 = 가장 느린 API 응답 시간
- 4개 API의 경우: 2000ms → **600ms** (70% 개선)

---

### 전략 2: Hook 개선 (fetch 함수 노출)

현재 hook들이 자동으로 데이터를 로딩하므로, **명시적으로 호출 가능한 fetch 함수**를 추가해야 합니다.

```typescript
// Before: 자동 로딩
export const useSupabaseTaskManagement = () => {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    fetchTasks(); // 자동 실행
  }, []);

  return { tasks, loading, error };
};

// After: 수동 로딩 옵션 추가
export const useSupabaseTaskManagement = (autoLoad = true) => {
  const [tasks, setTasks] = useState([]);

  useEffect(() => {
    if (autoLoad) {
      fetchTasks(); // 옵션에 따라 실행
    }
  }, [autoLoad]);

  return { tasks, loading, error, fetchTasks }; // fetch 함수 노출
};
```

---

## 🎯 적용 대상

### 우선순위 1: 핵심 Management 페이지

1. **TaskManagement** (`src/views/apps/TaskManagement.tsx`)
   - Hook 수: 6개
   - useSupabaseUserManagement
   - useSupabaseDepartmentManagement
   - useSupabaseMasterCode3
   - useSupabaseTaskManagement
   - useSupabaseChangeLog
   - useSupabaseKpiTask

2. **KpiManagement** (`src/views/apps/KpiManagement.tsx`)
   - Hook 수: 5개
   - useSupabaseUserManagement
   - useSupabaseDepartmentManagement
   - useSupabaseMasterCode3
   - useSupabaseKpi
   - useSupabaseChangeLog

3. **기타 Management 페이지**
   - SalesManagement
   - VOCManagement
   - EducationManagement
   - SecurityEducationManagement
   - 등...

---

## 📝 구현 계획

### Task 1: Hook 개선 - fetch 함수 노출 ✅

**대상**: Phase 1에서 캐싱을 적용한 10개 hook
- useSupabaseTaskManagement ✅ (이미 fetchTasks 노출)
- useSupabaseKpiTask ✅ (이미 fetchAllTasksByUser 노출)
- useSupabaseKpi ✅ (이미 fetchKpis 노출)
- 나머지 hook들 확인 및 개선

### Task 2: TaskManagement 페이지 병렬 로딩 적용

**Before** (순차 실행):
```typescript
// useEffect가 각각 독립적으로 실행
React.useEffect(() => {
  fetchDepartments();
}, [fetchDepartments]);

React.useEffect(() => {
  fetchAllTasksByUser(userName);
}, [user, fetchAllTasksByUser]);

React.useEffect(() => {
  if (value === 4) {
    fetchChangeLogs();
  }
}, [value, fetchChangeLogs]);
```

**After** (병렬 실행):
```typescript
React.useEffect(() => {
  const loadAllData = async () => {
    setLoading(true);

    try {
      await Promise.all([
        fetchDepartments(),
        fetchAllTasksByUser(userName),
        // fetchTasks는 hook이 자동으로 캐시에서 로드
      ]);
    } catch (error) {
      console.error('데이터 로딩 오류:', error);
    } finally {
      setLoading(false);
    }
  };

  if (userName) {
    loadAllData();
  }
}, [userName, fetchDepartments, fetchAllTasksByUser]);
```

### Task 3: KpiManagement 페이지 병렬 로딩 적용

동일한 패턴 적용

### Task 4: 기타 주요 페이지 병렬 로딩 적용

- SalesManagement
- VOCManagement
- EducationManagement
- 등...

### Task 5: 성능 측정 및 비교

- Before/After 로딩 시간 측정
- Chrome DevTools Performance 사용

---

## 📊 예상 성능 개선

| 페이지 | 현재 (순차) | 개선 (병렬) | 개선율 |
|--------|------------|------------|--------|
| TaskManagement (6 API) | ~3000ms | ~600ms | **80%** ↑ |
| KpiManagement (5 API) | ~2500ms | ~500ms | **80%** ↑ |
| SalesManagement | ~2000ms | ~400ms | **80%** ↑ |

**사용자 체감**:
- ✅ 페이지 로딩이 **2-3배 빠름**
- ✅ 데이터가 **동시에** 표시됨
- ✅ 로딩 스피너 시간 **대폭 단축**

---

## 💡 주의사항

### 1. API Rate Limiting
- 동시에 너무 많은 API 호출 시 서버 부하 증가 가능
- Supabase는 기본적으로 병렬 요청 지원

### 2. 에러 처리
- 하나의 API가 실패해도 다른 API는 성공할 수 있도록
- Promise.allSettled 고려

```typescript
const results = await Promise.allSettled([
  fetchUsers(),
  fetchDepartments(),
  fetchTasks()
]);

results.forEach((result, index) => {
  if (result.status === 'fulfilled') {
    // 성공한 데이터 처리
  } else {
    console.error(`API ${index + 1} 실패:`, result.reason);
  }
});
```

### 3. 캐싱과의 조합
- Phase 1의 캐싱이 이미 적용되어 있으므로
- 캐시가 있으면 API 호출 없이 즉시 반환
- 병렬 로딩은 **첫 방문 시**에만 효과 발휘

---

## 🎯 다음 단계

1. ✅ Phase 2 계획 완료
2. ⏸️ Hook 개선 (fetch 함수 확인)
3. ⏸️ TaskManagement 병렬 로딩 적용
4. ⏸️ KpiManagement 병렬 로딩 적용
5. ⏸️ 성능 측정

---

**작성 완료일**: 2025-10-18
**예상 소요 시간**: 2-3시간
**예상 개선**: 초기 로딩 시간 50-70% 단축
