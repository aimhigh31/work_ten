const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

// Supabase URL에서 데이터베이스 정보 추출
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const dbId = supabaseUrl.split('.')[0].replace('https://', '');

// PostgreSQL 직접 연결 설정
const client = new Client({
  host: 'aws-0-ap-northeast-2.pooler.supabase.com',
  port: 6543,
  user: 'postgres.zvcjffkxgqjhpbwdvdja',
  password: 'nexwork123!@#',
  database: 'postgres',
  ssl: { rejectUnauthorized: false }
});

async function checkTable() {
  try {
    console.log('📡 데이터베이스 연결 중...');
    await client.connect();
    console.log('✅ 데이터베이스 연결 성공');

    // 테이블 존재 확인
    const tableExists = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'it_software_user'
      );
    `);

    console.log('\n📋 테이블 존재 여부:', tableExists.rows[0].exists ? '✅ 존재함' : '❌ 존재하지 않음');

    if (tableExists.rows[0].exists) {
      // 테이블 구조 확인
      const structure = await client.query(`
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'it_software_user'
        ORDER BY ordinal_position;
      `);

      console.log('\n📊 테이블 구조:');
      console.log('====================================');
      structure.rows.forEach(col => {
        console.log(`  ${col.column_name.padEnd(20)} ${col.data_type.padEnd(20)} ${col.is_nullable === 'NO' ? 'NOT NULL' : 'NULL    '} ${col.column_default ? `DEFAULT: ${col.column_default}` : ''}`);
      });
      console.log('====================================');

      // 데이터 개수 확인
      const countResult = await client.query('SELECT COUNT(*) as total, COUNT(CASE WHEN is_active = true THEN 1 END) as active FROM public.it_software_user;');
      console.log('\n📈 데이터 통계:');
      console.log(`  총 데이터: ${countResult.rows[0].total}개`);
      console.log(`  활성 데이터: ${countResult.rows[0].active}개`);

      // 샘플 데이터 확인
      const sampleData = await client.query(`
        SELECT id, software_id, user_name, department, usage_status, start_date
        FROM public.it_software_user
        WHERE is_active = true
        LIMIT 5;
      `);

      if (sampleData.rows.length > 0) {
        console.log('\n📝 샘플 데이터 (최대 5개):');
        console.log('====================================');
        sampleData.rows.forEach(row => {
          console.log(`  ID: ${row.id}, 소프트웨어ID: ${row.software_id}, 사용자: ${row.user_name}, 부서: ${row.department || '-'}, 상태: ${row.usage_status}`);
        });
        console.log('====================================');
      }

      // 인덱스 확인
      const indexes = await client.query(`
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE schemaname = 'public'
        AND tablename = 'it_software_user';
      `);

      console.log('\n🔍 인덱스 목록:');
      console.log('====================================');
      indexes.rows.forEach(idx => {
        console.log(`  ${idx.indexname}`);
      });
      console.log('====================================');

      // RLS 정책 확인
      const policies = await client.query(`
        SELECT polname, polcmd
        FROM pg_policies
        WHERE schemaname = 'public'
        AND tablename = 'it_software_user';
      `);

      console.log('\n🔐 RLS 정책:');
      console.log('====================================');
      if (policies.rows.length > 0) {
        policies.rows.forEach(pol => {
          console.log(`  ${pol.polname}: ${pol.polcmd}`);
        });
      } else {
        console.log('  RLS 정책 없음');
      }
      console.log('====================================');
    }

    console.log('\n✅ 테이블 확인 완료!');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error('상세 정보:', error);
  } finally {
    await client.end();
    console.log('\n🔚 데이터베이스 연결 종료');
  }
}

// 스크립트 실행
checkTable();