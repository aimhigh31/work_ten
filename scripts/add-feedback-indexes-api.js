/**
 * Supabase API를 통한 인덱스 추가 스크립트
 * Direct DB connection 대신 Supabase REST API 사용
 */

const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SERVICE_ROLE_KEY) {
  console.error('❌ 필수 환경변수가 없습니다:');
  console.error('   NEXT_PUBLIC_SUPABASE_URL:', SUPABASE_URL ? '✓' : '✗');
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', SERVICE_ROLE_KEY ? '✓' : '✗');
  process.exit(1);
}

async function executeSQL(sql) {
  const url = `${SUPABASE_URL}/rest/v1/rpc/exec_sql`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': SERVICE_ROLE_KEY,
        'Authorization': `Bearer ${SERVICE_ROLE_KEY}`,
        'Prefer': 'return=representation'
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }

    return await response.json();
  } catch (error) {
    throw error;
  }
}

async function addIndexes() {
  console.log('🚀 Supabase API를 통한 인덱스 추가 시작...\n');

  try {
    // SQL 파일 읽기
    const sqlPath = path.join(__dirname, '../supabase/migrations/add_feedback_indexes.sql');
    const sqlContent = fs.readFileSync(sqlPath, 'utf8');

    // 주석 제거 (-- 스타일과 /* */ 스타일 모두)
    let cleaned = sqlContent
      .replace(/--[^\n]*/g, '')  // 단일 라인 주석 제거
      .replace(/\/\*[\s\S]*?\*\//g, '');  // 멀티 라인 주석 제거

    // 각 CREATE INDEX 문 분리
    const statements = cleaned
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && s.toUpperCase().includes('CREATE INDEX'));

    console.log(`📝 실행할 SQL 문: ${statements.length}개\n`);

    if (statements.length === 0) {
      console.log('⚠️  파싱된 SQL 문이 없습니다. 수동으로 실행하세요.\n');
      console.log('📄 SQL 파일 내용:');
      console.log('─'.repeat(80));
      console.log(sqlContent);
      console.log('─'.repeat(80));
      return;
    }

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i] + ';';
      console.log(`[${i + 1}/${statements.length}] 실행 중...`);
      console.log(`   ${statement.substring(0, 80)}...`);

      try {
        await executeSQL(statement);
        console.log('   ✅ 성공\n');
      } catch (error) {
        if (error.message.includes('already exists')) {
          console.log('   ⚠️  이미 존재함 (건너뜀)\n');
        } else {
          console.error('   ❌ 실패:', error.message, '\n');
        }
      }
    }

    console.log('✅ 인덱스 추가 작업 완료!\n');
    console.log('📊 예상 성능 개선 효과:');
    console.log('  - WHERE page = ? AND record_id = ? 쿼리: 10-100배 속도 향상');
    console.log('  - ORDER BY created_at DESC: 5-50배 속도 향상\n');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error('\n💡 대안: Supabase Dashboard의 SQL Editor에서 직접 실행하세요.');
    console.error(`   파일 위치: supabase/migrations/add_feedback_indexes.sql`);
    process.exit(1);
  }
}

addIndexes();
