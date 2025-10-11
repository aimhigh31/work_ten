const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function refreshSchemaCache() {
  console.log('🔄 Supabase 스키마 캐시 새로고침...');

  try {
    // 1. 테이블 존재 확인
    console.log('📝 테이블 존재 확인...');
    const { data: tableExists, error: tableError } = await supabase.rpc('exec', {
      sql: `
        SELECT table_name, table_schema
        FROM information_schema.tables
        WHERE table_schema = 'public'
        AND table_name = 'it_hardware_data';
      `
    });

    if (tableError) {
      console.error('❌ 테이블 확인 실패:', tableError);
    } else {
      console.log('📋 테이블 확인 결과:', tableExists);
    }

    // 2. 권한 확인 및 설정
    console.log('📝 테이블 권한 설정...');
    const { data: grantData, error: grantError } = await supabase.rpc('exec', {
      sql: `
        GRANT ALL ON it_hardware_data TO authenticated;
        GRANT ALL ON it_hardware_data TO anon;
        GRANT ALL ON it_hardware_data TO service_role;
      `
    });

    if (grantError) {
      console.error('❌ 권한 설정 실패:', grantError);
    } else {
      console.log('✅ 권한 설정 완료');
    }

    // 3. RLS 정책 설정 (필요한 경우)
    console.log('📝 RLS 정책 설정...');
    const { data: rlsData, error: rlsError } = await supabase.rpc('exec', {
      sql: `
        ALTER TABLE it_hardware_data ENABLE ROW LEVEL SECURITY;

        -- 인증된 사용자는 모든 작업 가능
        CREATE POLICY "authenticated_all_access" ON it_hardware_data
        FOR ALL TO authenticated USING (true) WITH CHECK (true);

        -- 익명 사용자는 읽기만 가능
        CREATE POLICY "anon_select_access" ON it_hardware_data
        FOR SELECT TO anon USING (true);
      `
    });

    if (rlsError && !rlsError.message.includes('already exists')) {
      console.error('❌ RLS 정책 설정 실패:', rlsError);
    } else {
      console.log('✅ RLS 정책 설정 완료');
    }

    // 4. 스키마 캐시 수동 새로고침 시도
    console.log('📝 스키마 캐시 새로고침 시도...');

    // PostgREST 스키마 캐시 새로고침 (admin API 호출)
    const response = await fetch(`${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`, {
      method: 'POST',
      headers: {
        'apikey': process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        'Authorization': `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        'Content-Type': 'application/json',
        'Prefer': 'schema-reload'
      }
    });

    console.log('🔄 스키마 새로고침 요청 상태:', response.status);

    console.log('🎉 스키마 캐시 새로고침 완료!');

  } catch (error) {
    console.error('❌ 스키마 캐시 새로고침 실패:', error);
  }
}

refreshSchemaCache();