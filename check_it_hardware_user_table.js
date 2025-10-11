const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkHardwareUserTable() {
  console.log('🔍 it_hardware_user 테이블 구조 및 데이터 확인...');

  try {
    // 1. 테이블 데이터 조회 시도
    console.log('\n1. 테이블 데이터 조회 시도:');
    const { data, error } = await supabase
      .from('it_hardware_user')
      .select('*')
      .limit(5);

    if (error) {
      console.error('❌ 데이터 조회 실패:', error);
      console.error('❌ 에러 상세:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code
      });
    } else {
      console.log('✅ 데이터 조회 성공:', data?.length || 0, '개');
      console.log('📄 샘플 데이터:', data);
    }

    // 2. 새 데이터 삽입 시도
    console.log('\n2. 새 데이터 삽입 시도:');
    const testData = {
      hardware_id: 999,
      user_name: '테스트사용자',
      department: '테스트부서',
      start_date: new Date().toISOString().split('T')[0],
      reason: '테스트',
      status: 'active',
      registration_date: new Date().toISOString().split('T')[0],
      created_by: 'system',
      updated_by: 'system',
      is_active: true
    };

    console.log('📝 삽입할 데이터:', testData);

    const { data: insertData, error: insertError } = await supabase
      .from('it_hardware_user')
      .insert([testData])
      .select()
      .single();

    if (insertError) {
      console.error('❌ 데이터 삽입 실패:', insertError);
      console.error('❌ 에러 상세:', {
        message: insertError.message,
        details: insertError.details,
        hint: insertError.hint,
        code: insertError.code
      });
    } else {
      console.log('✅ 데이터 삽입 성공:', insertData);

      // 테스트 데이터 삭제
      await supabase
        .from('it_hardware_user')
        .delete()
        .eq('id', insertData.id);
      console.log('🗑️ 테스트 데이터 삭제 완료');
    }

    // 3. PostgreSQL로 테이블 구조 확인
    console.log('\n3. PostgreSQL 테이블 구조 확인:');
    const { Pool } = require('pg');

    const pool = new Pool({
      connectionString: process.env.DATABASE_URL || `postgresql://postgres:${process.env.DB_PASSWORD}@${process.env.DB_HOST}:5432/postgres`,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
    });

    const tableInfoQuery = `
      SELECT
        column_name,
        data_type,
        is_nullable,
        column_default
      FROM information_schema.columns
      WHERE table_name = 'it_hardware_user'
      AND table_schema = 'public'
      ORDER BY ordinal_position;
    `;

    const result = await pool.query(tableInfoQuery);
    console.log('📊 테이블 구조:');
    console.table(result.rows);

    await pool.end();

  } catch (error) {
    console.error('💥 전체 확인 실패:', error);
  }
}

// 실행
checkHardwareUserTable()
  .then(() => {
    console.log('\n🎉 테이블 확인 완료');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 실행 실패:', error);
    process.exit(1);
  });