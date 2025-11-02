const { Client } = require('pg');
const fs = require('fs');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;

if (!supabaseUrl) {
  console.error('❌ NEXT_PUBLIC_SUPABASE_URL 환경 변수가 설정되지 않았습니다!');
  process.exit(1);
}

// Supabase URL에서 호스트 추출
const url = new URL(supabaseUrl);
const projectRef = url.hostname.split('.')[0];

// PostgreSQL 연결 설정
const client = new Client({
  host: `db.${projectRef}.supabase.co`,
  port: 5432,
  database: 'postgres',
  user: 'postgres',
  password: process.env.SUPABASE_DB_PASSWORD || 'your-database-password',
  ssl: { rejectUnauthorized: false }
});

async function runSQL() {
  try {
    console.log('🚀 PostgreSQL 연결 시작...\n');
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공!\n');

    // SQL 파일 읽기
    const sql = fs.readFileSync('add-checklist-columns-to-evaluation.sql', 'utf8');

    console.log('📝 실행할 SQL:\n');
    console.log(sql);
    console.log('\n' + '='.repeat(80) + '\n');

    // SQL 실행
    const result = await client.query(sql);

    console.log('✅ SQL 실행 성공!');

    if (result.rows && result.rows.length > 0) {
      console.log('\n📊 추가된 컬럼 목록:');
      console.table(result.rows);
    } else {
      console.log('결과:', result);
    }

  } catch (err) {
    console.error('❌ 실행 중 오류 발생:', err.message);
    console.error('상세:', err);
    process.exit(1);
  } finally {
    await client.end();
    console.log('\n✅ PostgreSQL 연결 종료');
  }
}

runSQL();
