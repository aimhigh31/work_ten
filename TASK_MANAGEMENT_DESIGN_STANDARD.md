# 📋 업무관리 페이지 - 기본 디자인 표준

> **업무관리 페이지**는 본 프로젝트의 **기본 페이지**로 선정되었으며, 모든 새로운 페이지 개발 시 이 디자인 표준을 따라야 합니다.

## 🎯 개요

업무관리 페이지는 **4가지 핵심 탭**으로 구성된 종합 업무 관리 시스템입니다:
- **대시보드**: 업무 현황 시각화 및 통계
- **칸반뷰**: 드래그&드롭 방식의 업무 관리
- **테이블뷰**: 상세한 업무 데이터 테이블
- **변경로그**: 모든 업무 변경 이력 추적

## 🎨 디자인 시스템

### 📐 레이아웃 구조

```
┌─────────────────────────────────────┐
│           페이지 제목                │
├─────────────────────────────────────┤
│        탭 네비게이션                 │
├─────────────────────────────────────┤
│                                     │
│           메인 콘텐츠                 │
│                                     │
└─────────────────────────────────────┘
```

### 🎨 색상 팔레트

#### 기본 색상
- **배경색**: `#f8f9fa` (밝은 그레이)
- **카드 배경**: `#ffffff` (순백색)
- **텍스트**: `#333333` (다크 그레이)
- **보조 텍스트**: `#666666` (미디엄 그레이)

#### 상태별 색상
- **대기**: `#6E6E75` (그레이)
- **진행**: `#3DA9FF` (블루)
- **완료**: `#D6F231` (라이트 그린)
- **홀딩**: `#F44336` (레드)

#### 팀별 색상
- **개발팀**: `#F1F8E9` (연한 그린)
- **디자인팀**: `#F3E5F5` (연한 퍼플)
- **기획팀**: `#E0F2F1` (연한 틸)
- **마케팅팀**: `#E3F2FD` (연한 블루)

### 📏 간격 시스템

```typescript
spacing: {
  xs: 4,      // 4px
  sm: 8,      // 8px  
  md: 16,     // 16px
  lg: 24,     // 24px
  xl: 32,     // 32px
  xxl: 48     // 48px
}
```

## 📊 대시보드 탭 - 표준 컴포넌트

### 🎯 차트 컴포넌트

#### 1. 원형 차트 (Pie Chart)
```typescript
// 표준 원형차트 옵션
const pieChartOptions = {
  chart: { type: 'pie', toolbar: { show: false } },
  colors: ['#01439C', '#389CD7', '#59B8D5', '#BCE3EC'],
  legend: { show: false },
  dataLabels: {
    enabled: true,
    formatter: (val) => val.toFixed(1) + '%'
  },
  tooltip: {
    custom: function({ series, seriesIndex, w }) {
      return `<div class="pie_box">
        <span class="PieDot" style='background-color:${w.globals.colors[seriesIndex]}'></span>
        <span class="fontsize">${label} 
        <span class="fontsizeValue">${value}건 (${percentage}%)</span></span>
      </div>`;
    }
  }
}
```

#### 2. 막대 차트 (Bar Chart)
```typescript
// 표준 막대차트 옵션
const barChartOptions = {
  chart: { type: 'bar', stacked: true },
  colors: ['#6E6E75', '#3DA9FF', '#D6F231', '#F44336'],
  xaxis: { categories: monthlyData },
  tooltip: {
    y: { formatter: (val) => val + '건' }
  }
}
```

### 🎨 툴팁 스타일 표준

#### CSS 클래스
```css
.pie_box {
  padding: 16px;
  display: flex;
  gap: 8px;
  align-items: center;
  width: 100%;
  background-color: #ffffff;
  border-radius: 6px;
  box-shadow: 0 2px 8px rgba(0,0,0,0.1);
}

.PieDot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
}

.fontsize {
  font-weight: 500;
  font-size: 0.875rem;
  line-height: 1.375rem;
  color: #000000;
}

.fontsizeValue {
  color: #000000;
  font-weight: 600;
}
```

## 🎮 칸반뷰 탭 - 드래그&드롭 시스템

### 🏗️ 구조
```
┌─────────┬─────────┬─────────┬─────────┐
│   대기   │   진행   │   완료   │   홀딩   │
├─────────┼─────────┼─────────┼─────────┤
│ 업무카드 │ 업무카드 │ 업무카드 │ 업무카드 │
│ 업무카드 │ 업무카드 │         │         │
│ 업무카드 │         │         │         │
└─────────┴─────────┴─────────┴─────────┘
```

### 📱 업무 카드 디자인
```typescript
// 표준 업무카드 스타일
const taskCardStyle = {
  backgroundColor: '#ffffff',
  border: '1px solid #e0e0e0',
  borderRadius: '8px',
  padding: '12px',
  margin: '8px 0',
  boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  cursor: 'pointer',
  '&:hover': {
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)'
  }
}
```

