require('dotenv').config({ path: '.env.local' });

async function updateEvaluationConstraint() {
  const { Client } = require('pg');

  try {
    console.log('🔌 PostgreSQL 연결 중...');
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('✅ PostgreSQL 연결 성공!');

    // 1. 기존 제약조건 삭제
    console.log('🗑️ 기존 제약조건 삭제 중...');
    try {
      await client.query('ALTER TABLE admin_checklist_editor DROP CONSTRAINT IF EXISTS chk_evaluation');
      console.log('✅ 기존 제약조건 삭제 완료');
    } catch (err) {
      console.log('⚠️ 기존 제약조건이 없거나 삭제 실패:', err.message);
    }

    // 2. 새로운 제약조건 추가 (취소 추가)
    console.log('🔧 새로운 제약조건 추가 중...');
    const addConstraintSQL = `
      ALTER TABLE admin_checklist_editor
      ADD CONSTRAINT chk_evaluation
      CHECK (evaluation IN ('대기', '진행', '완료', '보류', '불가', '취소'))
    `;

    await client.query(addConstraintSQL);
    console.log('✅ 새로운 제약조건 추가 완료');

    // 3. 현재 제약조건 확인
    const checkResult = await client.query(`
      SELECT conname, pg_get_constraintdef(oid)
      FROM pg_constraint
      WHERE conname = 'chk_evaluation'
    `);

    console.log('📋 현재 제약조건:', checkResult.rows[0]);

    // 4. 기존 데이터 확인
    const dataResult = await client.query(`
      SELECT DISTINCT evaluation, COUNT(*) as count
      FROM admin_checklist_editor
      GROUP BY evaluation
      ORDER BY evaluation
    `);

    console.log('\n📊 현재 evaluation 값 분포:');
    dataResult.rows.forEach(row => {
      console.log(`  ${row.evaluation}: ${row.count}개`);
    });

    await client.end();
    console.log('\n🎉 제약조건 업데이트 완료!');

    // 테스트 데이터로 확인
    console.log('\n🧪 테스트 데이터 삽입 테스트...');
    await testNewConstraint();

  } catch (error) {
    console.error('💥 제약조건 업데이트 실패:', error.message);
  }
}

async function testNewConstraint() {
  const { createClient } = require('@supabase/supabase-js');

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.SUPABASE_SERVICE_ROLE_KEY
  );

  // 취소 상태로 테스트 데이터 삽입
  const testData = {
    checklist_id: 1,
    no: 999,
    major_category: '테스트',
    sub_category: '제약조건',
    title: '취소 상태 테스트',
    description: '취소 evaluation 값 테스트',
    evaluation: '취소',
    score: 0
  };

  const { data, error } = await supabase
    .from('admin_checklist_editor')
    .insert([testData])
    .select();

  if (error) {
    console.log('❌ 테스트 데이터 삽입 실패:', error.message);
  } else {
    console.log('✅ 테스트 데이터 삽입 성공:', data[0]);

    // 테스트 데이터 삭제
    const { error: deleteError } = await supabase
      .from('admin_checklist_editor')
      .delete()
      .eq('no', 999);

    if (!deleteError) {
      console.log('🗑️ 테스트 데이터 정리 완료');
    }
  }
}

updateEvaluationConstraint();