const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// SQL을 개별 명령어로 분리하는 함수
function splitSQLStatements(sql) {
  // 주석 제거
  let cleanSQL = sql.replace(/--.*$/gm, '');
  
  // 세미콜론으로 분리하되, 문자열 내부의 세미콜론은 무시
  const statements = [];
  let current = '';
  let inString = false;
  let stringChar = null;
  
  for (let i = 0; i < cleanSQL.length; i++) {
    const char = cleanSQL[i];
    const prevChar = i > 0 ? cleanSQL[i-1] : null;
    
    if (!inString && (char === "'" || char === '"')) {
      inString = true;
      stringChar = char;
    } else if (inString && char === stringChar && prevChar !== '\\') {
      inString = false;
      stringChar = null;
    }
    
    if (!inString && char === ';') {
      const statement = current.trim();
      if (statement) {
        statements.push(statement);
      }
      current = '';
    } else {
      current += char;
    }
  }
  
  // 마지막 명령어 추가
  const lastStatement = current.trim();
  if (lastStatement) {
    statements.push(lastStatement);
  }
  
  return statements.filter(s => s && s.length > 0);
}

async function executeStatements(statements, stepName) {
  console.log(`\n=== ${stepName} ===`);
  console.log(`총 ${statements.length}개의 SQL 문 실행`);
  
  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    const shortDesc = statement.substring(0, 60).replace(/\s+/g, ' ') + '...';
    
    console.log(`[${i+1}/${statements.length}] ${shortDesc}`);
    
    try {
      // 다양한 방법으로 시도
      let result;
      
      if (statement.toUpperCase().includes('CREATE EXTENSION')) {
        // 확장은 이미 설치되어 있을 수 있으므로 건너뛰기
        console.log('  ⏩ 확장 설치 건너뛰기 (이미 설치되어 있을 수 있음)');
        continue;
      } else if (statement.toUpperCase().includes('CREATE TABLE')) {
        // 테이블 생성
        result = await supabase.rpc('exec', { query: statement });
      } else if (statement.toUpperCase().includes('CREATE INDEX')) {
        // 인덱스 생성
        result = await supabase.rpc('exec', { query: statement });
      } else if (statement.toUpperCase().includes('CREATE POLICY')) {
        // 정책 생성
        result = await supabase.rpc('exec', { query: statement });
      } else if (statement.toUpperCase().includes('ALTER TABLE')) {
        // 테이블 변경
        result = await supabase.rpc('exec', { query: statement });
      } else {
        // 기타 명령어
        result = await supabase.rpc('exec', { query: statement });
      }
      
      if (result && result.error) {
        console.log(`  ⚠️  오류 (계속 진행): ${result.error.message}`);
      } else {
        console.log('  ✅ 성공');
      }
    } catch (error) {
      console.log(`  ⚠️  오류 (계속 진행): ${error.message}`);
    }
  }
}

async function main() {
  console.log('🚀 Supabase 데이터베이스 스키마 생성');
  console.log(`📍 URL: ${supabaseUrl}`);
  
  const files = [
    { path: 'sql-for-dashboard/01-extensions-and-basic-tables.sql', name: '1단계: 기본 확장 및 핵심 테이블' },
    { path: 'sql-for-dashboard/02-cost-management-tables.sql', name: '2단계: 비용관리 모듈 테이블' },
    { path: 'sql-for-dashboard/03-task-education-tables.sql', name: '3단계: 업무관리 및 교육관리 테이블' }
  ];
  
  for (const file of files) {
    const sqlContent = fs.readFileSync(file.path, 'utf8');
    const statements = splitSQLStatements(sqlContent);
    await executeStatements(statements, file.name);
  }
  
  console.log('\n🎉 모든 단계 완료!');
  console.log('📊 Supabase Dashboard에서 결과를 확인해보세요.');
}

main().catch(console.error);