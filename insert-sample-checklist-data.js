// PostgreSQL 직접 연결로 admin_checklist_editor 테이블에 샘플 데이터 추가
require('dotenv').config({ path: '.env.local' });

async function insertSampleEditorData() {
  const { Client } = require('pg');

  try {
    console.log('🔌 PostgreSQL 연결 중...');
    const client = new Client({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    await client.connect();
    console.log('✅ PostgreSQL 연결 성공!');

    // 기존 데이터 확인
    const existingResult = await client.query('SELECT COUNT(*) FROM admin_checklist_editor');
    console.log('📊 기존 데이터 개수:', existingResult.rows[0].count);

    if (parseInt(existingResult.rows[0].count) > 0) {
      console.log('📄 기존 데이터가 있습니다. 삭제 후 재삽입...');
      await client.query('DELETE FROM admin_checklist_editor');
      console.log('🗑️ 기존 데이터 삭제 완료');
    }

    // UNIQUE 제약조건 추가 (중복 방지)
    try {
      await client.query('ALTER TABLE admin_checklist_editor ADD CONSTRAINT uk_checklist_editor_checklist_no UNIQUE (checklist_id, no)');
      console.log('🔒 UNIQUE 제약조건 추가 완료');
    } catch (err) {
      if (err.message.includes('already exists')) {
        console.log('🔒 UNIQUE 제약조건이 이미 존재함');
      } else {
        console.log('⚠️ UNIQUE 제약조건 추가 실패:', err.message);
      }
    }

    console.log('📄 샘플 데이터 삽입 중...');

    const sampleEditorData = [
      {
        checklist_id: 1,
        no: 1,
        major_category: '보안',
        sub_category: '접근통제',
        title: '시스템 권한 점검',
        description: '시스템 사용자 권한이 적절히 설정되어 있는지 확인',
        evaluation: '대기',
        score: 0
      },
      {
        checklist_id: 1,
        no: 2,
        major_category: '보안',
        sub_category: '패스워드',
        title: '패스워드 정책 점검',
        description: '패스워드 복잡성 및 변경 주기 확인',
        evaluation: '대기',
        score: 0
      },
      {
        checklist_id: 1,
        no: 3,
        major_category: '시스템',
        sub_category: '백업',
        title: '데이터 백업 상태',
        description: '정기적인 백업 수행 여부 확인',
        evaluation: '대기',
        score: 0
      },
      {
        checklist_id: 1,
        no: 4,
        major_category: '네트워크',
        sub_category: '방화벽',
        title: '방화벽 설정 점검',
        description: '방화벽 규칙이 적절히 설정되어 있는지 확인',
        evaluation: '대기',
        score: 0
      },
      {
        checklist_id: 1,
        no: 5,
        major_category: '시스템',
        sub_category: '로그',
        title: '시스템 로그 모니터링',
        description: '시스템 로그가 정상적으로 기록되고 있는지 확인',
        evaluation: '대기',
        score: 0
      }
    ];

    for (const item of sampleEditorData) {
      const insertSQL = `
        INSERT INTO admin_checklist_editor (
          checklist_id, no, major_category, sub_category, title, description, evaluation, score
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8
        )
        ON CONFLICT (checklist_id, no) DO NOTHING;
      `;

      const values = [
        item.checklist_id,
        item.no,
        item.major_category,
        item.sub_category,
        item.title,
        item.description,
        item.evaluation,
        item.score
      ];

      await client.query(insertSQL, values);
      console.log(`✅ ${item.no}. ${item.title} 데이터 추가 완료`);
    }

    // 데이터 확인
    const selectResult = await client.query(`
      SELECT
        id, checklist_id, no, major_category, sub_category, title, description, evaluation, score,
        created_at, updated_at
      FROM admin_checklist_editor
      ORDER BY no;
    `);

    console.log('\n📋 추가된 데이터 확인:');
    selectResult.rows.forEach(row => {
      console.log(`  ${row.no}. [${row.major_category}/${row.sub_category}] ${row.title}`);
      console.log(`     평가: ${row.evaluation}, 점수: ${row.score}, 체크리스트ID: ${row.checklist_id}`);
      console.log(`     설명: ${row.description}`);
      console.log('');
    });

    console.log(`\n🎉 총 ${selectResult.rows.length}개의 체크리스트 에디터 데이터가 성공적으로 추가되었습니다.`);

    await client.end();

    // API 테스트 실행
    console.log('\n🧪 API 테스트 시작...');
    await testChecklistEditorAPI();

  } catch (error) {
    console.error('💥 데이터 삽입 실패:', error.message);
  }
}

async function testChecklistEditorAPI() {
  try {
    const { createClient } = require('@supabase/supabase-js');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );

    console.log('🔍 Supabase API 테스트...');

    // 1. 데이터 조회 테스트
    const { data: selectData, error: selectError } = await supabase
      .from('admin_checklist_editor')
      .select('*')
      .eq('checklist_id', 1)
      .order('no');

    if (selectError) {
      console.log('❌ 조회 테스트 실패:', selectError.message);
    } else {
      console.log('✅ 조회 테스트 성공:', selectData.length, '개 항목');
      console.log('📄 조회된 데이터:', selectData.map(item => `${item.no}. ${item.title}`));
    }

    // 2. 업데이트 테스트
    const { data: updateData, error: updateError } = await supabase
      .from('admin_checklist_editor')
      .update({
        evaluation: '진행',
        score: 80,
        updated_at: new Date().toISOString()
      })
      .eq('checklist_id', 1)
      .eq('no', 1)
      .select();

    if (updateError) {
      console.log('❌ 업데이트 테스트 실패:', updateError.message);
    } else {
      console.log('✅ 업데이트 테스트 성공:', updateData.length, '개 항목 수정');
    }

    // 3. 삽입 테스트
    const { data: insertData, error: insertError } = await supabase
      .from('admin_checklist_editor')
      .insert({
        checklist_id: 1,
        no: 6,
        major_category: '테스트',
        sub_category: 'API',
        title: 'API 테스트 항목',
        description: 'API 기능이 정상 작동하는지 테스트',
        evaluation: '대기',
        score: 0
      })
      .select();

    if (insertError) {
      console.log('❌ 삽입 테스트 실패:', insertError.message);
    } else {
      console.log('✅ 삽입 테스트 성공:', insertData.length, '개 항목 추가');
    }

    console.log('\n🎯 모든 API 테스트 완료!');

  } catch (error) {
    console.error('💥 API 테스트 실패:', error.message);
  }
}

// 스크립트 실행
insertSampleEditorData();