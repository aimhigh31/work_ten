# 보안교육관리 - 교육실적보고 데이터 연동 완전 가이드

## 📋 개요
보안교육관리 시스템의 교육실적보고 탭에서 성과, 개선사항, 교육소감 데이터가 Supabase DB와 완전히 연동되도록 구현한 과정과 핵심 원리를 정리합니다.

## 🎯 교육실적보고 데이터 흐름

### 1. 데이터 구조
```typescript
// DB 테이블: security_education_data
{
  achievements: string,        // 성과
  improvement_points: string,  // 개선사항
  feedback: string            // 교육소감
}

// UI 상태: EducationReport
{
  achievements: string,    // 성과
  improvements: string,    // 개선사항 (DB의 improvement_points와 매핑)
  feedback: string        // 교육소감
}
```

### 2. 완전한 데이터 흐름 구조
```
입력 → 임시저장(sessionStorage) → 최종저장(DB) → 재로드 → 표시
  ↓           ↓                    ↓           ↓         ↓
TextField → handleChange →      handleSave → fetchData → 초기화
```

## 🔧 핵심 구현 코드

### 1. 입력 처리 및 임시 저장 (SecurityEducationEditDialog.tsx)
```typescript
const handleEducationReportChange = useCallback((field: keyof EducationReport, value: string) => {
  console.log(`🟡 교육실적보고 임시 저장: field=${field}, value="${value}"`);

  // 로컬 상태 즉시 업데이트
  const updatedReport = {
    ...educationReport,
    [field]: value
  };
  setEducationReport(updatedReport);

  // 임시 저장 (sessionStorage에 저장)
  if (data?.id) {
    const tempKey = `education_report_temp_${data.id}`;
    sessionStorage.setItem(tempKey, JSON.stringify(updatedReport));
    console.log(`💾 임시 저장 완료: ${tempKey}`);
  }
}, [educationReport, data?.id]);
```

### 2. 최종 저장 시 데이터 처리 (SecurityEducationEditDialog.tsx)
```typescript
const handleSave = useCallback(async () => {
  // sessionStorage에서 임시 저장된 데이터 확인하고 최신 데이터 결정
  let finalEducationReport = educationReport;
  if (data?.id) {
    const tempKey = `education_report_temp_${data.id}`;
    const tempData = sessionStorage.getItem(tempKey);
    if (tempData) {
      const parsedTempData = JSON.parse(tempData);
      // 임시 저장된 데이터를 우선 사용
      finalEducationReport = parsedTempData;
    }
  }

  const educationData: SecurityEducationRecord = {
    // ... 기존 필드들
    // 교육실적보고 데이터 포함 (sessionStorage 우선 사용)
    achievements: finalEducationReport.achievements,
    improvement_points: finalEducationReport.improvements, // improvements -> improvement_points 매핑
    feedback: finalEducationReport.feedback
  };
}, [educationState, data, mode, onSave, onClose]);
```

### 3. 데이터 변환 함수들 (SecurityEducationDataTable.tsx)

#### A. Record → TableData (저장 후 테이블 표시용)
```typescript
const convertRecordToTableData = (record: SecurityEducationRecord): SecurityEducationTableData => {
  const converted = {
    // ... 기존 필드들
    // 교육실적보고 데이터 포함
    achievements: record.achievements,
    improvements: record.improvement_points, // improvement_points -> improvements로 매핑
    feedback: record.feedback
  };
  return converted;
};
```

#### B. TableData → Record (편집 시 팝업 전달용)
```typescript
const convertTableDataToRecord = (tableData: SecurityEducationTableData): SecurityEducationRecord => {
  const converted = {
    // ... 기존 필드들
    // 교육실적보고 필드 추가
    achievements: tableData.achievements || '',
    improvement_points: tableData.improvements || '', // improvements -> improvement_points 매핑
    feedback: tableData.feedback || ''
  };
  return converted;
};
```

