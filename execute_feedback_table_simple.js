const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

async function createFeedbackTable() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL
  });

  try {
    console.log('🔌 PostgreSQL 연결 중...');
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공');

    // SQL 파일 읽기
    const sql = fs.readFileSync('create_common_feedback_table.sql', 'utf8');
    console.log('📖 SQL 파일 로드 완료');

    // SQL 실행
    console.log('⚡ SQL 실행 중...');
    await client.query(sql);
    console.log('✅ SQL 실행 완료');

    // 테이블 확인
    console.log('🔍 테이블 확인 중...');
    const checkResult = await client.query(`
      SELECT column_name, data_type
      FROM information_schema.columns
      WHERE table_name = 'common_feedback_data'
      ORDER BY ordinal_position;
    `);

    if (checkResult.rows.length > 0) {
      console.log('✅ common_feedback_data 테이블 생성 확인');
      console.log('📋 테이블 컬럼:');
      checkResult.rows.forEach(row => {
        console.log(`  - ${row.column_name}: ${row.data_type}`);
      });
    } else {
      console.log('❌ 테이블을 찾을 수 없습니다.');
    }

    // RLS 정책 확인
    const policyCheck = await client.query(`
      SELECT policyname, cmd
      FROM pg_policies
      WHERE tablename = 'common_feedback_data';
    `);

    console.log('\n🔒 RLS 정책:');
    if (policyCheck.rows.length > 0) {
      policyCheck.rows.forEach(row => {
        console.log(`  - ${row.policyname} (${row.cmd})`);
      });
    } else {
      console.log('  정책이 없습니다.');
    }

    // 인덱스 확인
    const indexCheck = await client.query(`
      SELECT indexname
      FROM pg_indexes
      WHERE tablename = 'common_feedback_data';
    `);

    console.log('\n📊 인덱스:');
    if (indexCheck.rows.length > 0) {
      indexCheck.rows.forEach(row => {
        console.log(`  - ${row.indexname}`);
      });
    }

    console.log('\n🎉 테이블 생성 완료!');

  } catch (error) {
    console.error('❌ 오류:', error.message);
    if (error.detail) console.error('상세:', error.detail);
  } finally {
    await client.end();
    console.log('🔌 PostgreSQL 연결 종료');
  }
}

createFeedbackTable();
