const { Client } = require('pg');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://gxmsndewfmjuvfkqtxhz.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imd4bXNuZGV3Zm1qdXZma3F0eGh6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MjcxNTcwMDgsImV4cCI6MjA0MjczMzAwOH0.cawv0nL0LkRHxHL0vgtNiLivcSR2l0u0u3b4VF5VhEg';

const host = supabaseUrl.replace('https://', '').replace('.supabase.co', '').split('.')[0];
const connectionString = `postgresql://postgres.${host}:JQ8pPaDSzhh69YCY@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres`;

const client = new Client({ connectionString });

async function checkTableStructure() {
  try {
    await client.connect();
    console.log('✅ PostgreSQL 연결 성공\n');

    // 테이블 구조 확인
    const result = await client.query(`
      SELECT
        column_name,
        data_type,
        character_maximum_length,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'main_education_data'
        AND column_name = 'id'
      ORDER BY ordinal_position;
    `);

    console.log('📋 main_education_data 테이블 id 컬럼 정보:');
    console.table(result.rows);

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
  } finally {
    await client.end();
    console.log('\n✅ PostgreSQL 연결 종료');
  }
}

checkTableStructure();
