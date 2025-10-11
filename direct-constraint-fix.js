const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// PostgreSQL 직접 연결
const { Client } = require('pg');

async function fixConstraints() {
  const client = new Client({
    host: supabaseUrl.replace('https://', '').replace('.supabase.co', '.pooler.supabase.com'),
    port: 5432,
    database: 'postgres',
    user: 'postgres.cbzktvpbyzwquvjcqtbf',
    password: process.env.SUPABASE_DB_PASSWORD, // 데이터베이스 비밀번호가 필요합니다
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    await client.connect();
    console.log('🔗 PostgreSQL 연결 성공');

    // 1. 현재 제약조건 확인
    const constraintQuery = `
      SELECT conname, pg_get_constraintdef(c.oid) as definition
      FROM pg_constraint c
      JOIN pg_class t ON c.conrelid = t.oid
      WHERE t.relname = 'admin_checklist_data' AND contype = 'c';
    `;

    const constraintResult = await client.query(constraintQuery);
    console.log('📋 현재 제약조건들:');
    constraintResult.rows.forEach(row => {
      console.log(`- ${row.conname}: ${row.definition}`);
    });

    // 2. 팀 제약조건 제거
    console.log('\n🔧 팀 제약조건 제거 중...');
    await client.query('ALTER TABLE admin_checklist_data DROP CONSTRAINT IF EXISTS chk_team;');
    console.log('✅ 팀 제약조건 제거 완료');

    // 3. 상태 제약조건 재생성 (더 유연하게)
    console.log('\n🔧 상태 제약조건 수정 중...');
    await client.query('ALTER TABLE admin_checklist_data DROP CONSTRAINT IF EXISTS chk_status;');
    await client.query(`
      ALTER TABLE admin_checklist_data
      ADD CONSTRAINT chk_status_flexible
      CHECK (status IN ('대기', '진행', '완료', '홀딩') OR status IS NULL);
    `);
    console.log('✅ 상태 제약조건 수정 완료');

    // 4. 테이블 구조 확인
    const structureQuery = `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_name = 'admin_checklist_data'
      ORDER BY ordinal_position;
    `;

    const structureResult = await client.query(structureQuery);
    console.log('\n📊 테이블 구조:');
    structureResult.rows.forEach(row => {
      console.log(`- ${row.column_name}: ${row.data_type} (NULL: ${row.is_nullable})`);
    });

    console.log('\n🎉 제약조건 수정 완료!');

  } catch (error) {
    console.error('💥 오류 발생:', error.message);

    // 대안: Supabase REST API 사용
    console.log('\n🔄 대안 방법: 직접 데이터 테스트...');

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // 테스트 데이터 삽입 시도
    const testData = {
      no: 999,
      registration_date: new Date().toISOString().split('T')[0],
      code: 'TEST-999',
      department: 'GROUP006-SUB001',
      work_content: '테스트 체크리스트',
      description: '테스트용',
      status: '대기',
      team: '개발팀',
      assignee: 'USER001',
      progress: 0,
      created_by: 'test',
      updated_by: 'test',
      is_active: true
    };

    const { data, error: insertError } = await supabase
      .from('admin_checklist_data')
      .insert([testData])
      .select();

    if (insertError) {
      console.error('❌ 테스트 삽입 실패:', insertError);
    } else {
      console.log('✅ 테스트 삽입 성공:', data);

      // 테스트 데이터 삭제
      await supabase
        .from('admin_checklist_data')
        .delete()
        .eq('code', 'TEST-999');
      console.log('🗑️ 테스트 데이터 삭제 완료');
    }

  } finally {
    await client.end();
  }
}

fixConstraints();