## 📋 테이블뷰 탭 - 데이터 표준

### 🗂️ 컬럼 구성
1. **번호** (No.)
2. **등록일** (Registration Date)
3. **업무코드** (Code)
4. **팀** (Team)
5. **부서** (Department)
6. **업무내용** (Work Content)
7. **상태** (Status)
8. **담당자** (Assignee)
9. **시작일** (Start Date)
10. **완료일** (Completed Date)

### 🎨 테이블 스타일
```typescript
// 표준 테이블 스타일
const tableStyle = {
  '& .MuiTableHead-root': {
    backgroundColor: '#f8f9fa'
  },
  '& .MuiTableCell-head': {
    fontWeight: 600,
    color: '#333333'
  },
  '& .MuiTableRow-root:hover': {
    backgroundColor: '#f8f9fa'
  }
}
```

## 📝 변경로그 탭 - 추적 시스템

### 🕐 로그 항목 구성
- **일시** (DateTime)
- **팀** (Team)
- **사용자** (User)
- **액션** (Action)
- **대상** (Target)
- **설명** (Description)

## 🔧 공통 컴포넌트 표준

### 🎯 필터링 시스템
```typescript
// 표준 필터 옵션
interface FilterOptions {
  team: '전체' | '개발팀' | '디자인팀' | '기획팀' | '마케팅팀';
  status: '전체' | '대기' | '진행' | '완료' | '홀딩';
  assignee: string;
  dateRange?: { start: string; end: string; };
}
```

### 🎨 상태 배지 (Status Badge)
```typescript
// 표준 상태 배지 스타일
const statusBadgeStyle = {
  대기: { backgroundColor: '#6E6E75', color: '#fff' },
  진행: { backgroundColor: '#3DA9FF', color: '#fff' },
  완료: { backgroundColor: '#D6F231', color: '#333' },
  홀딩: { backgroundColor: '#F44336', color: '#fff' }
}
```

## 📱 반응형 디자인 기준

### 📏 브레이크포인트
- **Mobile**: `< 768px`
- **Tablet**: `768px - 1024px` 
- **Desktop**: `> 1024px`

### 🎨 반응형 그리드
```typescript
// 표준 그리드 시스템
<Grid container spacing={3}>
  <Grid item xs={12} md={6}>     // 모바일: 전체, 데스크톱: 절반
  <Grid item xs={12} md={4}>     // 모바일: 전체, 데스크톱: 1/3
  <Grid item xs={6} md={3}>      // 모바일: 절반, 데스크톱: 1/4
</Grid>
```

## 🚀 성능 최적화 가이드

### ⚡ 데이터 처리
```typescript
// 대용량 데이터 처리 표준
const optimizedData = useMemo(() => {
  return filteredData.slice(0, 100); // 페이징 처리
}, [filteredData]);
```

### 🔄 상태 관리
```typescript
// 표준 상태 관리 패턴
const [tasks, setTasks] = useState<TaskData[]>([]);
const [filters, setFilters] = useState<FilterOptions>(defaultFilters);
const [loading, setLoading] = useState(false);
```

## 🎯 접근성 (Accessibility) 표준

### ♿ ARIA 라벨
```typescript
// 표준 접근성 속성
<button
  aria-label="업무 수정"
  aria-describedby="task-description"
  tabIndex={0}
>
```

### ⌨️ 키보드 네비게이션
- **Tab**: 다음 요소로 이동
- **Enter/Space**: 액션 실행
- **Escape**: 모달/메뉴 닫기

## 📋 체크리스트

새로운 페이지 개발 시 다음 항목을 확인하세요:

### ✅ 디자인 일관성
- [ ] 색상 팔레트 준수
- [ ] 간격 시스템 적용
- [ ] 타이포그래피 일관성
- [ ] 컴포넌트 재사용

### ✅ 기능성
- [ ] 필터링 시스템 구현
- [ ] 반응형 디자인 적용
- [ ] 로딩 상태 처리
- [ ] 에러 처리

### ✅ 성능
- [ ] 데이터 최적화
- [ ] 메모이제이션 적용
- [ ] 번들 크기 최적화

### ✅ 접근성
- [ ] ARIA 라벨 추가
- [ ] 키보드 네비게이션
- [ ] 스크린 리더 지원

---

## 📞 문의사항

업무관리 페이지 표준에 대한 문의사항이나 개선 제안은 개발팀으로 연락바랍니다.

**마지막 업데이트**: 2025년 8월 14일  
**버전**: 1.0.0  
**작성자**: Claude Code Assistant

---

*이 문서는 업무관리 페이지의 성공적인 구현을 바탕으로 작성되었으며, 모든 신규 페이지 개발의 기준이 됩니다.*