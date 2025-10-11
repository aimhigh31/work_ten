# 에러 기록 및 방지대책

## 2025-09-15: ReferenceError: supabaseConfig is not defined

### 에러 내용
```
ReferenceError: supabaseConfig is not defined
    at deleteMenu (webpack-internal:///(app-pages-browser)/./src/hooks/useSupabaseMenuManagement.ts:462:13)
    at handleDeleteSelected (webpack-internal:///(app-pages-browser)/./src/components/SystemMenuPermissionsTable.tsx:222:43)
```

### 원인
`useSupabaseMenuManagement.ts` 파일에서 `supabaseConfig` 변수명을 사용했으나, 실제로는 `isSupabaseConfigured` 변수가 정의되어 있었음.

### 수정 방법
```typescript
// 잘못된 코드
if (!supabaseConfig.configured) {

// 올바른 코드
if (!isSupabaseConfigured) {
```

### 방지대책
1. **변수명 일치 확인**: 함수 내에서 사용하는 변수명이 실제 정의된 변수명과 일치하는지 확인
2. **상단 변수 선언부 확인**: 파일 상단의 변수 선언 부분을 먼저 확인하고 개발
3. **TypeScript 타입 체크**: 개발 시 TypeScript 에러를 주의 깊게 확인
4. **코드 리뷰**: 변수명 변경 시 파일 전체에서 일관성 있게 적용되었는지 확인

### 관련 파일
- `src/hooks/useSupabaseMenuManagement.ts` (라인 499)

### 해결 상태
✅ 해결 완료 (2025-09-15)

---