const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 환경 변수가 설정되지 않았습니다.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function migrateChecklistData() {
  try {
    console.log('🔄 마이그레이션 시작...\n');

    // 1. admin_checklist_management 데이터 마이그레이션
    console.log('📊 1단계: admin_checklist_management 데이터 마이그레이션');

    const { data: managementData, error: mgmtError } = await supabase
      .from('admin_checklist_management')
      .select('*')
      .eq('is_active', true);

    if (mgmtError) {
      console.error('❌ admin_checklist_management 조회 실패:', mgmtError);
    } else if (managementData && managementData.length > 0) {
      console.log(`  - ${managementData.length}개 체크리스트 발견`);

      for (const checklist of managementData) {
        console.log(`  - 체크리스트 ID ${checklist.id} 마이그레이션 중...`);

        // 개요 필드들을 플랫 구조로 변환
        const overviewFields = [
          { field_name: 'title', field_value: checklist.title || '' },
          { field_name: 'assignee', field_value: checklist.assignee || '' },
          { field_name: 'status', field_value: checklist.status || '' },
          { field_name: 'category', field_value: checklist.category || '' },
          { field_name: 'code', field_value: checklist.code || '' },
          { field_name: 'registration_date', field_value: checklist.registration_date || '' },
          { field_name: 'start_date', field_value: checklist.start_date || '' },
          { field_name: 'completed_date', field_value: checklist.completed_date || '' },
          { field_name: 'description', field_value: checklist.description || '' },
          { field_name: 'team', field_value: checklist.team || '' },
          { field_name: 'department', field_value: checklist.department || '' },
          { field_name: 'progress', field_value: String(checklist.progress || 0) }
        ];

        const overviewInserts = overviewFields.map((field, index) => ({
          checklist_id: checklist.id,
          data_type: 'overview',
          item_no: null,
          field_name: field.field_name,
          field_value: field.field_value,
          sequence_no: index,
          created_by: checklist.created_by || 'migration',
          updated_by: checklist.updated_by || 'migration',
          is_active: true
        }));

        const { error: insertError } = await supabase
          .from('admin_checklist_data')
          .insert(overviewInserts);

        if (insertError) {
          console.error(`    ❌ 개요 데이터 삽입 실패:`, insertError);
        } else {
          console.log(`    ✅ 개요 데이터 ${overviewInserts.length}개 필드 삽입 완료`);
        }
      }
    } else {
      console.log('  - 마이그레이션할 체크리스트가 없습니다.');
    }

    // 2. admin_checklist_editor 데이터 마이그레이션
    console.log('\n📊 2단계: admin_checklist_editor 데이터 마이그레이션');

    const { data: editorData, error: editorError } = await supabase
      .from('admin_checklist_editor')
      .select('*')
      .eq('is_active', true)
      .order('checklist_id', { ascending: true })
      .order('no', { ascending: true });

    if (editorError) {
      console.error('❌ admin_checklist_editor 조회 실패:', editorError);
    } else if (editorData && editorData.length > 0) {
      console.log(`  - ${editorData.length}개 에디터 항목 발견`);

      // checklist_id별로 그룹화
      const editorByChecklist = {};
      editorData.forEach(item => {
        if (!editorByChecklist[item.checklist_id]) {
          editorByChecklist[item.checklist_id] = [];
        }
        editorByChecklist[item.checklist_id].push(item);
      });

      for (const checklistId in editorByChecklist) {
        const items = editorByChecklist[checklistId];
        console.log(`  - 체크리스트 ID ${checklistId}: ${items.length}개 항목 마이그레이션 중...`);

        const editorInserts = [];

        items.forEach(item => {
          // 각 에디터 항목의 필드들을 플랫 구조로 변환
          const itemFields = [
            { field_name: 'major_category', field_value: item.major_category || '' },
            { field_name: 'sub_category', field_value: item.sub_category || '' },
            { field_name: 'title', field_value: item.title || '' },
            { field_name: 'description', field_value: item.description || '' },
            { field_name: 'evaluation', field_value: item.evaluation || '대기' },
            { field_name: 'score', field_value: String(item.score || 0) }
          ];

          itemFields.forEach((field, index) => {
            editorInserts.push({
              checklist_id: parseInt(checklistId),
              data_type: 'editor_item',
              item_no: item.no || item.id, // no가 없으면 id를 사용
              field_name: field.field_name,
              field_value: field.field_value,
              sequence_no: index,
              created_by: item.created_by || 'migration',
              updated_by: item.updated_by || 'migration',
              is_active: true
            });
          });
        });

        const { error: insertError } = await supabase
          .from('admin_checklist_data')
          .insert(editorInserts);

        if (insertError) {
          console.error(`    ❌ 에디터 데이터 삽입 실패:`, insertError);
        } else {
          console.log(`    ✅ 에디터 데이터 ${editorInserts.length}개 필드 삽입 완료`);
        }
      }
    } else {
      console.log('  - 마이그레이션할 에디터 항목이 없습니다.');
    }

    // 3. 마이그레이션 결과 확인
    console.log('\n📊 3단계: 마이그레이션 결과 확인');

    const { data: resultData, error: resultError } = await supabase
      .from('admin_checklist_data')
      .select('checklist_id, data_type')
      .order('checklist_id', { ascending: true });

    if (!resultError && resultData) {
      const summary = {};
      resultData.forEach(row => {
        const key = `${row.checklist_id}_${row.data_type}`;
        if (!summary[key]) {
          summary[key] = 0;
        }
        summary[key]++;
      });

      console.log('\n📈 마이그레이션 요약:');
      const checklistIds = [...new Set(resultData.map(r => r.checklist_id))];

      checklistIds.forEach(id => {
        const overviewCount = summary[`${id}_overview`] || 0;
        const editorCount = summary[`${id}_editor_item`] || 0;
        console.log(`  체크리스트 ${id}: 개요 ${overviewCount}개 필드, 에디터 ${editorCount}개 필드`);
      });
    }

    console.log('\n✅ 마이그레이션 완료!');
    console.log('📌 다음 단계:');
    console.log('  1. API 엔드포인트를 새 테이블 구조에 맞게 수정');
    console.log('  2. 프론트엔드 hooks를 플랫 구조 처리하도록 수정');
    console.log('  3. 기존 테이블은 백업 후 제거 가능');

  } catch (error) {
    console.error('❌ 마이그레이션 실패:', error);
    process.exit(1);
  }
}

// 실행
migrateChecklistData();