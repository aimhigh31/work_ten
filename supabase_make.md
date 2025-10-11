# Supabase 테이블 생성 가이드

## 📋 개요
Supabase에서 직접 테이블을 생성하는 방법과 실패 사례를 정리한 문서입니다.

## ⚠️ 실패한 방법들

### 1. Supabase Client API (실패)
```javascript
// ❌ 작동하지 않음
const { data, error } = await supabase.rpc('sql', { query: 'CREATE TABLE...' });
const { data, error } = await supabase.rpc('exec_sql', { sql: '...' });
const { data, error } = await supabase.rpc('execute', { sql: '...' });
```
**실패 이유**: PostgREST에서 DDL 작업 차단, RPC 함수 기본 제공 안 됨

### 2. REST API 직접 호출 (실패)
```javascript
// ❌ 작동하지 않음
const response = await fetch(`${supabaseUrl}/rest/v1/rpc/execute_sql`, {
  method: 'POST',
  headers: {
    'apikey': supabaseServiceKey,
    'Authorization': `Bearer ${supabaseServiceKey}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({ sql: sqlQuery })
});
```
**실패 이유**: 403/404 오류, 해당 RPC 함수 존재하지 않음

### 3. Supabase CLI Migration (실패)
```bash
# ❌ 작동하지 않음
npx supabase db push
npx supabase migration new create_table
```
**실패 이유**:
- 기존 스키마와 충돌
- Docker 포트 문제 (54320 포트 사용 불가)
- 로컬 환경 설정 복잡

### 4. Edge Function (시도하지 않음)
```javascript
// 이론적으로 가능하지만 복잡
import { Client } from 'https://deno.land/x/postgres/mod.ts'
```
**문제점**: Edge Function 생성 및 배포 과정이 복잡

## ✅ 성공한 방법: PostgreSQL 직접 연결

### 핵심 아이디어
**Supabase = PostgreSQL + API 레이어**
- API 레이어의 제약을 우회
- PostgreSQL에 직접 연결하여 완전한 관리자 권한 활용

### 1. 필요한 패키지 설치
```bash
npm install pg
```

### 2. 환경변수 확인
```javascript
// .env.local에서 확인
DATABASE_URL=postgresql://postgres:password@db.projectref.supabase.co:5432/postgres
```

### 3. 성공한 코드
```javascript
const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function createTableDirect() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }  // Supabase SSL 필수
  });

  try {
    console.log('🔗 PostgreSQL 연결 중...');
    await client.connect();
    console.log('✅ 연결 성공!');

    const sql = `
      CREATE TABLE IF NOT EXISTS your_table_name (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    console.log('🏗️ 테이블 생성 중...');
    await client.query(sql);
    console.log('✅ 테이블 생성 완료!');

    // 인덱스 생성 (옵션)
    await client.query('CREATE INDEX IF NOT EXISTS idx_your_table_email ON your_table_name(email);');

    // 샘플 데이터 삽입 (옵션)
    const insertSql = `
      INSERT INTO your_table_name (name, email) VALUES
      ('테스트 사용자1', 'test1@example.com'),
      ('테스트 사용자2', 'test2@example.com')
      ON CONFLICT (email) DO NOTHING;
    `;

    await client.query(insertSql);
    console.log('📝 샘플 데이터 삽입 완료!');

    // 데이터 확인
    const result = await client.query('SELECT COUNT(*) FROM your_table_name');
    console.log(`📊 총 데이터 수: ${result.rows[0].count}개`);

  } catch (error) {
    console.error('❌ 오류:', error.message);
  } finally {
    await client.end();
  }
}

createTableDirect();
```

### 4. 실행 및 확인
```bash
# 스크립트 실행
node create-table-script.js

# Supabase API로 확인
node test-table-script.js
```

## 🔑 성공 요인 분석

### 1. DATABASE_URL 구성 요소
```
postgresql://postgres:password@db.projectref.supabase.co:5432/postgres
           │       │        │                            │     │
           └─ 사용자  └─ 비밀번호  └─ 호스트                   └─포트  └─DB명
```

### 2. 권한 차이
```
Supabase API → PostgREST → PostgreSQL (제한된 권한)
직접 연결   → PostgreSQL (관리자 권한)
```

### 3. 가능한 작업들
```sql
-- 모든 DDL 작업 가능
CREATE TABLE, DROP TABLE, ALTER TABLE
CREATE INDEX, DROP INDEX
CREATE TRIGGER, CREATE FUNCTION
-- 등등
```

## 📝 실제 사용 예시 (보안사고관리)

### 테이블 생성
```sql
CREATE TABLE IF NOT EXISTS security_accident_data (
  id SERIAL PRIMARY KEY,
  no INTEGER,
  registration_date DATE NOT NULL DEFAULT CURRENT_DATE,
  code VARCHAR(50) UNIQUE NOT NULL,
  incident_type VARCHAR(50) NOT NULL,
  request_content TEXT,
  main_content TEXT NOT NULL,
  response_action TEXT,
  severity VARCHAR(10) NOT NULL DEFAULT '중간',
  status VARCHAR(10) NOT NULL DEFAULT '대기',
  assignee VARCHAR(100),
  team VARCHAR(50),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
```

### 인덱스 생성
```sql
CREATE INDEX IF NOT EXISTS idx_security_accident_code ON security_accident_data(code);
CREATE INDEX IF NOT EXISTS idx_security_accident_status ON security_accident_data(status);
```

### 한국어 데이터 삽입
```sql
INSERT INTO security_accident_data (
  no, code, incident_type, main_content, response_action,
  severity, status, assignee, team
) VALUES
(1, 'SECACC-25-001', '악성코드', '직원 PC에서 악성코드 감염 발견', '백신 프로그램으로 격리 처리', '높음', '완료', '김철수', '보안팀');
```

## 🛡️ 보안 고려사항

### 1. 환경변수 보호
```javascript
// .env.local (커밋하지 말 것!)
DATABASE_URL=postgresql://postgres:password@...

// .gitignore에 추가
.env.local
.env
```

### 2. SSL 연결 필수
```javascript
const client = new Client({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }  // Supabase 필수
});
```

### 3. 연결 종료 필수
```javascript
try {
  await client.connect();
  // 작업 수행
} finally {
  await client.end();  // 반드시 연결 종료
}
```

## 🎯 베스트 프랙티스

### 1. 스크립트 구성
```javascript
// create-table.js
async function createTable() {
  // 테이블 생성 로직
}

// test-table.js
async function testTable() {
  // Supabase API로 테이블 동작 확인
}
```

### 2. 에러 처리
```javascript
try {
  await client.query(sql);
  console.log('✅ 성공');
} catch (error) {
  if (error.code === '42P07') {
    console.log('⚠️ 테이블이 이미 존재');
  } else {
    console.error('❌ 오류:', error.message);
  }
}
```

### 3. 트랜잭션 사용 (복잡한 경우)
```javascript
await client.query('BEGIN');
try {
  await client.query('CREATE TABLE...');
  await client.query('CREATE INDEX...');
  await client.query('INSERT INTO...');
  await client.query('COMMIT');
} catch (error) {
  await client.query('ROLLBACK');
  throw error;
}
```

## 🚀 CLI 인증 과정 (참고)

### 1. Access Token 생성
1. https://app.supabase.com 접속
2. 프로필 → Account Settings
3. Access Tokens → Generate new token
4. 토큰 복사

### 2. CLI 로그인
```bash
npx supabase login --token your_access_token
npx supabase link --project-ref your_project_ref
```

### 3. 프로젝트 정보 확인
```bash
npx supabase status
```

## 📚 추가 참고자료

- [Supabase PostgreSQL Documentation](https://supabase.com/docs/guides/database)
- [PostgreSQL CREATE TABLE](https://www.postgresql.org/docs/current/sql-createtable.html)
- [node-postgres Documentation](https://node-postgres.com/)

## ⚡ 요약

**Supabase 테이블 생성 시 문제가 발생하면:**

1. ❌ Supabase API로는 테이블 생성 불가
2. ❌ CLI Migration은 환경 설정 복잡
3. ✅ **PostgreSQL 직접 연결이 가장 확실한 방법**
4. 🔑 **DATABASE_URL + pg 라이브러리 사용**
5. ⚠️ **SSL 연결 필수, 환경변수 보안 주의**

**이 방법으로 99% 성공할 수 있습니다!** 🎉