# 🚨 캐시 클리어 필수!

## 문제 확인

✅ **DB**: 4명의 사용자 존재
- USER-25-015 (박스타)
- USER-25-014 (홍스타)
- USER-25-013 (System)
- USER-25-009 (안재식)

❌ **테이블**: 3명만 표시
- 홍스타
- System
- 안재식
- **박스타 누락!**

## 원인

**브라우저 localStorage 캐시**에 오래된 데이터(3명)가 저장되어 있습니다.

캐시 키: `nexwork_users_data`

## 해결 방법

### 방법 1: 브라우저 콘솔 명령어 (즉시 해결)

**F12 → Console 탭에서 실행:**

```javascript
localStorage.clear();
sessionStorage.clear();
location.reload(true);
```

### 방법 2: 개발자 도구에서 수동 삭제

1. F12 → Application 탭
2. Storage → Local Storage → http://localhost:3200
3. 우클릭 → Clear
4. F5 새로고침

### 방법 3: 하드 리프레시

- Windows: **Ctrl + Shift + R**
- Mac: **Cmd + Shift + R**

## 검증

캐시 클리어 후:
- 테이블에 **4명** 표시되어야 함
- 박스타가 맨 위에 표시되어야 함 (최신 등록 순)

---

**지금 바로 브라우저에서 위 명령어를 실행하세요!**