### 4. 편집 모드 초기화 (SecurityEducationEditDialog.tsx)
```typescript
useEffect(() => {
  if (open) {
    if (mode === 'edit' && data) {
      // 임시 저장된 데이터 확인
      const tempKey = `education_report_temp_${data.id}`;
      const tempData = sessionStorage.getItem(tempKey);

      if (tempData) {
        // 임시 저장 데이터 복원
        const parsedTempData = JSON.parse(tempData);
        setEducationReport(parsedTempData);
      } else {
        // DB에서 교육실적보고 데이터 로드
        setEducationReport({
          achievements: data.achievements || '',
          improvements: data.improvement_points || '', // improvement_points에서 로드
          feedback: data.feedback || ''
        });
      }
    }
  }
}, [open, mode, data]);
```

## ❌ 기존에 안되었던 이유

### 1. React 상태 동기화 문제
- `handleSave`에서 `educationReport` 상태가 아닌 이전 상태 값 사용
- React의 비동기 상태 업데이트 특성으로 인한 데이터 손실

### 2. 데이터 변환 함수 누락
- `convertTableDataToRecord`에서 교육실적보고 필드들 누락
- 편집 모드로 팝업 열 때 데이터가 전달되지 않음

### 3. 필드 매핑 불일치
- DB: `improvement_points` ↔ UI: `improvements` 매핑 불일치
- 데이터 변환 과정에서 필드명 차이로 인한 데이터 손실

## ✅ 해결된 핵심 포인트

### 1. sessionStorage 우선 사용 패턴
```typescript
// 저장 시 항상 sessionStorage 데이터를 우선으로 사용
let finalEducationReport = educationReport;
if (data?.id) {
  const tempData = sessionStorage.getItem(`education_report_temp_${data.id}`);
  if (tempData) {
    finalEducationReport = JSON.parse(tempData); // 임시 저장 데이터 우선
  }
}
```

### 2. 완전한 양방향 데이터 변환
```typescript
// DB ↔ UI 필드 매핑
DB.improvement_points ↔ UI.improvements
DB.achievements ↔ UI.achievements
DB.feedback ↔ UI.feedback
```

### 3. 데이터 정합성 보장
- 저장 성공 후 sessionStorage 정리
- 팝업 닫을 때 임시 데이터 정리
- 편집/추가 모드별 데이터 처리 분리

## 🚀 동일한 구조로 DB 연동 구현 가이드

### 1. 기본 구조 설정

#### A. DB 테이블 필드 정의
```sql
-- 예시: 새로운 보고서 필드 추가
ALTER TABLE your_table ADD COLUMN report_field1 text;
ALTER TABLE your_table ADD COLUMN report_field2 text;
```

#### B. TypeScript 인터페이스 정의
```typescript
// DB 데이터 타입
interface YourRecord {
  // ... 기존 필드들
  report_field1: string;  // DB 필드명
  report_field2: string;
}

// UI 상태 타입
interface YourReport {
  field1: string;  // UI에서 사용할 필드명
  field2: string;
}

// 테이블 표시용 타입
interface YourTableData {
  // ... 기존 필드들
  reportField1: string;  // 카멜케이스 변환
  reportField2: string;
}
```

### 2. 핵심 함수 구현

#### A. 입력 처리 함수
```typescript
const handleYourReportChange = useCallback((field: keyof YourReport, value: string) => {
  console.log(`🟡 보고서 임시 저장: field=${field}, value="${value}"`);

  const updatedReport = { ...yourReport, [field]: value };
  setYourReport(updatedReport);

  // 임시 저장
  if (data?.id) {
    const tempKey = `your_report_temp_${data.id}`;
    sessionStorage.setItem(tempKey, JSON.stringify(updatedReport));
    console.log(`💾 임시 저장 완료: ${tempKey}`);
  }
}, [yourReport, data?.id]);
```

