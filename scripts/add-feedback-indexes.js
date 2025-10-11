/**
 * Phase 3-1: DB 인덱스 추가 스크립트
 * common_feedback_data 테이블에 성능 최적화를 위한 인덱스 추가
 *
 * 실행 방법: node scripts/add-feedback-indexes.js
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

// Supabase 연결 정보
const connectionString = process.env.SUPABASE_DB_URL || process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ 오류: SUPABASE_DB_URL 또는 DATABASE_URL 환경 변수가 설정되지 않았습니다.');
  console.log('💡 .env.local 파일에 다음 형식으로 설정하세요:');
  console.log('SUPABASE_DB_URL=postgresql://postgres:[password]@[host]:5432/postgres');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function addIndexes() {
  const client = await pool.connect();

  try {
    console.log('🚀 Phase 3-1: DB 인덱스 추가 시작...\n');

    // SQL 파일 읽기
    const sqlPath = path.join(__dirname, 'add-feedback-indexes.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    console.log('📝 실행할 SQL:');
    console.log('─'.repeat(80));
    console.log(sql);
    console.log('─'.repeat(80));
    console.log('');

    // 성능 측정 시작
    const startTime = performance.now();
    console.time('⏱️ 인덱스 추가 총 시간');

    // SQL 실행
    console.log('🔄 인덱스 추가 중...\n');
    const result = await client.query(sql);

    console.timeEnd('⏱️ 인덱스 추가 총 시간');
    const endTime = performance.now();
    console.log(`⏱️ 총 소요 시간: ${(endTime - startTime).toFixed(2)}ms\n`);

    // 결과 확인
    if (result[result.length - 1] && result[result.length - 1].rows) {
      console.log('✅ 인덱스 추가 완료! 현재 인덱스 목록:\n');
      console.table(result[result.length - 1].rows);
    } else {
      console.log('✅ 인덱스 추가 완료!\n');
    }

    // 성능 개선 예상 효과
    console.log('📊 예상 성능 개선 효과:');
    console.log('  - WHERE page = ? AND record_id = ? 쿼리: 10-100배 속도 향상');
    console.log('  - ORDER BY created_at DESC: 5-50배 속도 향상');
    console.log('  - 데이터가 많을수록 효과 증가\n');

    console.log('💡 주의사항:');
    console.log('  - 인덱스는 SELECT 성능을 향상시키지만 INSERT/UPDATE는 약간 느려질 수 있습니다');
    console.log('  - 하지만 피드백 시스템은 조회가 훨씬 많으므로 전체적으로 성능 향상됩니다\n');

  } catch (error) {
    console.error('❌ 인덱스 추가 실패:', error);
    console.error('상세:', error.message);
    if (error.stack) {
      console.error('스택:', error.stack);
    }
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

// 실행
addIndexes()
  .then(() => {
    console.log('✅ 스크립트 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 스크립트 실패:', error);
    process.exit(1);
  });
