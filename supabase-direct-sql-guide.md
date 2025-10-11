# Supabase SQL Editor 직접 접근 방법

## 방법 1: Supabase CLI 사용

### 설치 및 설정
```bash
# Supabase CLI 설치
npm install -g supabase

# 프로젝트 링크
supabase link --project-ref exxumujwufzqnovhzvif

# 로그인
supabase login
```

### SQL 파일 직접 실행
```bash
# SQL 파일 실행
supabase db reset --db-url "postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres"

# 또는 마이그레이션으로 실행
supabase db diff --schema public
supabase db push
```

## 방법 2: PostgreSQL 클라이언트 도구 사용

### psql 명령어 (Windows에서 설치 필요)
```bash
# psql 직접 연결
psql "postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres"

# SQL 파일 실행
\i create-admin-systemsetting-menu-table.sql
```

### pgAdmin 또는 DBeaver 연결
- Host: db.exxumujwufzqnovhzvif.supabase.co
- Port: 5432
- Database: postgres
- Username: postgres  
- Password: tg1150ja5%

## 방법 3: Supabase Management API 사용

### API를 통한 SQL 실행
```javascript
// Management API 사용 (Service Role Key 필요)
const MANAGEMENT_API_URL = 'https://api.supabase.com/v1/projects/exxumujwufzqnovhzvif/database/query';
const SERVICE_ROLE_KEY = 'your-service-role-key';

const response = await fetch(MANAGEMENT_API_URL, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    query: 'CREATE TABLE ...'
  })
});
```

## 방법 4: Supabase Studio 웹 인터페이스

### 수동 접근
1. https://supabase.com/dashboard/project/exxumujwufzqnovhzvif 접속
2. SQL Editor 메뉴 클릭
3. SQL 코드 붙여넣기 및 실행

## 방법 5: Node.js에서 직접 PostgreSQL 연결

### pg 라이브러리 사용
```javascript
const { Client } = require('pg');

const client = new Client({
  connectionString: 'postgresql://postgres:tg1150ja5%25@db.exxumujwufzqnovhzvif.supabase.co:5432/postgres',
  ssl: { rejectUnauthorized: false }
});

async function executeSQLFile() {
  await client.connect();
  
  const fs = require('fs');
  const sql = fs.readFileSync('create-admin-systemsetting-menu-table.sql', 'utf8');
  
  try {
    const result = await client.query(sql);
    console.log('SQL 실행 성공:', result);
  } catch (error) {
    console.error('SQL 실행 오류:', error);
  } finally {
    await client.end();
  }
}
```

## 추천 방법

**가장 간단한 방법**: Supabase Studio 웹 인터페이스
- 브라우저에서 직접 접근 가능
- 즉시 실행 및 결과 확인 가능

**자동화가 필요한 경우**: Supabase CLI 또는 pg 라이브러리
- 스크립트로 자동 실행 가능
- CI/CD 파이프라인 통합 가능

## 현재 상황에 맞는 즉시 실행 가능한 방법

```bash
# 1. pg 패키지 설치
npm install pg

# 2. 아래 스크립트 실행
node execute-sql-direct.js
```