#### B. 저장 함수
```typescript
const handleSave = useCallback(async () => {
  // sessionStorage 우선 사용
  let finalYourReport = yourReport;
  if (data?.id) {
    const tempKey = `your_report_temp_${data.id}`;
    const tempData = sessionStorage.getItem(tempKey);
    if (tempData) {
      finalYourReport = JSON.parse(tempData);
    }
  }

  const yourData: YourRecord = {
    // ... 기존 필드들
    // 보고서 데이터 포함 - 필드명 매핑 주의!
    report_field1: finalYourReport.field1,  // UI → DB 매핑
    report_field2: finalYourReport.field2
  };

  // 저장 후 임시 데이터 정리
  if (data?.id) {
    const tempKey = `your_report_temp_${data.id}`;
    sessionStorage.removeItem(tempKey);
  }
}, [yourReport, data, mode, onSave, onClose]);
```

#### C. 데이터 변환 함수들
```typescript
// Record → TableData (저장 후 표시)
const convertRecordToTableData = (record: YourRecord): YourTableData => {
  return {
    // ... 기존 필드들
    reportField1: record.report_field1,  // DB → 테이블 매핑
    reportField2: record.report_field2
  };
};

// TableData → Record (편집 시 전달)
const convertTableDataToRecord = (tableData: YourTableData): YourRecord => {
  return {
    // ... 기존 필드들
    report_field1: tableData.reportField1 || '',  // 테이블 → DB 매핑
    report_field2: tableData.reportField2 || ''
  };
};
```

#### D. 초기화 함수
```typescript
useEffect(() => {
  if (open && mode === 'edit' && data) {
    const tempKey = `your_report_temp_${data.id}`;
    const tempData = sessionStorage.getItem(tempKey);

    if (tempData) {
      setYourReport(JSON.parse(tempData));
    } else {
      setYourReport({
        field1: data.report_field1 || '',  // DB → UI 매핑
        field2: data.report_field2 || ''
      });
    }
  }
}, [open, mode, data]);
```

## ⚠️ 주의사항

### 1. 필수 체크리스트
- [ ] DB 필드명과 UI 필드명 매핑 정확히 확인
- [ ] 데이터 변환 함수 두 방향 모두 구현
- [ ] sessionStorage 키 충돌 방지 (`temp_${id}` 패턴 사용)
- [ ] 저장 성공 후 임시 데이터 정리
- [ ] TypeScript 인터페이스 일관성 유지

### 2. 디버깅 로그 패턴
```typescript
// 입력 감지
console.log('🔥 필드 입력 감지:', value);

// 임시 저장
console.log('💾 임시 저장 완료:', tempKey);

// 데이터 변환
console.log('🔍 변환 전:', inputData);
console.log('🔍 변환 후:', outputData);

// 최종 저장
console.log('🟡 최종 저장 데이터:', finalData);
```

### 3. 공통 실수 방지
- **절대 금지**: 필드명 매핑 없이 직접 전달
- **필수**: 양방향 변환 함수 모두 구현
- **중요**: sessionStorage 우선 사용 패턴 적용
- **핵심**: 저장 후 정리 로직 포함

## 📊 성능 최적화 팁

### 1. sessionStorage 사용 최적화
```typescript
// 디바운싱으로 과도한 저장 방지
const debouncedSave = useCallback(
  debounce((data: any, key: string) => {
    sessionStorage.setItem(key, JSON.stringify(data));
  }, 300),
  []
);
```

### 2. 메모리 관리
```typescript
// 컴포넌트 언마운트 시 정리
useEffect(() => {
  return () => {
    if (data?.id) {
      sessionStorage.removeItem(`your_report_temp_${data.id}`);
    }
  };
}, [data?.id]);
```

## 🎉 결론

이 패턴을 따르면 **임시저장 → DB저장 → 재로드 → 표시**의 완전한 데이터 순환 구조를 안정적으로 구현할 수 있습니다. 핵심은 **sessionStorage 우선 사용**과 **완전한 양방향 데이터 변환**입니다.