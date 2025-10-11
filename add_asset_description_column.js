const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  console.error('❌ 환경변수가 설정되지 않았습니다.');
  console.error('NEXT_PUBLIC_SUPABASE_URL:', !!supabaseUrl);
  console.error('SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceRoleKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

async function addAssetDescriptionColumn() {
  try {
    console.log('🔄 it_hardware_data 테이블에 asset_description 컬럼 추가 중...');

    // SQL로 컬럼 추가
    const { data, error } = await supabase.rpc('exec_sql', {
      sql_query: `
        ALTER TABLE it_hardware_data
        ADD COLUMN IF NOT EXISTS asset_description TEXT;
      `
    });

    if (error) {
      console.error('❌ 컬럼 추가 실패:', error);

      // RPC 함수가 없는 경우 직접 SQL 실행
      console.log('⚠️ RPC 방식 실패. PostgreSQL 직접 연결 시도...');

      const { Client } = require('pg');
      const client = new Client({
        connectionString: process.env.DATABASE_URL || `${supabaseUrl.replace('https://', 'postgresql://postgres:')}${process.env.SUPABASE_DB_PASSWORD}@db.${supabaseUrl.split('//')[1].split('.')[0]}.supabase.co:5432/postgres`
      });

      await client.connect();

      const result = await client.query(`
        ALTER TABLE it_hardware_data
        ADD COLUMN IF NOT EXISTS asset_description TEXT;
      `);

      console.log('✅ asset_description 컬럼 추가 성공 (PostgreSQL 직접 연결)');
      console.log('📊 결과:', result);

      await client.end();
      return;
    }

    console.log('✅ asset_description 컬럼 추가 성공');
    console.log('📊 결과:', data);

  } catch (error) {
    console.error('❌ 오류 발생:', error);
    throw error;
  }
}

addAssetDescriptionColumn()
  .then(() => {
    console.log('✅ 작업 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ 작업 실패:', error);
    process.exit(1);
  });
