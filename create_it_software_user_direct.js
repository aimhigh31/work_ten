const { Client } = require('pg');
require('dotenv').config({ path: '.env.local' });

async function createSoftwareUserTableDirect() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }  // Supabase SSL 필수
  });

  try {
    console.log('🔗 PostgreSQL 직접 연결 중...');
    await client.connect();
    console.log('✅ 연결 성공!');

    // it_software_user 테이블 생성 SQL
    const createTableSql = `
      CREATE TABLE IF NOT EXISTS public.it_software_user (
        id bigserial PRIMARY KEY,
        software_id bigint NOT NULL,
        user_name text NOT NULL,
        department text,
        exclusive_id text,
        reason text,
        usage_status text DEFAULT '사용중',
        start_date date,
        end_date date,
        registration_date date DEFAULT CURRENT_DATE,
        created_by text DEFAULT 'user',
        updated_by text DEFAULT 'user',
        is_active boolean DEFAULT true,
        created_at timestamptz DEFAULT now(),
        updated_at timestamptz DEFAULT now()
      );
    `;

    console.log('🏗️ it_software_user 테이블 생성 중...');
    await client.query(createTableSql);
    console.log('✅ 테이블 생성 완료!');

    // 인덱스 생성 (성능 최적화)
    console.log('📊 인덱스 생성 중...');

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_it_software_user_software_id
      ON public.it_software_user(software_id);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_it_software_user_is_active
      ON public.it_software_user(is_active);
    `);

    await client.query(`
      CREATE INDEX IF NOT EXISTS idx_it_software_user_user_name
      ON public.it_software_user(user_name);
    `);

    console.log('✅ 인덱스 생성 완료!');

    // Row Level Security (RLS) 설정
    console.log('🔐 RLS 정책 설정 중...');

    await client.query(`
      ALTER TABLE public.it_software_user ENABLE ROW LEVEL SECURITY;
    `);

    await client.query(`
      CREATE POLICY "Enable all operations for authenticated users"
      ON public.it_software_user
      FOR ALL USING (true);
    `);

    console.log('✅ RLS 정책 설정 완료!');

    // 외래키 제약 조건 (it_software_data 테이블과 연결)
    try {
      console.log('🔗 외래키 제약 조건 설정 중...');
      await client.query(`
        ALTER TABLE public.it_software_user
        ADD CONSTRAINT it_software_user_software_id_fkey
        FOREIGN KEY (software_id) REFERENCES public.it_software_data(id) ON DELETE CASCADE;
      `);
      console.log('✅ 외래키 제약 조건 설정 완료!');
    } catch (fkError) {
      console.log('⚠️ 외래키 제약 조건 설정 건너뜀 (it_software_data 테이블 확인 필요)');
      console.log('   에러:', fkError.message);
    }

    // 샘플 데이터 삽입 (테스트용)
    try {
      console.log('📝 샘플 데이터 삽입 중...');
      const insertSampleSql = `
        INSERT INTO public.it_software_user (
          software_id, user_name, department, exclusive_id, reason, usage_status,
          start_date, end_date, registration_date, created_by, updated_by, is_active
        ) VALUES
        (1, '김테스트', 'IT팀', 'SW001-KIM', '테스트 사용자', '사용중',
         '2025-01-01', '2025-12-31', CURRENT_DATE, 'system', 'system', true),
        (1, '이샘플', '개발팀', 'SW001-LEE', '샘플 데이터', '사용중',
         '2025-01-01', null, CURRENT_DATE, 'system', 'system', true)
        ON CONFLICT DO NOTHING;
      `;

      await client.query(insertSampleSql);
      console.log('✅ 샘플 데이터 삽입 완료!');
    } catch (insertError) {
      console.log('⚠️ 샘플 데이터 삽입 실패 (외래키 문제일 수 있음)');
      console.log('   에러:', insertError.message);
    }

    // 테이블 확인
    console.log('🔍 테이블 구조 확인 중...');
    const tableInfoResult = await client.query(`
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'it_software_user'
        AND table_schema = 'public'
      ORDER BY ordinal_position;
    `);

    console.log('📋 테이블 구조:');
    tableInfoResult.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : ''} ${row.column_default ? `DEFAULT ${row.column_default}` : ''}`);
    });

    // 데이터 수 확인
    const countResult = await client.query('SELECT COUNT(*) FROM public.it_software_user');
    console.log(`📊 총 데이터 수: ${countResult.rows[0].count}개`);

    console.log('');
    console.log('🎉 it_software_user 테이블 생성 및 설정 완료!');
    console.log('✅ 소프트웨어관리 페이지의 사용자이력탭이 DB와 연동됩니다!');

  } catch (error) {
    console.error('❌ 오류 발생:', error.message);
    console.error('상세 오류:', error);
  } finally {
    await client.end();
    console.log('🔌 데이터베이스 연결 종료');
  }
}

// 스크립트 실행
createSoftwareUserTableDirect();